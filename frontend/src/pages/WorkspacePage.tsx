import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface Sample {
  title: string;
  tag: string;
  text: string;
  context?: string;
}

const SAMPLES: Sample[] = [
  {
    title: 'Absolute claim: solar environmental impact',
    tag: 'Likely contradicted',
    text: 'Solar energy generation has zero environmental impact and creates absolutely no waste. Solar panels produce no emissions at any stage of their life, so they are completely harmless to ecosystems.'
  },
  {
    title: 'Multi-claim technology and science paragraph',
    tag: 'Mixed verdicts',
    text: 'The James Webb Space Telescope was successfully launched on December 25, 2021, and orbits the Earth at a distance of about 1.5 million kilometres. It observes mainly in the infrared, and its primary mirror is 6.5 metres wide.'
  },
  {
    title: 'Time-sensitive policy or eligibility claim',
    tag: 'Changes over time',
    text: 'The United States federal solar tax credit allows homeowners to deduct 30% of their installation costs from their federal tax bill.'
  }
];

export const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<'PASTED_ANSWER' | 'QUESTION'>('PASTED_ANSWER');
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [selectedSample, setSelectedSample] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [runStep, setRunStep] = useState<number>(-1);
  const [progressWidth, setProgressWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [healthStatus, setHealthStatus] = useState<{
    tinyfish: boolean;
    llm: boolean;
  }>({
    tinyfish: true,
    llm: true
  });

  useEffect(() => {
    api.getHealth()
      .then((h) => {
        setHealthStatus({
          tinyfish: h.tinyfish_configured,
          llm: h.llm_configured
        });
      })
      .catch(() => {
        setHealthStatus({ tinyfish: false, llm: true });
      });
  }, []);

  const trimmed = text.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = text.length;

  const minChars = mode === 'PASTED_ANSWER' ? 40 : 10;
  const maxChars = mode === 'PASTED_ANSWER' ? 12000 : 1000;
  const needChars = minChars - trimmed.length;
  const isValid = trimmed.length >= minChars && charCount <= maxChars;

  const handleSelectSample = (idx: number) => {
    setSelectedSample(idx);
    setText(SAMPLES[idx].text);
    if (SAMPLES[idx].context) setContext(SAMPLES[idx].context!);
    setError(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setSelectedSample(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);
    setRunStep(0);
    setProgressWidth(20);

    const stepTimer1 = setTimeout(() => {
      setRunStep(1);
      setProgressWidth(55);
    }, 900);

    const stepTimer2 = setTimeout(() => {
      setRunStep(2);
      setProgressWidth(85);
    }, 1800);

    try {
      const res = await api.createVerification({
        inputType: mode,
        text: trimmed,
        context: context.trim() || undefined,
        reviewClaimsBeforeVerifying: false,
      });

      // Save to local anonymous history
      try {
        const hist = JSON.parse(localStorage.getItem('np_history') || '[]');
        hist.unshift({
          id: res.verificationId,
          text: trimmed,
          at: new Date().toISOString()
        });
        localStorage.setItem('np_history', JSON.stringify(hist.slice(0, 50)));
      } catch {}

      setProgressWidth(100);
      setTimeout(() => {
        navigate(`/verifications/${res.verificationId}`);
      }, 450);
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setError(err.message || 'Failed to submit verification request. Please check the backend services.');
      setLoading(false);
      setRunStep(-1);
    }
  };

  return (
    <div className="view page narrow">
      <div className="wrap">
        <h1 tabIndex={-1}>Verification workspace</h1>
        <p className="sub">
          Paste an AI-generated answer to split it into claims and check each one against live sources.
        </p>

        {/* Setup notes */}
        {!healthStatus.tinyfish && (
          <div className="note" role="status">
            <b>TinyFish key missing</b>
            Live web evidence is running in simulation mode. Add the TinyFish API key to your environment for real web-agent scraping.
          </div>
        )}
        {!healthStatus.llm && (
          <div className="note" role="status">
            <b>LLM degraded</b>
            The language model is running in fallback extraction mode. Question answering is disabled.
          </div>
        )}

        {/* Modes */}
        <div className="modes" role="tablist" aria-label="Input mode">
          <button
            className="mode"
            role="tab"
            aria-selected={mode === 'PASTED_ANSWER'}
            type="button"
            onClick={() => setMode('PASTED_ANSWER')}
          >
            Verify an existing answer
          </button>
          <button
            className="mode"
            role="tab"
            aria-selected={mode === 'QUESTION'}
            aria-disabled={!healthStatus.llm}
            type="button"
            onClick={() => {
              if (healthStatus.llm) setMode('QUESTION');
            }}
          >
            Ask a question and verify
            {!healthStatus.llm && <small>Needs an LLM key</small>}
          </button>
        </div>

        {/* Start from a sample */}
        <span className="field-label" id="samplesLabel">
          Start from a sample
        </span>
        <div className="samples" role="group" aria-labelledby="samplesLabel">
          {SAMPLES.map((s, idx) => (
            <button
              key={s.title}
              className="sample"
              type="button"
              aria-pressed={selectedSample === idx}
              onClick={() => handleSelectSample(idx)}
            >
              <b>{s.title}</b>
              <span>{s.tag}</span>
              <p>{s.text}</p>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="editor">
          <div className="editor-head">
            <label htmlFor="answer">
              {mode === 'PASTED_ANSWER' ? 'AI answer to verify' : 'Question to investigate and verify'}
            </label>
            <span className="count" aria-live="off">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}, {charCount.toLocaleString()} / {maxChars.toLocaleString()} characters
            </span>
          </div>

          <textarea
            id="answer"
            maxLength={maxChars}
            rows={mode === 'PASTED_ANSWER' ? 8 : 4}
            value={text}
            onChange={handleTextChange}
            disabled={loading}
            placeholder={
              mode === 'PASTED_ANSWER'
                ? 'Paste the full AI-generated response here. At least 40 characters.'
                : 'Enter your question here to synthesize an answer and verify its claims...'
            }
          />

          {error && (
            <div className="note" style={{ borderColor: 'var(--bad)', background: 'var(--bad-wash)' }}>
              <b>Verification error:</b> {error}
            </div>
          )}

          <div className="actions">
            <button
              className="btn primary"
              id="verifyBtn"
              type="button"
              disabled={!isValid || loading}
              onClick={() => handleSubmit()}
            >
              {loading ? 'Checking answer...' : 'Verify answer'}
            </button>
            <span className="hint">
              {needChars > 0
                ? (trimmed.length
                    ? `Add ${needChars} more ${needChars === 1 ? 'character' : 'characters'} to start.`
                    : `Add at least ${minChars} characters to start.`)
                : 'Ready to check.'}
            </span>
          </div>
        </div>

        {/* Progress Animation Panel */}
        {loading && (
          <section className="sheet run" aria-live="polite">
            <h2>Checking your answer</h2>
            <ol>
              <li data-state={runStep === 0 ? 'active' : runStep > 0 ? 'done' : 'idle'}>
                <span className="dot-state">
                  <svg className="ic"><use href="#i-ok" /></svg>
                </span>
                Splitting the answer into claims
              </li>
              <li data-state={runStep === 1 ? 'active' : runStep > 1 ? 'done' : 'idle'}>
                <span className="dot-state">
                  <svg className="ic"><use href="#i-ok" /></svg>
                </span>
                Reading live sources
              </li>
              <li data-state={runStep === 2 ? 'active' : runStep > 2 ? 'done' : 'idle'}>
                <span className="dot-state">
                  <svg className="ic"><use href="#i-ok" /></svg>
                </span>
                Weighing evidence and writing verdicts
              </li>
            </ol>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </section>
        )}

        <p className="fine" style={{ marginTop: '24px' }}>
          Real live pipeline: Claims are decomposed, searched in real-time on the web, cross-verified with sentence-level quotes, and rendered in an interactive proof report.
        </p>
      </div>
    </div>
  );
};
