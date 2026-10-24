import React from 'react';
import { VerdictType } from '../types';
import { CheckCircle, XCircle, AlertCircle, HelpCircle } from 'lucide-react';

interface VerdictBadgeProps {
  verdict?: VerdictType;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, size = 'md' }) => {
  if (!verdict) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
        <HelpCircle className="h-3.5 w-3.5" />
        Unverified
      </span>
    );
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  }[size];

  switch (verdict) {
    case 'SUPPORTED':
      return (
        <span
          className={`inline-flex items-center rounded-full font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 ${sizeClasses}`}
        >
          <CheckCircle className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
          Supported
        </span>
      );

    case 'CONTRADICTED':
      return (
        <span
          className={`inline-flex items-center rounded-full font-medium bg-rose-950/60 text-rose-300 border border-rose-500/30 ${sizeClasses}`}
        >
          <XCircle className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
          Contradicted (Refuted)
        </span>
      );

    case 'PARTIALLY_SUPPORTED':
      return (
        <span
          className={`inline-flex items-center rounded-full font-medium bg-amber-950/60 text-amber-300 border border-amber-500/30 ${sizeClasses}`}
        >
          <AlertCircle className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
          Partially Supported (Revised)
        </span>
      );

    case 'INSUFFICIENT_EVIDENCE':
      return (
        <span
          className={`inline-flex items-center rounded-full font-medium bg-slate-800/80 text-slate-300 border border-slate-600/40 ${sizeClasses}`}
        >
          <HelpCircle className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
          Insufficient Evidence
        </span>
      );
  }
};
