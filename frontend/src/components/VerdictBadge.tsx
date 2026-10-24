import React from 'react';
import { VerdictType } from '../types';

interface VerdictBadgeProps {
  verdict?: VerdictType;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict }) => {
  if (!verdict) {
    return (
      <span className="chip" data-v="insufficient">
        <svg className="ic"><use href="#i-doc" /></svg>
        Unverified
      </span>
    );
  }

  switch (verdict) {
    case 'SUPPORTED':
      return (
        <span className="chip" data-v="ok">
          <svg className="ic"><use href="#i-ok" /></svg>
          Supported
        </span>
      );

    case 'CONTRADICTED':
      return (
        <span className="chip" data-v="bad">
          <svg className="ic"><use href="#i-bad" /></svg>
          Contradicted
        </span>
      );

    case 'PARTIALLY_SUPPORTED':
      return (
        <span className="chip" data-v="mid">
          <svg className="ic"><use href="#i-mid" /></svg>
          Nuanced
        </span>
      );

    case 'INSUFFICIENT_EVIDENCE':
      return (
        <span className="chip" data-v="insufficient">
          <svg className="ic"><use href="#i-doc" /></svg>
          Insufficient
        </span>
      );
  }
};
