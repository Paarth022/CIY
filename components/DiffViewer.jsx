'use client';
import { useMemo, useState } from 'react';
import { FileCode, ArrowLeftRight, Plus, Minus } from 'lucide-react';

// Lightweight LCS-based line diff. Produces { type: 'eq'|'add'|'del', a, b, text } rows.
// Good enough for a few-hundred-line Java files; for very large inputs we degrade gracefully.
function diffLines(oldText = '', newText = '') {
  const a = (oldText || '').split('\n');
  const b = (newText || '').split('\n');

  // Bail on huge files to avoid O(n*m) blowing up the browser.
  if (a.length * b.length > 2_000_000) {
    return [
      ...a.map((line, i) => ({ type: 'del', a: i + 1, b: null, text: line })),
      ...b.map((line, i) => ({ type: 'add', a: null, b: i + 1, text: line })),
    ];
  }

  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const rows = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      rows.push({ type: 'eq', a: i + 1, b: j + 1, text: a[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: 'del', a: i + 1, b: null, text: a[i] });
      i++;
    } else {
      rows.push({ type: 'add', a: null, b: j + 1, text: b[j] });
      j++;
    }
  }
  while (i < m) { rows.push({ type: 'del', a: i + 1, b: null, text: a[i] }); i++; }
  while (j < n) { rows.push({ type: 'add', a: null, b: j + 1, text: b[j] }); j++; }
  return rows;
}

function countChanges(rows) {
  let adds = 0, dels = 0;
  for (const r of rows) { if (r.type === 'add') adds++; else if (r.type === 'del') dels++; }
  return { adds, dels };
}

// Props:
//   originalCode:  the single .java file the user pasted in (before migration)
//   files:         the full updated file map returned by the AI
//   fromVersion / toVersion: just for the header label
export default function DiffViewer({ originalCode, files, fromVersion, toVersion }) {
  const updatedJavaEntries = useMemo(() => {
    if (!files) return [];
    return Object.entries(files).filter(([name]) => name.endsWith('.java'));
  }, [files]);

  const [selected, setSelected] = useState(updatedJavaEntries[0]?.[0] || null);

  const activeEntry   = updatedJavaEntries.find(([n]) => n === selected) || updatedJavaEntries[0] || null;
  const activeName    = activeEntry?.[0] || '';
  const activeContent = activeEntry?.[1] || '';
  const rows = useMemo(
    () => (originalCode && activeContent ? diffLines(originalCode, activeContent) : []),
    [originalCode, activeContent]
  );

  if (!originalCode || updatedJavaEntries.length === 0) {
    return (
      <div className="mc-slot rounded-xl p-4 text-center text-white/40 text-xs font-mono">
        No diff available — need both original code and migrated Java output.
      </div>
    );
  }

  const { adds, dels } = countChanges(rows);

  return (
    <div className="mc-slot rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b border-white/5 bg-white/[0.02]">
        <span className="flex items-center gap-1.5 text-blue-400 font-pixel text-[10px] tracking-widest">
          <ArrowLeftRight className="w-3 h-3" />
          DIFF · {fromVersion} → {toVersion}
        </span>
        <span className="text-[10px] font-mono text-white/40">{activeName}</span>
        <span className="ml-auto flex items-center gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-green-400"><Plus className="w-3 h-3" />{adds}</span>
          <span className="flex items-center gap-1 text-red-400"><Minus className="w-3 h-3" />{dels}</span>
        </span>
      </div>

      {updatedJavaEntries.length > 1 && (
        <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-white/5 bg-black/20">
          {updatedJavaEntries.map(([name]) => (
            <button
              key={name}
              onClick={() => setSelected(name)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                name === activeName
                  ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                  : 'bg-white/[0.02] border border-white/5 text-white/50 hover:text-white/80'
              }`}
            >
              <FileCode className="w-3 h-3" />
              {name.split('/').pop()}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-[520px] overflow-auto font-mono text-[11px] leading-[1.5]">
        {rows.map((r, idx) => (
          <div
            key={idx}
            className={
              r.type === 'add' ? 'flex bg-green-500/[0.08] text-green-200/95'
              : r.type === 'del' ? 'flex bg-red-500/[0.08] text-red-200/95'
              : 'flex text-white/55'
            }
          >
            <span className="w-10 shrink-0 px-1 text-right text-white/25 select-none">{r.a ?? ''}</span>
            <span className="w-10 shrink-0 px-1 text-right text-white/25 select-none border-r border-white/5">{r.b ?? ''}</span>
            <span className="w-4 shrink-0 text-center select-none">
              {r.type === 'add' ? '+' : r.type === 'del' ? '−' : ' '}
            </span>
            <pre className="flex-1 whitespace-pre px-2">{r.text || ' '}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
