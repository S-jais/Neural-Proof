import React, { useState } from 'react';
import { Claim, Conflict } from '../types';
import { VerdictBadge } from './VerdictBadge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { PassageExcerpt } from './PassageExcerpt';
import { ConflictIndicator } from './ConflictIndicator';
import { ChevronDown, ChevronUp, FileText, AlertCircle, HelpCircle } from 'lucide-react';

interface ClaimCardProps {
  claim: Claim;
  conflicts?: Conflict[];
  defaultExpanded?: boolean;
}

export const ClaimCard: React.FC<ClaimCardProps> = ({
  claim,
  conflicts = [],
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Group evidence passages by stance
  const supportingEvidence = claim.evidence.filter((e) => e.stance === 'SUPPORTS');
  const contradictingEvidence = claim.evidence.filter((e) => e.stance === 'CONTRADICTS');
  const otherEvidence = claim.evidence.filter(
    (e) => e.stance !== 'SUPPORTS' && e.stance !== 'CONTRADICTS'
  );

  const hasConflicts = conflicts.length > 0;
  const isCompleted = claim.processingStatus === 'COMPLETED';

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        expanded
          ? 'border-navy-600 bg-navy-900 shadow-xl'
          : 'border-navy-750 bg-navy-850 hover:border-navy-650'
      }`}
    >
      {/* Header / Summary (Click to Toggle) */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
      >
        <div className="flex items-start gap-3 flex-1">
          <span className="shrink-0 font-mono text-xs font-bold px-2 py-1 rounded bg-navy-800 text-accent-cyan border border-navy-700">
            {claim.claimKey}
          </span>
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-medium text-slate-100 leading-snug">
              {claim.normalizedText || claim.originalText}
            </h4>
            {claim.claimType && (
              <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Type: {claim.claimType.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {isCompleted && claim.verdict && <VerdictBadge verdict={claim.verdict} />}
          {isCompleted && claim.confidenceLabel && (
            <ConfidenceBadge label={claim.confidenceLabel} basis={claim.confidenceBasis} />
          )}

          {!isCompleted && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40">
              {claim.processingStatus.replace(/_/g, ' ')}
            </span>
          )}

          <div className="flex items-center gap-1 text-xs text-slate-400 pl-1">
            <FileText className="h-3.5 w-3.5" />
            <span>{claim.evidence.length}</span>
          </div>

          <button
            type="button"
            className="p-1 rounded hover:bg-navy-750 text-slate-400 hover:text-white transition-colors"
            aria-label={expanded ? 'Collapse claim details' : 'Expand claim details'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Details Body */}
      {expanded && (
        <div className="border-t border-navy-750 px-4 sm:px-6 py-5 space-y-6 bg-navy-950/50">
          {/* Explanation Section */}
          {claim.explanation && (
            <div className="space-y-1.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-accent-cyan">
                Verification Assessment
              </h5>
              <p className="text-sm leading-relaxed text-slate-200">{claim.explanation}</p>
            </div>
          )}

          {/* Verdict Rationale */}
          {claim.verdictRationale && (
            <div className="rounded-lg bg-navy-850 p-3.5 border border-navy-750 space-y-1">
              <span className="text-xs font-semibold text-slate-300">Why this verdict:</span>
              <p className="text-xs text-slate-400 leading-relaxed">{claim.verdictRationale}</p>
            </div>
          )}

          {/* Conflicts Block */}
          {hasConflicts && <ConflictIndicator conflicts={conflicts} />}

          {/* Needed Qualifications or Unsupported Parts */}
          {claim.neededQualifications && claim.neededQualifications.length > 0 && (
            <div className="rounded-lg bg-amber-950/20 border border-amber-800/30 p-3.5 space-y-1.5">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Needed Qualifications
              </span>
              <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                {claim.neededQualifications.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Limitations and Uncertainty Notices */}
          {claim.limitations && claim.limitations.length > 0 && (
            <div className="rounded-lg bg-slate-900 border border-slate-800 p-3.5 space-y-1.5">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                Evidence Limitations
              </span>
              <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">
                {claim.limitations.map((limit, idx) => (
                  <li key={idx}>{limit}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Retrieved Evidence Excerpts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Retrieved Source Evidence ({claim.evidence.length})
              </h5>
            </div>

            {claim.evidence.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No passage evidence was extracted for this claim.
              </p>
            ) : (
              <div className="space-y-3">
                {/* Supporting evidence */}
                {supportingEvidence.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Supporting Passages ({supportingEvidence.length})
                    </span>
                    {supportingEvidence.map((ev) => (
                      <PassageExcerpt
                        key={ev.id}
                        evidence={ev}
                        highlightText={claim.normalizedText}
                      />
                    ))}
                  </div>
                )}

                {/* Contradicting evidence */}
                {contradictingEvidence.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                      Contradicting Passages ({contradictingEvidence.length})
                    </span>
                    {contradictingEvidence.map((ev) => (
                      <PassageExcerpt
                        key={ev.id}
                        evidence={ev}
                        highlightText={claim.normalizedText}
                      />
                    ))}
                  </div>
                )}

                {/* Other/Contextual evidence */}
                {otherEvidence.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Contextual / Background Passages ({otherEvidence.length})
                    </span>
                    {otherEvidence.map((ev) => (
                      <PassageExcerpt
                        key={ev.id}
                        evidence={ev}
                        highlightText={claim.normalizedText}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
