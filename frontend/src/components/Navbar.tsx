import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  const [status, setStatus] = useState<{
    tinyfishOk: boolean;
    llmOk: boolean;
  }>({
    tinyfishOk: true,
    llmOk: true,
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.getHealth();
        setStatus({
          tinyfishOk: res.tinyFish === 'CONFIGURED' || (res as any).tinyfish_configured === true,
          llmOk: res.llm === 'CONFIGURED' || (res as any).llm_configured === true,
        });
      } catch {
        // Fallback status if offline
        setStatus({ tinyfishOk: false, llmOk: false });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('np-theme', next);
    } catch {}
  };

  const isActive = (path: string) => {
    if (path === '/verify' && location.pathname === '/verify') return true;
    if (path === '/history' && location.pathname === '/history') return true;
    if (path === '/sample' && location.pathname === '/sample') return true;
    return false;
  };

  return (
    <header className="top">
      <div className="wrap">
        <Link to="/" className="brand" aria-label="Neural Proof home">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="var(--ink)" />
            <path
              d="M9 16.5l4.6 4.6L23 11"
              stroke="var(--paper)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M8 26h16"
              stroke="var(--blue)"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
          <span>
            <b>Neural Proof</b>
            <small>Evidence-checking assistant</small>
          </span>
        </Link>

        <nav className="nav" aria-label="Main">
          <Link
            to="/verify"
            aria-current={isActive('/verify') ? 'page' : undefined}
          >
            Workspace
          </Link>
          <Link
            to="/history"
            aria-current={isActive('/history') ? 'page' : undefined}
          >
            History
          </Link>
          <Link
            to="/sample"
            aria-current={isActive('/sample') ? 'page' : undefined}
          >
            Sample report
          </Link>
        </nav>

        <div className="top-right">
          <div className="status" aria-label="Service status">
            <span
              className="st"
              data-s={status.tinyfishOk ? 'ok' : 'warn'}
              title={
                status.tinyfishOk
                  ? 'TinyFish live web search connected'
                  : 'TinyFish key missing. Real web scraping is in mock fallback mode.'
              }
            >
              {status.tinyfishOk ? 'TinyFish connected' : 'TinyFish key missing'}
            </span>
            <span
              className="st"
              data-s={status.llmOk ? 'ok' : 'warn'}
              title={
                status.llmOk
                  ? 'LLM pipeline ready'
                  : 'LLM degraded. Check API keys.'
              }
            >
              {status.llmOk ? 'LLM ready' : 'LLM degraded'}
            </span>
          </div>

          <button
            className="icon-btn"
            type="button"
            onClick={toggleTheme}
            aria-label="Switch colour theme"
            title="Switch colour theme"
          >
            <svg className="ic moon"><use href="#i-moon" /></svg>
            <svg className="ic sun"><use href="#i-sun" /></svg>
          </button>

          <Link to="/verify" className="btn primary sm">
            Verify an answer
          </Link>
        </div>
      </div>
    </header>
  );
};
