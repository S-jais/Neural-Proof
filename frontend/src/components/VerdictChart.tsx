import React from 'react';

interface VerdictChartProps {
  counts: {
    totalClaims: number;
    supported: number;
    contradicted: number;
    partiallySupported: number;
    insufficientEvidence: number;
    notCompleted?: number;
  };
}

export const VerdictChart: React.FC<VerdictChartProps> = ({ counts }) => {
  const { supported, contradicted, partiallySupported, insufficientEvidence, notCompleted = 0 } = counts;
  const total = supported + contradicted + partiallySupported + insufficientEvidence + notCompleted;

  if (total === 0) {
    return (
      <div className="p-4 rounded-xl border border-navy-750 bg-navy-850 text-center text-xs text-slate-400">
        No claims evaluated yet.
      </div>
    );
  }

  const pSup = (supported / total) * 100;
  const pCon = (contradicted / total) * 100;
  const pPart = (partiallySupported / total) * 100;
  const pIns = (insufficientEvidence / total) * 100;
  const pNot = (notCompleted / total) * 100;

  return (
    <div className="rounded-xl border border-navy-750 bg-navy-850 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-200">Verdict Distribution</h4>
        <span className="text-xs text-slate-400 font-mono">{total} claims checked</span>
      </div>

      {/* Segmented Distribution Bar */}
      <div className="h-4 w-full rounded-full overflow-hidden flex bg-navy-950 border border-navy-700">
        {supported > 0 && (
          <div
            style={{ width: `${pSup}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Supported: ${supported}`}
          />
        )}
        {partiallySupported > 0 && (
          <div
            style={{ width: `${pPart}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`Partially Supported: ${partiallySupported}`}
          />
        )}
        {contradicted > 0 && (
          <div
            style={{ width: `${pCon}%` }}
            className="bg-rose-500 transition-all duration-500"
            title={`Contradicted: ${contradicted}`}
          />
        )}
        {insufficientEvidence > 0 && (
          <div
            style={{ width: `${pIns}%` }}
            className="bg-slate-500 transition-all duration-500"
            title={`Insufficient Evidence: ${insufficientEvidence}`}
          />
        )}
        {notCompleted > 0 && (
          <div
            style={{ width: `${pNot}%` }}
            className="bg-navy-600 transition-all duration-500"
            title={`Not Completed: ${notCompleted}`}
          />
        )}
      </div>

      {/* Legend with Counts (NOT percentages) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-slate-300 font-medium">Supported:</span>
          <span className="font-bold text-white ml-auto">{supported}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
          <span className="text-slate-300 font-medium">Contradicted:</span>
          <span className="font-bold text-white ml-auto">{contradicted}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
          <span className="text-slate-300 font-medium">Partially Supported:</span>
          <span className="font-bold text-white ml-auto">{partiallySupported}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-500 shrink-0" />
          <span className="text-slate-300 font-medium">Insufficient Evidence:</span>
          <span className="font-bold text-white ml-auto">{insufficientEvidence}</span>
        </div>
      </div>

      {/* Mandatory Disclaimer from Part F4 */}
      <p className="text-[11px] text-slate-400 italic text-center pt-2 border-t border-navy-750">
        Distribution of verdicts across the claims checked. This is not an accuracy score.
      </p>
    </div>
  );
};
