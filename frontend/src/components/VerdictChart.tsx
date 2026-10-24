import React, { useEffect, useState } from 'react';

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
  const { supported, contradicted, partiallySupported, insufficientEvidence } = counts;
  const total = supported + contradicted + partiallySupported + insufficientEvidence;
  const [barIn, setBarIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBarIn(true), 50);
    return () => clearTimeout(timer);
  }, [counts]);

  if (total === 0) {
    return (
      <div className="sheet p-5 text-center text-sm text-[var(--ink-2)]">
        No claims evaluated yet.
      </div>
    );
  }

  return (
    <section className="sheet dist" aria-label="Verdict distribution">
      <div
        className={`dist-bar ${barIn ? 'in' : ''}`}
        role="img"
        aria-label={`${supported} supported, ${partiallySupported} nuanced, ${contradicted} contradicted`}
      >
        {supported > 0 && <i data-v="ok" style={{ ['--n' as any]: supported }} title={`Supported: ${supported}`} />}
        {partiallySupported > 0 && <i data-v="mid" style={{ ['--n' as any]: partiallySupported }} title={`Nuanced: ${partiallySupported}`} />}
        {contradicted > 0 && <i data-v="bad" style={{ ['--n' as any]: contradicted }} title={`Contradicted: ${contradicted}`} />}
        {insufficientEvidence > 0 && <i data-v="insufficient" style={{ ['--n' as any]: insufficientEvidence }} title={`Insufficient: ${insufficientEvidence}`} />}
      </div>
      <div className="legend">
        <span data-v="ok">
          Supported <b>{supported}</b>
        </span>
        <span data-v="mid">
          Nuanced <b>{partiallySupported}</b>
        </span>
        <span data-v="bad">
          Contradicted <b>{contradicted}</b>
        </span>
        {insufficientEvidence > 0 && (
          <span data-v="insufficient">
            Insufficient <b>{insufficientEvidence}</b>
          </span>
        )}
      </div>
    </section>
  );
};
