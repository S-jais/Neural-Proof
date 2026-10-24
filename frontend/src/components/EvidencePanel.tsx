import React, { useState } from 'react';
import { EvidenceSource, Claim } from '../types';
import { Globe, ExternalLink, Calendar, CheckCircle2, AlertTriangle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface EvidencePanelProps {
  sources: EvidenceSource[];
  claims: Claim[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ sources, claims }) => {
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);

  if (!sources || sources.length === 0) {
    return (
      <div className="rounded-xl border border-navy-750 bg-navy-850 p-8 text-center space-y-2">
        <Globe className="h-8 w-8 text-slate-500 mx-auto" />
        <h4 className="text-sm font-semibold text-slate-300">No Sources Retrieved</h4>
        <p className="text-xs text-slate-400">
          Source provenance records will appear here as TinyFish retrieves web pages.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Globe className="h-4 w-4 text-accent-cyan" />
          Retrieved Live Web Sources ({sources.length})
        </h3>
        <span className="text-xs text-slate-400">Independent source-centric audit view</span>
      </div>

      <div className="space-y-3">
        {sources.map((source) => {
          const isExpanded = expandedUrl === source.url;
          const isSuccess = source.retrievalStatus === 'SUCCESS';

          // Find claims that cited this source
          const associatedClaims = claims.filter((c) =>
            c.evidence.some((e) => e.sourceUrl === source.url)
          );

          return (
            <div
              key={source.id}
              className="rounded-xl border border-navy-750 bg-navy-850 overflow-hidden transition-colors hover:border-navy-650"
            >
              <div
                onClick={() => setExpandedUrl(isExpanded ? null : source.url)}
                className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-semibold text-slate-100 hover:text-accent-cyan transition-colors flex items-center gap-1 group"
                    >
                      <span>{source.title || source.domain}</span>
                      <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-accent-cyan" />
                    </a>
                    <span className="text-xs font-mono text-slate-400">({source.domain})</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-navy-800 text-[10px] text-slate-300 font-medium">
                      {source.sourceClass.replace(/_/g, ' ')}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {source.publicationDate || 'Date unavailable'}
                    </span>
                    <span>•</span>
                    <span>Method: {source.retrievalMethod}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span
                    className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      isSuccess
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                        : 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                    }`}
                  >
                    {isSuccess ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {source.retrievalStatus}
                  </span>

                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <FileText className="h-3 w-3" />
                    {associatedClaims.length} claim{associatedClaims.length !== 1 ? 's' : ''}
                  </span>

                  <button type="button" className="p-1 text-slate-400">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-navy-750 p-4 bg-navy-950/60 space-y-3 text-xs">
                  {source.failureReason && (
                    <div className="p-2.5 rounded bg-rose-950/30 border border-rose-800/40 text-rose-300">
                      <span className="font-semibold">Retrieval Failure Reason:</span> {source.failureReason}
                    </div>
                  )}

                  {source.snippet && (
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-300">Search Snippet:</span>
                      <p className="text-slate-400 leading-relaxed italic bg-navy-900 p-2.5 rounded border border-navy-800">
                        "{source.snippet}"
                      </p>
                    </div>
                  )}

                  {associatedClaims.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="font-semibold text-slate-300">Cited in Claims:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {associatedClaims.map((c) => (
                          <span
                            key={c.id}
                            className="px-2 py-0.5 rounded bg-navy-850 text-accent-cyan border border-navy-700 font-mono text-[11px]"
                          >
                            {c.claimKey}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 pt-2 border-t border-navy-800 flex justify-between">
                    <span>Content size: {source.contentCharCount || 0} characters</span>
                    <span>Direct URL: {source.normalizedUrl}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
