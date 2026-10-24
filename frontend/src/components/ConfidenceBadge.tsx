import React from 'react';
import { Info } from 'lucide-react';

interface ConfidenceBadgeProps {
  label?: 'LOW' | 'MEDIUM' | 'HIGH';
  basis?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ label = 'LOW', basis }) => {
  const styles = {
    HIGH: 'bg-emerald-950/40 text-emerald-400 border-emerald-700/50',
    MEDIUM: 'bg-sky-950/40 text-sky-400 border-sky-700/50',
    LOW: 'bg-slate-800 text-slate-400 border-slate-700',
  }[label];

  const tooltipText = basis
    ? `${basis} (Confidence reflects the strength and consistency of retrieved evidence; it is not a statistical probability.)`
    : 'Confidence reflects the strength and consistency of retrieved evidence; it is not a statistical probability.';

  return (
    <div
      className={`group relative inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium border cursor-help ${styles}`}
      title={tooltipText}
    >
      <span>Confidence: {label}</span>
      <Info className="h-3 w-3 text-slate-400 group-hover:text-white transition-colors" />

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-64 p-2 bg-navy-800 text-[11px] leading-relaxed text-slate-200 rounded-md border border-navy-600 shadow-xl z-50 pointer-events-none">
        {basis && <div className="font-semibold text-white mb-0.5">{basis}</div>}
        <div className="text-slate-400 italic">
          Confidence reflects the strength and consistency of the retrieved evidence. It is not a statistical probability.
        </div>
      </div>
    </div>
  );
};
