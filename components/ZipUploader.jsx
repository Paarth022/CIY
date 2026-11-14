'use client';
import { useState, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { Upload, FileCode, FolderArchive, X, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

// Files we care about extracting
const ALLOWED_EXTENSIONS = new Set(['.java', '.yml', '.yaml', '.xml', '.properties', '.json', '.md', '.txt']);
// Paths/folders to skip
const SKIP_PATTERNS = [
  /^target\//i, /^\.git\//i, /^\.idea\//i, /^\.vscode\//i,
  /^build\//i, /node_modules/i, /\.class$/, /\.jar$/, /\.DS_Store/,
  /\/\./, // hidden files
];
// Credentials, keys, secrets — never send these to the AI.
const SECRET_PATTERNS = [
  /(^|\/)\.env($|\.)/i,
  /(^|\/)credentials?\.(json|ya?ml|xml|properties)$/i,
  /(^|\/)secrets?\.(json|ya?ml|xml|properties|txt)$/i,
  /(^|\/)(id_rsa|id_dsa|id_ecdsa|id_ed25519)($|\.)/i,
  /\.(pem|key|pfx|p12|jks|keystore|truststore|asc|gpg)$/i,
  /(^|\/)(auth|token|apikey|api_key|service[-_]account).*\.(json|ya?ml|txt)$/i,
  /(^|\/)(htpasswd|htdigest)$/i,
  /(^|\/)config\.(private|secret)\.(json|ya?ml)$/i,
];
const MAX_FILES              = 80;
const MAX_ZIP_MB             = 10;
const MAX_UNCOMPRESSED_MB    = 30;           // zip-bomb guard
const MAX_UNCOMPRESSED_BYTES = MAX_UNCOMPRESSED_MB * 1024 * 1024;
const MAX_PER_FILE_BYTES     = 200_000;      // matches server cap

function shouldSkip(path) {
  return SKIP_PATTERNS.some(p => p.test(path));
}

function isSecret(path) {
  return SECRET_PATTERNS.some(p => p.test(path));
}

function getExtension(filename) {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot).toLowerCase();
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
}

function FileTree({ files }) {
  const [expanded, setExpanded] = useState(true);
  const totalSize = Object.values(files).reduce((s, c) => s + c.length, 0);

  return (
    <div className="mt-3 mc-slot rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-white/70">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          <FolderArchive className="w-3.5 h-3.5 text-primary" />
          <span>{Object.keys(files).length} files extracted</span>
        </div>
        <span className="font-mono text-[10px] text-white/30">{formatBytes(totalSize)} total</span>
      </button>

      {expanded && (
        <div className="border-t border-white/5 max-h-48 overflow-y-auto custom-scrollbar">
          {Object.keys(files).sort().map(path => (
            <div key={path} className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/3 group">
              <FileCode className="w-3 h-3 text-primary/50 shrink-0" />
              <span className="font-mono text-[10px] text-white/50 group-hover:text-white/80 transition-colors truncate">
                {path}
              </span>
              <span className="ml-auto font-mono text-[9px] text-white/25 shrink-0">
                {formatBytes(files[path].length)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ZipUploader({ onFilesExtracted, onClear, accentColor = 'primary', label = 'Upload Source ZIP' }) {
  const [isDragging, setIsDragging]     = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedFiles, setExtracted]  = useState(null);
  const [fileName, setFileName]         = useState('');
  const [warning, setWarning]           = useState('');
  const fileInputRef = useRef(null);

  const accent = {
    primary: { border: 'border-primary/30', bg: 'bg-primary/5', text: 'text-primary', hover: 'hover:border-primary/60 hover:bg-primary/10' },
    red:     { border: 'border-red-500/30',  bg: 'bg-red-500/5',  text: 'text-red-400',  hover: 'hover:border-red-500/60 hover:bg-red-500/10' },
    blue:    { border: 'border-blue-500/30', bg: 'bg-blue-500/5', text: 'text-blue-400', hover: 'hover:border-blue-500/60 hover:bg-blue-500/10' },
  }[accentColor] || {};

  const processZip = useCallback(async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.zip')) {
      toast.error('Only .zip files are supported.');
      return;
    }
    const mbSize = file.size / (1024 * 1024);
    if (mbSize > MAX_ZIP_MB) {
      toast.error(`ZIP is too large (${mbSize.toFixed(1)}MB). Max is ${MAX_ZIP_MB}MB.`);
      return;
    }

    setIsProcessing(true);
    setWarning('');
    setFileName(file.name);

    try {
      const zip = await JSZip.loadAsync(file);
      const extracted   = {};
      const skipped     = [];
      const secretsHit  = [];
      let count         = 0;
      let uncompressed  = 0;
      let bombDetected  = false;

      for (const [path, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;

        // Defense: secrets first — skip even if the path would otherwise pass filters.
        if (isSecret(path)) { secretsHit.push(path); continue; }

        if (shouldSkip(path)) { skipped.push(path); continue; }
        const ext = getExtension(path.split('/').pop());
        if (!ALLOWED_EXTENSIONS.has(ext)) { skipped.push(path); continue; }
        if (count >= MAX_FILES) { skipped.push(path); continue; }

        try {
          const content = await entry.async('string');

          // Per-file cap — matches server sanitizer.
          if (content.length > MAX_PER_FILE_BYTES) { skipped.push(path); continue; }

          // Zip-bomb guard: abort the whole extraction if cumulative uncompressed size blows past the cap.
          uncompressed += content.length;
          if (uncompressed > MAX_UNCOMPRESSED_BYTES) {
            bombDetected = true;
            break;
          }

          // Normalize paths: strip leading folder name if all files are in one root folder
          const normalizedPath = path.replace(/^[^/]+\//, '');
          extracted[normalizedPath || path] = content;
          count++;
        } catch {
          // Binary or unreadable — skip
        }
      }

      if (bombDetected) {
        toast.error(`ZIP rejected: decompressed content exceeds ${MAX_UNCOMPRESSED_MB}MB (possible zip bomb).`);
        setIsProcessing(false);
        return;
      }

      if (Object.keys(extracted).length === 0) {
        toast.error('No readable source files found in this ZIP.');
        setIsProcessing(false);
        return;
      }

      const hasPluginFiles = Object.keys(extracted).some(path => {
        const lower = path.toLowerCase();
        return lower.endsWith('.java') || lower.endsWith('plugin.yml') || lower.endsWith('pom.xml') || lower.endsWith('build.gradle');
      });

      if (!hasPluginFiles) {
        toast.error('This appears to be a world save or generic folder. Please upload a valid plugin source code ZIP containing .java files.');
        setIsProcessing(false);
        return;
      }

      const warnParts = [];
      if (secretsHit.length > 0) {
        warnParts.push(`${secretsHit.length} secret/credential file(s) blocked — never uploaded to AI.`);
      }
      if (skipped.length > 0) {
        const skippedSrc = skipped.filter(p => ALLOWED_EXTENSIONS.has(getExtension(p.split('/').pop())));
        if (skippedSrc.length > 0) warnParts.push(`${skippedSrc.length} file(s) skipped (limit or size cap).`);
      }
      setWarning(warnParts.join(' '));
      setExtracted(extracted);
      onFilesExtracted(extracted);
      if (secretsHit.length > 0) {
        toast.warning(`Blocked ${secretsHit.length} secret file(s) from upload — safe.`);
      }
      toast.success(`Extracted ${count} files from ${file.name}`);
    } catch (err) {
      toast.error('Failed to read ZIP file. Is it a valid archive?');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [onFilesExtracted]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processZip(file);
  }, [processZip]);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) processZip(file);
  }, [processZip]);

  const handleClear = useCallback(() => {
    setExtracted(null);
    setFileName('');
    setWarning('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear?.();
  }, [onClear]);

  if (extractedFiles) {
    return (
      <div className={`rounded-xl border ${accent.border} ${accent.bg} p-4`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 ${accent.text}`} />
            <span className="font-bold text-sm text-white">{fileName}</span>
            <span className={`font-mono text-[10px] ${accent.text}/70`}>
              {Object.keys(extractedFiles).length} files loaded
            </span>
          </div>
          <button
            onClick={handleClear}
            className="p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Remove ZIP context"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {warning && (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80 mt-1">
            <AlertTriangle className="w-3 h-3" />
            {warning}
          </div>
        )}
        <FileTree files={extractedFiles} />
      </div>
    );
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 p-5 text-center
        ${isDragging
          ? `${accent.border.replace('/30', '/70')} ${accent.bg.replace('/5', '/15')} scale-[1.01]`
          : `border-white/10 hover:${accent.border} ${accent.hover}`
        }
        ${isProcessing ? 'opacity-60 pointer-events-none' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileInput}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-2">
        {isProcessing ? (
          <>
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                 style={{ borderColor: accentColor === 'red' ? '#ef4444' : accentColor === 'blue' ? '#3b82f6' : '#22c55e', borderTopColor: 'transparent' }} />
            <span className="text-xs text-white/50 font-mono">Extracting files...</span>
          </>
        ) : (
          <>
            <div className={`w-10 h-10 mc-slot rounded-lg flex items-center justify-center ${accent.text}`}>
              {isDragging ? <Upload className="w-5 h-5" /> : <FolderArchive className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-bold text-white/70">
                {isDragging ? 'Drop ZIP here' : label}
              </p>
              <p className="text-[10px] text-white/35 font-mono mt-0.5">
                .zip only · max {MAX_ZIP_MB}MB · Java, YAML, XML extracted
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
