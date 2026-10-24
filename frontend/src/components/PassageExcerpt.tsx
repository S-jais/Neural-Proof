import React from 'react';
import { ClaimEvidence } from '../types';
import { ExternalLink, Calendar, Clock, Globe } from 'lucide-react';

interface PassageExcerptProps {
  evidence: ClaimEvidence;
  highlightText?: string;
}

export const PassageExcerpt: React.FC<PassageExcerptProps> = ({ evidence, highlightText }) => {
  // Stance badge
  const stanceBadge = {
    SUPPORTS: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    CONTRADICTS: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
    PARTIAL: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
    CONTEXT: 'bg-sky-950/60 text-sky-300 border-sky-500/30',
    NOT_CITED: 'bg-slate-800 text-slate-400 border-slate-700',
  }[evidence.stance];

  // Retrieval method badge
  const methodBadge = {
    FETCH: 'bg-teal-950/40 text-teal-300 border-teal-700/50',
    SEARCH_SNIPPET: 'bg-slate-800 text-slate-300 border-slate-600',
    AGENT: 'bg-purple-950/40 text-purple-300 border-purple-700/50',
  }[evidence.retrievalMethod || 'FETCH'];

  // Plain-text highlighting without dangerouslySetInnerHTML (G2)
  const renderHighlightedText = (text: string, query?: string) => {
    if (!query || query.trim().length < 3) {
      return text;
    }
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-accent-cyan/25 text-white font-medium rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="rounded-lg border border-navy-700 bg-navy-850 p-4 space-y-3 transition-colors hover:border-navy-600">
      {/* Header with Source, Domain, Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-750 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Globe className="h-4 w-4 text-accent-cyan shrink-0" />
          <a
            href={evidence.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-slate-100 hover:text-accent-cyan transition-colors flex items-center gap-1 group"
          >
            <span>{evidence.sourceTitle || evidence.sourceDomain}</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-accent-cyan transition-colors" />
          </a>
          <span className="text-xs text-slate-400 font-mono">({evidence.sourceDomain})</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Stance */}
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${stanceBadge}`}>
            {evidence.stance}
          </span>

          {/* Retrieval Method */}
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${methodBadge}`}>
            {evidence.retrievalMethod === 'FETCH' ? 'Fetched Page' : evidence.retrievalMethod === 'SEARCH_SNIPPET' ? 'Search Snippet Only' : 'Agent'}
          </span>

          {/* Source Class (labeled heuristic) */}
          {evidence.sourceClass && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-navy-800 text-slate-300 border border-navy-700 cursor-help"
              title="Automated domain heuristic classification"
            >
              {evidence.sourceClass.replace(/_/g, ' ')} <span className="text-slate-400 italic">(heuristic)</span>
            </span>
          )}
        </div>
      </div>

      {/* Verbatim Passage Text */}
      <blockquote className="border-l-2 border-accent-cyan/60 pl-3.5 py-0.5 text-sm leading-relaxed text-slate-200 font-normal italic">
        "{renderHighlightedText(evidence.passageText, highlightText)}"
      </blockquote>

      {/* Evaluator Note if present */}
      {evidence.note && (
        <div className="text-xs text-slate-300 bg-navy-900/60 rounded p-2 border border-navy-800/80">
          <span className="font-semibold text-accent-teal">Evaluator Note:</span> {evidence.note}
        </div>
      )}

      {/* Provenance Footer: Publication vs Retrieved Timestamps */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[11px] text-slate-400 border-t border-navy-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" title="Official or parsed publication date">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>Published: {evidence.publicationDate || 'Date unavailable'}</span>
          </div>

          {evidence.lastUpdatedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span>Updated: {evidence.lastUpdatedDate}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1" title="Exact timestamp when TinyFish fetched this content">
          <Clock className="h-3 w-3 text-accent-cyan/80" />
          <span>Retrieved: Live Web via TinyFish</span>
        </div>
      </div>
    </div>
  );
};
