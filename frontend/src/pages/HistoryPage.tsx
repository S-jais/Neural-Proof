import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { VerificationRun } from '../types';

export const HistoryPage: React.FC = () => {
  const [runs, setRuns] = useState<VerificationRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory(0, 50);
      if (data.content && data.content.length > 0) {
        setRuns(data.content);
      } else {
        // Fallback to local storage if server has no runs yet
        const local = JSON.parse(localStorage.getItem('np_history') || '[]');
        setRuns(
          local.map((item: any) => ({
            id: item.id,
            inputText: item.text,
            status: 'COMPLETED',
            createdAt: item.at,
            claims: []
          }))
        );
      }
    } catch {
      const local = JSON.parse(localStorage.getItem('np_history') || '[]');
      setRuns(
        local.map((item: any) => ({
          id: item.id,
          inputText: item.text,
          status: 'COMPLETED',
          createdAt: item.at,
          claims: []
        }))
      );
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
    try {
      await api.deleteVerification(id);
    } catch {}
    setRuns((prev) => prev.filter((r) => r.id !== id));
    try {
      const local = JSON.parse(localStorage.getItem('np_history') || '[]');
      const filtered = local.filter((item: any) => item.id !== id);
      localStorage.setItem('np_history', JSON.stringify(filtered));
    } catch {}
  };

  return (
    <div className="view page narrow">
      <div className="wrap">
        <h1 tabIndex={-1}>Verification history</h1>
        <p className="sub">Reports from your anonymous browser session.</p>

        {loading ? (
          <div className="sheet empty">
            <div className="dot-state mx-auto" style={{ animation: 'spin .8s linear infinite', border: '2px solid var(--blue)', borderTopColor: 'transparent' }} />
            <p style={{ marginTop: '16px' }}>Loading history records...</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="sheet empty">
            <div className="glyph">
              <svg className="ic"><use href="#i-doc" /></svg>
            </div>
            <h2>No checks yet</h2>
            <p>Reports from this session will appear here. Paste an answer in the workspace to run your first check.</p>
            <Link className="btn primary" to="/verify">
              Verify an answer
            </Link>
          </div>
        ) : (
          <ul className="sheet hist">
            {runs.map((r) => {
              const text = r.inputText || 'Verification report';
              const truncated = text.length > 130 ? text.slice(0, 130) + '…' : text;
              const formattedDate = new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short'
              }).format(new Date(r.createdAt || Date.now()));

              return (
                <li key={r.id}>
                  <div>
                    <q>{truncated}</q>
                    <time>{formattedDate}</time>
                    <div className="mini" aria-hidden="true">
                      <i data-v="ok" />
                      <i data-v="mid" />
                      <i data-v="bad" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link className="btn sm" to={`/verifications/${r.id}`}>
                      Open report
                    </Link>
                    <button
                      className="btn sm"
                      type="button"
                      style={{ color: 'var(--bad)', borderColor: 'transparent' }}
                      onClick={(e) => handleDelete(r.id, e)}
                      title="Delete record"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
