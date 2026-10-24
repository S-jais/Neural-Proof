import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[var(--rule)] py-7 text-[var(--ink-2)] text-sm mt-auto">
      <div className="wrap">
        Neural Proof reports what the evidence says. Verdicts are not guarantees, so open the sources for anything that matters.
      </div>
    </footer>
  );
};
