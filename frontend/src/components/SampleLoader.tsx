import React from 'react';
import { Sparkles } from 'lucide-react';

interface SampleLoaderProps {
  onSelectSample: (text: string, context?: string) => void;
}

export const SAMPLES = [
  {
    title: 'Absolute Claim: Solar Environmental Impact',
    badge: 'Contradicted / Absolute',
    text: 'Solar energy generation has zero environmental impact and creates absolutely no greenhouse gas emissions throughout its entire lifecycle.',
    context: 'Renewable energy lifecycle analysis',
  },
  {
    title: 'Multi-Claim Technology & Science Paragraph',
    badge: 'Multi-Claim (True / False / Nuanced)',
    text: 'The James Webb Space Telescope was successfully launched on December 25, 2021. It orbits the Earth at an altitude of 400 kilometers in low Earth orbit. Its primary mirror is 6.5 meters in diameter and is coated in microscopic gold to optimize infrared observation.',
    context: 'Space astronomy and telescopes',
  },
  {
    title: 'Time-Sensitive Policy / Eligibility Claim',
    badge: 'Time-Sensitive / Policy',
    text: 'The United States federal solar tax credit allows homeowners to deduct 30% of their solar installation costs through 2034 under current federal law.',
    context: 'US Clean Energy Tax Credits',
  },
];

export const SampleLoader: React.FC<SampleLoaderProps> = ({ onSelectSample }) => {
  return (
    <div className="rounded-xl border border-navy-750 bg-navy-850 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-cyan">
        <Sparkles className="h-4 w-4" />
        <span>Load Sample Input for Live Demonstration</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {SAMPLES.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectSample(sample.text, sample.context)}
            className="text-left p-3 rounded-lg border border-navy-700 bg-navy-900/60 hover:bg-navy-800 hover:border-accent-cyan/40 transition-all space-y-1.5 group"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-slate-200 group-hover:text-accent-cyan transition-colors">
                {sample.title}
              </span>
            </div>
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-navy-800 text-slate-400 border border-navy-750">
              {sample.badge}
            </span>
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              "{sample.text}"
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
