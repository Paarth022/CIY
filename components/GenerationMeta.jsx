'use client';
import { Cpu, DollarSign, Zap, AlertTriangle, Shield } from 'lucide-react';

function formatUsd(n) {
  if (n == null) return '—';
  if (n < 0.001) return '<$0.001';
  if (n < 0.01)  return `$${n.toFixed(4)}`;
  return `$${n.toFixed(3)}`;
}

function formatTokens(n) {
  if (n == null) return '—';
  if (n < 1000)  return String(n);
  return `${(n / 1000).toFixed(1)}k`;
}

export default function GenerationMeta({ meta }) {
  if (!meta) return null;
  const {
    provider, model, rounds, truncated, tokens, costUsd, failover,
  } = meta;
  const failedOver = Array.isArray(failover) && failover.length > 0;

  return (
    <div className="mc-slot rounded-xl p-3 mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-mono">
      <span className="flex items-center gap-1.5 text-primary/80">
        <Cpu className="w-3 h-3" />
        <span className="uppercase tracking-widest">{provider}</span>
        <span className="text-white/40">· {model}</span>
      </span>

      {costUsd != null && (
        <span className="flex items-center gap-1.5 text-amber-400/80">
          <DollarSign className="w-3 h-3" />
          <span>{formatUsd(costUsd)}</span>
        </span>
      )}

      {tokens && (
        <span className="flex items-center gap-1.5 text-white/50">
          <Zap className="w-3 h-3" />
          <span>
            in {formatTokens(tokens.inputTokens)}
            {tokens.cachedInputTokens > 0 && <span className="text-green-400"> (cached {formatTokens(tokens.cachedInputTokens)})</span>}
            · out {formatTokens(tokens.outputTokens)}
          </span>
        </span>
      )}

      {rounds > 1 && (
        <span className="text-white/40">{rounds} rounds</span>
      )}

      {truncated && (
        <span className="flex items-center gap-1.5 text-red-400/90">
          <AlertTriangle className="w-3 h-3" />
          <span>output truncated — consider Advanced tier</span>
        </span>
      )}

      {failedOver && (
        <span className="flex items-center gap-1.5 text-orange-400/90" title={failover.map(f => `${f.provider}: ${f.error}`).join(' | ')}>
          <Shield className="w-3 h-3" />
          <span>failed over from {failover[0].provider}</span>
        </span>
      )}
    </div>
  );
}
