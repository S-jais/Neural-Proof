import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { VerificationRun } from '../types';
import { History, Trash2, Clock, FileText } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [runs, setRuns] = useState<VerificationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory(0, 50);
      setRuns(data.content || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch verification history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this verification report?')) {
      return;
    }
    try {
      await api.deleteVerification(id);
      setRuns(runs.filter((r) => r.id !== id));
    } catch (err: any) {
      alert('Failed to delete report: ' + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between border-b border-navy-800 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <History className="h-6 w-6 text-accent-cyan" />
            Verification History
          </h1>
          <p className="text-xs text-slate-400">
            Past evidence verification reports associated with your anonymous browser session.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="h-6 w-6 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading history records...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-xs text-rose-300 bg-rose-950/20 border border-rose-800/40 rounded-xl">
          {error}
        </div>
      ) : runs.length === 0 ? (
        <div className="p-16 text-center space-y-4 rounded-xl border border-navy-750 bg-navy-850">
          <FileText className="h-10 w-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">No Verifications Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven't run any claim verifications in this session yet. Submit text in the workspace to get started.
          </p>
          <Link
            to="/verify"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-accent-cyan to-accent-teal text-navy-950 font-bold text-xs"
          >
            Start First Verification
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((r) => {
            const dateStr = new Date(r.createdAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Link
                key={r.id}
                to={`/verifications/${r.id}`}
                className="block p-5 rounded-xl border border-navy-750 bg-navy-850 hover:border-navy-650 hover:bg-navy-800 transition-all space-y-3 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-navy-900 text-accent-cyan border border-navy-700">
                      #{r.id.slice(0, 8)}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        r.status === 'COMPLETED'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                          : r.status === 'PARTIAL'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                          : 'bg-navy-900 text-slate-300 border-navy-700'
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {dateStr}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Verdict Mini-summary */}
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-emerald-400" title="Supported">
                        ✓ {r.counts?.supported || 0}
                      </span>
                      <span className="text-rose-400" title="Contradicted">
                        ✗ {r.counts?.contradicted || 0}
                      </span>
                      <span className="text-amber-400" title="Partially Supported">
                        ~ {r.counts?.partiallySupported || 0}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(r.id, e)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-navy-750 transition-colors"
                      title="Delete run"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm font-medium text-slate-200 line-clamp-2 leading-relaxed">
                  "{r.originalInput}"
                </p>

                {r.summary?.text && (
                  <p className="text-xs text-slate-400 line-clamp-1 italic">
                    {r.summary.text}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
