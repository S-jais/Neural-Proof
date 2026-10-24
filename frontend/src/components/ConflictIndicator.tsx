import React from 'react';
import { Conflict } from '../types';
import { GitCompare } from 'lucide-react';

interface ConflictIndicatorProps {
  conflicts: Conflict[];
}

export const ConflictIndicator: React.FC<ConflictIndicatorProps> = ({ conflicts }) => {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-600/40 bg-amber-950/20 p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
        <GitCompare className="h-4 w-4" />
        <span>Source Disagreement Detected ({conflicts.length})</span>
      </div>

      <div className="space-y-3">
        {conflicts.map((conf) => (
          <div key={conf.id} className="text-xs space-y-2 bg-navy-900/80 p-3 rounded border border-navy-750">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-200">
                Type: {conf.conflictType.replace(/_/g, ' ')}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  conf.resolution === 'UNRESOLVED'
                    ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                }`}
              >
                {conf.resolution.replace(/_/g, ' ')}
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed">{conf.description}</p>

            {conf.resolutionBasis && (
              <div className="text-[11px] text-slate-400 pt-1 border-t border-navy-800">
                <span className="font-semibold text-slate-300">Resolution Basis:</span> {conf.resolutionBasis}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
