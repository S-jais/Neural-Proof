import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { VerificationRun, PipelineEvent } from '../types';
import { ProgressBar } from '../components/ProgressBar';
import { EventFeed } from '../components/EventFeed';
import { ClaimCard } from '../components/ClaimCard';
import { EvidencePanel } from '../components/EvidencePanel';
import { VerdictChart } from '../components/VerdictChart';
import { ExportMenu } from '../components/ExportMenu';
import { ModeBanner } from '../components/ModeBanner';
import {
  ShieldCheck,
  AlertTriangle,
  Search,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const RunPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [run, setRun] = useState<VerificationRun | null>(null);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states for Dashboard
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerdictFilter, setSelectedVerdictFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'claims' | 'sources'>('claims');

  // Claim review inclusion state
  const [selectedClaimIds, setSelectedClaimIds] = useState<Set<string>>(new Set());
  const [resuming, setResuming] = useState(false);

  // Polling loop
  useEffect(() => {
    if (!id) return;

    let timer: ReturnType<typeof setTimeout>;
    let isCancelled = false;

    const fetchRunData = async () => {
      try {
        const data = await api.getVerification(id);
        if (!isCancelled) {
          setRun(data);
          setError(null);

          // In AWAITING_CLAIM_REVIEW, pre-select included claims
          if (data.status === 'AWAITING_CLAIM_REVIEW' && selectedClaimIds.size === 0) {
            const initialIncluded = new Set(
              data.claims.filter((c) => c.included).map((c) => c.id)
            );
            setSelectedClaimIds(initialIncluded);
          }
        }

        // Fetch events
        const evs = await api.getEvents(id);
        if (!isCancelled) {
          setEvents(evs);
        }

        // Check if run reached a terminal state
        const isTerminal =
          data.status === 'COMPLETED' ||
          data.status === 'PARTIAL' ||
          data.status === 'FAILED' ||
          data.status === 'TIMED_OUT' ||
          data.status === 'AWAITING_CLAIM_REVIEW';

        if (!isTerminal && !isCancelled) {
          timer = setTimeout(fetchRunData, 1800);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to fetch verification status');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchRunData();

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  if (loading && !run) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="h-8 w-8 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Loading verification report...</p>
      </div>
    );
  }

  if (error && !run) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Verification Not Found</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <Link
          to="/verify"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-800 text-xs font-semibold text-slate-200 border border-navy-700 hover:text-white"
        >
          Return to Workspace
        </Link>
      </div>
    );
  }

  if (!run) return null;

  // Toggle claim inclusion during review
  const handleToggleClaim = (claimId: string) => {
    const updated = new Set(selectedClaimIds);
    if (updated.has(claimId)) {
      updated.delete(claimId);
    } else {
      updated.add(claimId);
    }
    setSelectedClaimIds(updated);
  };

  // Start verification after review
  const handleStartVerification = async () => {
    setResuming(true);
    try {
      await api.startVerification(run.id, Array.from(selectedClaimIds));
      // Refresh run immediately
      const updatedRun = await api.getVerification(run.id);
      setRun(updatedRun);
    } catch (err: any) {
      setError(err.message || 'Failed to resume verification');
    } finally {
      setResuming(false);
    }
  };

  // Filtered claims for dashboard
  const filteredClaims = run.claims.filter((c) => {
    if (selectedVerdictFilter !== 'ALL' && c.verdict !== selectedVerdictFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const textMatch = (c.normalizedText || c.originalText).toLowerCase().includes(q);
      const explanationMatch = c.explanation ? c.explanation.toLowerCase().includes(q) : false;
      return textMatch || explanationMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20">
      <ModeBanner mode={run.mode} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-navy-800 text-accent-cyan border border-navy-700">
                Run #{run.id.slice(0, 8)}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  run.status === 'COMPLETED'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                    : run.status === 'AWAITING_CLAIM_REVIEW'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                    : run.status === 'PARTIAL'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                    : run.status === 'FAILED'
                    ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                    : 'bg-navy-800 text-slate-300 border-navy-700 animate-pulse'
                }`}
              >
                {run.status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : 'In progress'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {run.inputType === 'QUESTION' ? 'Question Verification' : 'AI Answer Verification'}
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <ExportMenu run={run} />
          </div>
        </div>

        {/* Provisional Generated Answer (in Question Mode) */}
        {run.generatedAnswer && (
          <div className="rounded-xl border border-navy-750 bg-navy-900/80 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-accent-cyan flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Provisional AI Answer ({run.generationModel || 'AI Model'})
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40 font-semibold">
                AI-Generated • Unverified
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed italic">
              "{run.generatedAnswer}"
            </p>
          </div>
        )}

        {/* =========================================================================
            STAGE 1: CLAIM REVIEW MODE (if AWAITING_CLAIM_REVIEW)
           ========================================================================= */}
        {run.status === 'AWAITING_CLAIM_REVIEW' ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-accent-cyan/30 bg-navy-850 p-6 space-y-4 shadow-xl shadow-accent-cyan/5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-accent-cyan" />
                    Review Extracted Factual Claims ({run.claims.length})
                  </h3>
                  <p className="text-xs text-slate-300">
                    The autonomous claim extractor identified the following assertions. Select which claims you want to verify against live web evidence.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartVerification}
                  disabled={selectedClaimIds.size === 0 || resuming}
                  className="px-5 py-2.5 rounded-lg font-bold text-xs bg-gradient-to-r from-accent-cyan to-accent-teal text-navy-950 hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shrink-0"
                >
                  {resuming ? (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-navy-950 border-t-transparent animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Start Verification ({selectedClaimIds.size} included)
                </button>
              </div>

              {/* Claims Review List */}
              <div className="space-y-3 pt-2">
                {run.claims.map((claim) => {
                  const isChecked = selectedClaimIds.has(claim.id);

                  return (
                    <div
                      key={claim.id}
                      onClick={() => handleToggleClaim(claim.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 select-none ${
                        isChecked
                          ? 'border-accent-cyan/40 bg-navy-800'
                          : 'border-navy-750 bg-navy-900/60 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent div
                        className="mt-1 h-4 w-4 rounded border-navy-600 bg-navy-900 text-accent-cyan focus:ring-accent-cyan cursor-pointer shrink-0"
                      />

                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-accent-cyan">
                            {claim.claimKey}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-navy-750 text-slate-300">
                            {claim.claimType.replace(/_/g, ' ')}
                          </span>
                          {claim.isTimeSensitive && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                              Time-Sensitive
                            </span>
                          )}
                          {!claim.isVerifiable && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              Non-Verifiable ({claim.nonVerifiableReason || 'Opinion'})
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-medium text-slate-100 leading-snug">
                          {claim.normalizedText || claim.originalText}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              STAGE 2: LIVE PROGRESS & VERIFICATION DASHBOARD
             ========================================================================= */
          <div className="space-y-8">
            {/* Progress tracker */}
            <ProgressBar status={run.status} currentStage={run.currentStage} />

            {/* Event log feed while running or partial */}
            {run.status !== 'COMPLETED' && <EventFeed events={events} />}

            {/* Overall Summary Card */}
            {run.summary?.text && (
              <div className="rounded-xl border border-navy-750 bg-navy-850 p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-accent-cyan">
                    Executive Verification Summary
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    Method: {run.summary.method || 'Deterministic'}
                  </span>
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-slate-200 font-normal">
                  {run.summary.text}
                </p>
              </div>
            )}

            {/* Verdict Distribution Chart */}
            <VerdictChart counts={run.counts} />

            {/* Navigation Tabs between Claims view and Sources view */}
            <div className="flex items-center justify-between border-b border-navy-850 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('claims')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'claims'
                      ? 'bg-navy-750 text-accent-cyan border border-navy-650'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Claims & Evidence ({run.claims.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('sources')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'sources'
                      ? 'bg-navy-750 text-accent-cyan border border-navy-650'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Retrieved Sources Audit
                </button>
              </div>

              {activeTab === 'claims' && (
                <div className="flex items-center gap-3">
                  {/* Search query input */}
                  <div className="relative hidden sm:block">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search claims..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1 rounded-md bg-navy-900 border border-navy-750 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent-cyan w-48"
                    />
                  </div>

                  {/* Verdict Filter */}
                  <select
                    value={selectedVerdictFilter}
                    onChange={(e) => setSelectedVerdictFilter(e.target.value)}
                    className="px-2.5 py-1 rounded-md bg-navy-900 border border-navy-750 text-xs text-slate-300 focus:outline-none focus:border-accent-cyan cursor-pointer"
                  >
                    <option value="ALL">All Verdicts</option>
                    <option value="SUPPORTED">Supported</option>
                    <option value="CONTRADICTED">Contradicted</option>
                    <option value="PARTIALLY_SUPPORTED">Partially Supported</option>
                    <option value="INSUFFICIENT_EVIDENCE">Insufficient Evidence</option>
                  </select>
                </div>
              )}
            </div>

            {/* Tab 1: Claims List */}
            {activeTab === 'claims' && (
              <div className="space-y-4">
                {filteredClaims.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 rounded-xl border border-navy-750 bg-navy-850">
                    No claims match the selected search or filter criteria.
                  </div>
                ) : (
                  filteredClaims.map((claim, idx) => (
                    <ClaimCard
                      key={claim.id}
                      claim={claim}
                      conflicts={run.conflicts.filter((conf) => conf.claimId === claim.id)}
                      defaultExpanded={idx === 0}
                    />
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Sources Panel */}
            {activeTab === 'sources' && (
              <EvidencePanel sources={[]} claims={run.claims} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
