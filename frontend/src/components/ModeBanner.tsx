import React from 'react';
import { AlertTriangle, FileCode } from 'lucide-react';

interface ModeBannerProps {
  mode?: 'LIVE' | 'MOCK' | 'SAMPLE';
}

export const ModeBanner: React.FC<ModeBannerProps> = ({ mode = 'LIVE' }) => {
  if (mode === 'LIVE') return null;

  if (mode === 'MOCK') {
    return (
      <div className="bg-rose-950/90 border-b border-rose-700/60 text-rose-200 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 tracking-wide uppercase">
        <AlertTriangle className="h-4 w-4 text-rose-400" />
        <span>MOCK DATA MODE ACTIVE — Not evaluated against the live web. For offline testing only.</span>
      </div>
    );
  }

  if (mode === 'SAMPLE') {
    return (
      <div className="bg-sky-950/90 border-b border-sky-700/60 text-sky-200 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 tracking-wide uppercase">
        <FileCode className="h-4 w-4 text-sky-400" />
        <span>PRE-COMPUTED SAMPLE REPORT — Demonstration fixture. Not a real live verification run.</span>
      </div>
    );
  }

  return null;
};
