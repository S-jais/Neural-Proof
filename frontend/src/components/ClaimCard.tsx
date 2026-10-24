import React, { useState } from 'react';
import { Claim, Conflict } from '../types';
import { VerdictBadge } from './VerdictBadge';
import { ConfidenceBadge } from './ConfidenceBadge';

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

  const getVerdictDataV = (v?: string) => {
    switch (v) {
      case 'SUPPORTED':
        return 'ok';
      case 'CONTRADICTED':
        return 'bad';
      case 'PARTIALLY_SUPPORTED':
        return 'mid';
      default:
        return 'insufficient';
    }
  };

  const vCode = getVerdictDataV(claim.verdict);
  const text = claim.normalizedText || claim.originalText;
  const sourcesCount = claim.evidence ? claim.evidence.length : 0;

  return (
    <li className="claim-item" data-v={vCode}>
      <button
        className="claim-btn"
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        <VerdictBadge verdict={claim.verdict} />
        <span className="claim-text">{text}</span>
        <span className="meta">{sourcesCount} {sourcesCount === 1 ? 'source' : 'sources'}</span>
        <svg className="ic chev"><use href="#i-chev" /></svg>
      </button>

      <div className="panel" role="region">
        <div className="panel-in">
          {claim.reasoning && (
            <>
              <h4>Why this verdict</h4>
              <p>{claim.reasoning}</p>
            </>
          )}

          {conflicts.length > 0 && (
            <div
              className="note"
              style={{
                borderColor: 'var(--mid)',
                background: 'var(--mid-wash)',
                margin: '12px 0'
              }}
            >
              <b>Source conflict detected:</b>
              {conflicts.map((c, i) => (
                <div key={i} className="text-xs mt-1">
                  {c.description || 'Sources disagree on this factual statement.'}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0 6px' }}>
            <h4 style={{ margin: 0 }}>Evidence & Sources</h4>
            {claim.confidenceScore !== undefined && (
              <ConfidenceBadge score={claim.confidenceScore} />
            )}
          </div>

          {claim.evidence && claim.evidence.length > 0 ? (
            <ul>
              {claim.evidence.map((ev, idx) => {
                const domain = ev.sourceDomain || (ev.url ? new URL(ev.url).hostname : 'web source');
                return (
                  <li key={idx} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="src" style={{ fontSize: '0.75rem', padding: '1px 8px' }}>
                        <svg className="ic"><use href="#i-globe" /></svg>
                        {domain}
                      </span>
                      {ev.url ? (
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[var(--blue)] hover:underline"
                        >
                          {ev.sourceTitle || domain}
                        </a>
                      ) : (
                        <strong>{ev.sourceTitle || domain}</strong>
                      )}
                    </div>
                    {ev.verbatimPassage && (
                      <p
                        className="text-sm font-doc italic text-[var(--ink-2)]"
                        style={{ marginTop: '4px', borderLeft: '2px solid var(--rule)', paddingLeft: '8px' }}
                      >
                        "{ev.verbatimPassage}"
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-[var(--ink-2)]">
              No evidence passages retrieved yet for this claim.
            </p>
          )}
        </div>
      </div>
    </li>
  );
};
