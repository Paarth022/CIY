// Server-side sanitizer for ZIP-uploaded file maps.
// Defense in depth: client already filters secrets + enforces caps, but we never trust the client.

const MAX_ZIP_FILES       = 80;
const MAX_ZIP_FILE_CHARS  = 200_000;
const MAX_ZIP_TOTAL_CHARS = 1_500_000;

// Credentials, keys, secrets — must match client's list in components/ZipUploader.jsx
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

function isSecretPath(path) {
  return SECRET_PATTERNS.some(p => p.test(path));
}

export function sanitizeZipFiles(files) {
  if (!files || typeof files !== 'object') return null;
  const keys = Object.keys(files);
  if (keys.length === 0 || keys.length > MAX_ZIP_FILES) return null;

  const clean = {};
  let total = 0;
  let hasPluginFiles = false;

  for (const key of keys) {
    if (typeof key !== 'string' || !key || key.length > 512) continue;
    if (key.includes('..') || key.includes('\0')) continue;
    if (isSecretPath(key)) continue;              // backstop: drop secrets even if client missed them
    
    if (key.endsWith('.java') || key.endsWith('plugin.yml') || key.endsWith('pom.xml') || key.endsWith('build.gradle') || key.endsWith('.kt')) {
      hasPluginFiles = true;
    }

    const content = files[key];
    if (typeof content !== 'string' || content.length > MAX_ZIP_FILE_CHARS) continue;
    total += content.length;
    if (total > MAX_ZIP_TOTAL_CHARS) break;
    clean[key] = content;
  }

  const finalKeys = Object.keys(clean);
  if (finalKeys.length > 0 && !hasPluginFiles) {
    throw new Error('INVALID_ZIP: This appears to be a world save or generic folder. Please upload a valid plugin source code ZIP containing .java files.');
  }

  return finalKeys.length ? clean : null;
}
