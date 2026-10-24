import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { VerificationRun } from '../types';
import { ClaimCard } from '../components/ClaimCard';
import { VerdictChart } from '../components/VerdictChart';

export const RunPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [run, setRun] = useState<VerificationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filter, setFilter] = useState<'ALL' | 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'CONTRADICTED' | 'INSUFFICIENT_EVIDENCE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Claim review inclusion state
  const [selectedClaimIds, setSelectedClaimIds] = useState<Set<string>>(new Set());
  const [resuming, setResuming] = useState(false);

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

          if (data.status === 'AWAITING_CLAIM_REVIEW' && selectedClaimIds.size === 0) {
            const initialIncluded = new Set(
              data.claims.filter((c) => c.included).map((c) => c.id)
            );
            setSelectedClaimIds(initialIncluded);
          }
        }

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
      <div className="view page narrow">
        <div className="wrap">
          <div className="sheet empty">
            <div
              className="dot-state mx-auto"
              style={{
                animation: 'spin .8s linear infinite',
                border: '2px solid var(--blue)',
                borderTopColor: 'transparent'
              }}
            />
            <p style={{ marginTop: '16px' }}>Loading verification report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !run) {
    return (
      <div className="view page narrow">
        <div className="wrap">
          <div className="sheet empty">
            <div className="glyph" style={{ color: 'var(--bad)', background: 'var(--bad-wash)' }}>
              <svg className="ic"><use href="#i-bad" /></svg>
            </div>
            <h2>Verification not found</h2>
            <p>{error}</p>
            <Link className="btn primary" to="/verify">
              Return to workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!run) return null;

  const handleToggleClaim = (claimId: string) => {
    const updated = new Set(selectedClaimIds);
    if (updated.has(claimId)) {
      updated.delete(claimId);
    } else {
      updated.add(claimId);
    }
    setSelectedClaimIds(updated);
  };

  const handleStartVerification = async () => {
    setResuming(true);
    try {
      await api.startVerification(run.id, Array.from(selectedClaimIds));
      const updatedRun = await api.getVerification(run.id);
      setRun(updatedRun);
    } catch (err: any) {
      setError(err.message || 'Failed to resume verification');
    } finally {
      setResuming(false);
    }
  };

  const handleCopySummary = async () => {
    if (!run) return;
    const summaryText =
      `Report for Run #${run.id.slice(0, 8)}\n` +
      `${run.claims.length} claims evaluated.\n\n` +
      (run.summary?.text ? `Summary:\n${run.summary.text}\n\n` : '') +
      run.claims.map((c) => `- [${c.verdict || 'UNVERIFIED'}] ${c.normalizedText || c.originalText}\n  Reason: ${c.reasoning || 'Evaluated against live evidence.'}`).join('\n\n');

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const isCompleted = run.status === 'COMPLETED' || run.status === 'PARTIAL';
  const isRunning =
    run.status === 'PENDING' ||
    run.status === 'EXTRACTING_CLAIMS' ||
    run.status === 'SEARCHING_EVIDENCE' ||
    run.status === 'SYNTHESIZING_VERDICTS';

  const filteredClaims = run.claims.filter((c) => {
    if (filter !== 'ALL' && c.verdict !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const textMatch = (c.normalizedText || c.originalText).toLowerCase().includes(q);
      const whyMatch = c.reasoning ? c.reasoning.toLowerCase().includes(q) : false;
      return textMatch || whyMatch;
    }
    return true;
  });

  return (
    <div className="view page narrow">
      <div className="wrap">
        {/* Top Badges */}
        <div className="badges">
          <span className="badge plain">Run #{run.id.slice(0, 8)}</span>
          <span className="badge">{run.status.replace(/_/g, ' ')}</span>
          {run.durationMs && (
            <span className="badge plain">{(run.durationMs / 1000).toFixed(1)}s</span>
          )}
        </div>

        <h1 tabIndex={-1}>
          {run.inputType === 'QUESTION' ? 'Question verification report' : 'Verification report'}
        </h1>
        <p className="sub">
          {run.claims.length} {run.claims.length === 1 ? 'claim' : 'claims'} evaluated against live sources.
        </p>

        {/* Provisional Generated Answer (in Question Mode) */}
        {run.generatedAnswer && (
          <section className="sheet summary" style={{ marginTop: '20px' }}>
            <h2>Provisional AI answer ({run.generationModel || 'AI Model'})</h2>
            <p>"{run.generatedAnswer}"</p>
          </section>
        )}

        {/* Claim Review Stage if awaiting review */}
        {run.status === 'AWAITING_CLAIM_REVIEW' && (
          <div className="sheet run" style={{ marginTop: '28px' }}>
            <h2>Review extracted claims before verification</h2>
            <p className="text-sm text-[var(--ink-2)]" style={{ marginTop: '6px' }}>
              Select which assertions you want to verify against live web evidence.
            </p>

            <div style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
              {run.claims.map((claim) => {
                const isChecked = selectedClaimIds.has(claim.id);
                return (
                  <label
                    key={claim.id}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '12px',
                      padding: '12px 14px',
                      border: '1px solid var(--rule)',
                      borderRadius: 'var(--radius)',
                      background: isChecked ? 'var(--blue-wash)' : 'var(--sheet)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleClaim(claim.id)}
                      style={{ accentColor: 'var(--blue)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '0.9375rem' }}>
                        {claim.normalizedText || claim.originalText}
                      </strong>
                      <span className="text-xs text-[var(--ink-2)] font-mono">
                        {claim.claimType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="actions" style={{ marginTop: '20px' }}>
              <button
                className="btn primary"
                type="button"
                disabled={selectedClaimIds.size === 0 || resuming}
                onClick={handleStartVerification}
              >
                {resuming ? 'Starting...' : `Start verification (${selectedClaimIds.size} included)`}
              </button>
            </div>
          </div>
        )}

        {/* Running Progress Section */}
        {isRunning && (
          <section className="sheet run" aria-live="polite">
            <h2>Checking your answer against live sources</h2>
            <ol>
              <li
                data-state={
                  run.status === 'EXTRACTING_CLAIMS'
                    ? 'active'
                    : run.claims.length > 0
                    ? 'done'
                    : 'idle'
                }
              >
                <span className="dot-state">
                  <svg className="ic"><use href="#i-ok" /></svg>
                </span>
                Splitting the answer into claims
              </li>
              <li
                data-state={
                  run.status === 'SEARCHING_EVIDENCE'
                    ? 'active'
                    : run.status === 'SYNTHESIZING_VERDICTS'
                    ? 'done'
                    : 'idle'
                }
              >
                <span className="dot-state">
                  <svg className="ic"><use href="#i-ok" /></svg>
                </span>
                Reading live sources
              </li>
              <li
                data-state={
                  run.status === 'SYNTHESIZING_VERDICTS' ? 'active' : 'idle'
                }
              >
                <span className="dot-state">
                  <svg className="ic"><use href="#i-ok" /></svg>
                </span>
                Weighing evidence and writing verdicts
              </li>
            </ol>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width:
                    run.status === 'EXTRACTING_CLAIMS'
                      ? '35%'
                      : run.status === 'SEARCHING_EVIDENCE'
                      ? '70%'
                      : run.status === 'SYNTHESIZING_VERDICTS'
                      ? '90%'
                      : '20%'
                }}
              />
            </div>
          </section>
        )}

        {/* Summary Card */}
        {run.summary?.text && (
          <section className="sheet summary" aria-labelledby="sumT">
            <h2 id="sumT">Summary</h2>
            <p>{run.summary.text}</p>
          </section>
        )}

        {/* Distribution Bar */}
        {run.counts && <VerdictChart counts={run.counts} />}

        {/* Claim List Header & Filters */}
        {run.claims.length > 0 && (
          <>
            <div className="list-head">
              <h2>Checked claims</h2>
              <div className="filters" role="group" aria-label="Filter claims by verdict">
                <button
                  type="button"
                  aria-pressed={filter === 'ALL'}
                  onClick={() => setFilter('ALL')}
                >
                  All
                </button>
                <button
                  type="button"
                  aria-pressed={filter === 'SUPPORTED'}
                  onClick={() => setFilter('SUPPORTED')}
                >
                  Supported
                </button>
                <button
                  type="button"
                  aria-pressed={filter === 'PARTIALLY_SUPPORTED'}
                  onClick={() => setFilter('PARTIALLY_SUPPORTED')}
                >
                  Nuanced
                </button>
                <button
                  type="button"
                  aria-pressed={filter === 'CONTRADICTED'}
                  onClick={() => setFilter('CONTRADICTED')}
                >
                  Contradicted
                </button>
              </div>
            </div>

            <ul className="sheet claims">
              {filteredClaims.map((claim, idx) => (
                <ClaimCard
                  key={claim.id}
                  claim={claim}
                  conflicts={run.conflicts ? run.conflicts.filter((c) => c.claimId === claim.id) : []}
                  defaultExpanded={idx === 0}
                />
              ))}
            </ul>
          </>
        )}

        {/* Actions */}
        <div className="actions" style={{ marginTop: '28px' }}>
          <button className="btn" type="button" onClick={handleCopySummary}>
            <svg className="ic"><use href="#i-copy" /></svg>
            <span>{copied ? 'Copied' : 'Copy summary'}</span>
          </button>
          <Link className="btn primary" to="/verify">
            Verify another answer
          </Link>
        </div>

        <p className="fine" style={{ marginTop: '20px' }}>
          Neural Proof reports what the evidence says. Verdicts are not guarantees, so open the sources for anything that matters.
        </p>
      </div>
    </div>
  );
};
