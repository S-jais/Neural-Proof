import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

interface Sample {
  assistant: 'Chat assistant' | 'Search assistant' | 'Writing assistant';
  title: string;
  tag: string;
  text: string;
  context?: string;
  assistantNotes?: string;
}

const SAMPLES: Sample[] = [
  // Search Assistant Samples
  {
    assistant: 'Search assistant',
    title: 'Search Overview: Mount Everest & Great Wall orbit visibility',
    tag: 'Web grounding check',
    text: 'Mount Everest is about 8,849 metres tall according to recent survey data. The Great Wall of China is visible from space with the naked eye from low Earth orbit. Sharks, unlike most bony fish, possess skeletons composed entirely of cartilage.',
    assistantNotes: 'Checks live web crawl sources (Britannica, NASA, ESA, SI) against synthetic search engine overviews.'
  },
  {
    assistant: 'Search assistant',
    title: 'Search Summary: Webb telescope launch date & orbit',
    tag: 'Live citation audit',
    text: 'The James Webb Space Telescope was successfully launched on December 25, 2021, and orbits the Earth at a distance of about 1.5 million kilometres. It observes mainly in the infrared spectrum, and its gold-coated primary mirror is 6.5 metres wide.',
    assistantNotes: 'Verifies whether the satellite circles Earth or orbits the Sun at the second Lagrange point (L2).'
  },
  // Writing Assistant Samples
  {
    assistant: 'Writing assistant',
    title: 'Draft Article: Human brain myth & common cold remedy',
    tag: 'Scientific myth audit',
    text: 'Humans use only 10% of their brains in daily cognition, leaving vast untapped potential. Meanwhile, regular daily intake of vitamin C prevents the common cold in almost all individuals. As a basic physical constant, water boils at 100 °C at sea level.',
    assistantNotes: 'Audits draft prose against biomedical trials (NIH, Cochrane Library) and physics standards (NIST).'
  },
  {
    assistant: 'Writing assistant',
    title: 'Editorial Draft: Solar environmental impact absolute assertions',
    tag: 'Absolute claim audit',
    text: 'Solar energy generation has zero environmental impact and creates absolutely no waste. Solar panels produce no emissions at any stage of their life, so they are completely harmless to ecosystems.',
    assistantNotes: 'Scans for unwarranted absolute assertions ("zero impact", "completely harmless") refuted by lifecycle assessments.'
  },
  // Chat Assistant Samples
  {
    assistant: 'Chat assistant',
    title: 'Conversational Answer: Clean energy tax credits',
    tag: 'Policy check',
    text: 'The United States federal solar tax credit allows homeowners to deduct 30% of their installation costs from their federal tax bill, provided the system is installed before 2032.',
    assistantNotes: 'Checks current federal tax code provisions and statutory expiration dates.'
  }
];

export const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'PASTED_ANSWER' | 'QUESTION'>('PASTED_ANSWER');
  const [assistantType, setAssistantType] = useState<'Chat assistant' | 'Search assistant' | 'Writing assistant'>('Chat assistant');

  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [selectedSample, setSelectedSample] = useState<number | null>(null);

  // Search Assistant specific feature toggles
  const [checkUrls, setCheckUrls] = useState(true);
  const [checkFreshness, setCheckFreshness] = useState(true);

  // Writing Assistant specific feature toggles
  const [detectMyths, setDetectMyths] = useState(true);
  const [flagAbsolutes, setFlagAbsolutes] = useState(true);

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

  // Parse query params for pre-selected assistant and sample
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const asstParam = params.get('assistant');
    const sampleParam = params.get('sample');

    if (asstParam === 'Search assistant' || asstParam === 'Writing assistant' || asstParam === 'Chat assistant') {
      setAssistantType(asstParam);
    }
    if (sampleParam !== null) {
      const idx = parseInt(sampleParam, 10);
      if (!isNaN(idx) && SAMPLES[idx]) {
        setSelectedSample(idx);
        setText(SAMPLES[idx].text);
        setAssistantType(SAMPLES[idx].assistant);
      }
    }
  }, [location.search]);

  useEffect(() => {
    api.getHealth()
      .then((h) => {
        setHealthStatus({
          tinyfish: h.tinyFish === 'CONFIGURED' || (h as any).tinyfish_configured === true,
          llm: h.llm === 'CONFIGURED' || (h as any).llm_configured === true
        });
      })
      .catch(() => {
        setHealthStatus({ tinyfish: false, llm: false });
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
    setAssistantType(SAMPLES[idx].assistant);
    if (SAMPLES[idx].context) setContext(SAMPLES[idx].context!);
    setError(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setSelectedSample(null);
  };

  const handleAssistantSwitch = (asst: 'Chat assistant' | 'Search assistant' | 'Writing assistant') => {
    setAssistantType(asst);
    // Find first sample matching this assistant
    const matchingIdx = SAMPLES.findIndex(s => s.assistant === asst);
    if (matchingIdx !== -1) {
      handleSelectSample(matchingIdx);
    }
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

      // Save to local anonymous history with assistant type metadata
      try {
        const hist = JSON.parse(localStorage.getItem('np_history') || '[]');
        hist.unshift({
          id: res.verificationId,
          text: trimmed,
          assistant: assistantType,
          at: new Date().toISOString()
        });
        localStorage.setItem('np_history', JSON.stringify(hist.slice(0, 50)));
      } catch {}

      setProgressWidth(100);
      setTimeout(() => {
        navigate(`/verifications/${res.verificationId}?assistant=${encodeURIComponent(assistantType)}`);
      }, 450);
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setError(err.message || 'Failed to submit verification request. Please check the backend services.');
      setLoading(false);
      setRunStep(-1);
    }
  };

  const currentAssistantSamples = SAMPLES.filter(s => s.assistant === assistantType);

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

        {/* Assistant Profile Selector */}
        <div style={{ marginTop: '28px' }}>
          <span className="field-label" style={{ margin: '0 0 10px' }}>
            Select Assistant Type to Verify
          </span>
          <div className="asst-row">
            {(['Chat assistant', 'Search assistant', 'Writing assistant'] as const).map((asst, i) => (
              <button
                key={asst}
                className="asst"
                type="button"
                aria-pressed={assistantType === asst}
                onClick={() => handleAssistantSwitch(asst)}
              >
                <span className={`g g${i}`} />
                {asst}
              </button>
            ))}
          </div>

          {/* Assistant-Specific Feature Callout */}
          <div
            className="note"
            style={{
              marginTop: '14px',
              borderLeftColor: 'var(--blue)',
              background: 'var(--blue-wash)',
              color: 'var(--ink)'
            }}
          >
            {assistantType === 'Chat assistant' && (
              <>
                <b>Chat Assistant Verifier:</b>
                Decomposes conversational answers from ChatGPT or Claude into independent claims, verifying complex multi-sentence reasoning.
              </>
            )}
            {assistantType === 'Search assistant' && (
              <>
                <b>Search Assistant Grounding:</b>
                Verifies AI search overviews (Perplexity, Google AI Overviews) against live web pages using TinyFish.
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.8125rem' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checkUrls}
                      onChange={(e) => setCheckUrls(e.target.checked)}
                      style={{ accentColor: 'var(--blue)' }}
                    />
                    Live URL citation audit
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checkFreshness}
                      onChange={(e) => setCheckFreshness(e.target.checked)}
                      style={{ accentColor: 'var(--blue)' }}
                    />
                    Temporal freshness check
                  </label>
                </div>
              </>
            )}
            {assistantType === 'Writing assistant' && (
              <>
                <b>Writing Assistant Myth & Prose Auditor:</b>
                Scans editorial drafts and essays for common statistical myths and overconfident claims.
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.8125rem' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={detectMyths}
                      onChange={(e) => setDetectMyths(e.target.checked)}
                      style={{ accentColor: 'var(--blue)' }}
                    />
                    Scientific & medical myth detection
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={flagAbsolutes}
                      onChange={(e) => setFlagAbsolutes(e.target.checked)}
                      style={{ accentColor: 'var(--blue)' }}
                    />
                    Flag absolute assertions ("zero", "never", "only")
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Start from a sample */}
        <span className="field-label" id="samplesLabel">
          Start from a {assistantType} sample
        </span>
        <div className="samples" role="group" aria-labelledby="samplesLabel">
          {currentAssistantSamples.map((s) => {
            const globalIdx = SAMPLES.indexOf(s);
            return (
              <button
                key={s.title}
                className="sample"
                type="button"
                aria-pressed={selectedSample === globalIdx}
                onClick={() => handleSelectSample(globalIdx)}
              >
                <b>{s.title}</b>
                <span>{s.tag}</span>
                <p>{s.text}</p>
              </button>
            );
          })}
        </div>

        {/* Editor */}
        <div className="editor">
          <div className="editor-head">
            <label htmlFor="answer">
              {mode === 'PASTED_ANSWER'
                ? `${assistantType} response to verify`
                : 'Question to investigate and verify'}
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
                ? `Paste the full ${assistantType} response here. At least 40 characters.`
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
              {loading ? `Auditing ${assistantType}...` : `Verify ${assistantType} response`}
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
            <h2>Checking your {assistantType} answer</h2>
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
                {assistantType === 'Search assistant'
                  ? 'Crawling live cited web pages via TinyFish'
                  : assistantType === 'Writing assistant'
                  ? 'Checking peer-reviewed papers and encyclopedic indexes'
                  : 'Reading live web sources'}
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
