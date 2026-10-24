import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { SampleLoader } from '../components/SampleLoader';
import { FileText, HelpCircle, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';

export const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<'PASTED_ANSWER' | 'QUESTION'>('PASTED_ANSWER');
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [reviewBeforeVerify, setReviewBeforeVerify] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [llmConfigured, setLlmConfigured] = useState<boolean>(true);

  useEffect(() => {
    api.getHealth()
      .then((h) => {
        setLlmConfigured(h.llm === 'CONFIGURED');
      })
      .catch(() => {
        setLlmConfigured(false);
      });
  }, []);

  // Live counters
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const minChars = mode === 'PASTED_ANSWER' ? 40 : 10;
  const maxChars = mode === 'PASTED_ANSWER' ? 12000 : 1000;
  const isTooShort = charCount > 0 && charCount < minChars;
  const isTooLong = charCount > maxChars;
  const isValid = charCount >= minChars && charCount <= maxChars;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.createVerification({
        inputType: mode,
        text: text.trim(),
        context: context.trim() || undefined,
        reviewClaimsBeforeVerifying: reviewBeforeVerify,
      });

      navigate(`/verifications/${res.verificationId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit verification request');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (sampleText: string, sampleContext?: string) => {
    setText(sampleText);
    if (sampleContext) setContext(sampleContext);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Evidence Verification Workspace
        </h1>
        <p className="text-sm text-slate-400">
          Paste an AI-generated answer or question to decompose claims and retrieve live grounding.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-3 border-b border-navy-800 pb-4">
        <button
          type="button"
          onClick={() => setMode('PASTED_ANSWER')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            mode === 'PASTED_ANSWER'
              ? 'bg-navy-800 text-accent-cyan border border-navy-700 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-navy-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          Verify Existing Answer
        </button>

        <button
          type="button"
          onClick={() => {
            if (llmConfigured) setMode('QUESTION');
          }}
          disabled={!llmConfigured}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            mode === 'QUESTION'
              ? 'bg-navy-800 text-accent-cyan border border-navy-700 shadow-md'
              : !llmConfigured
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-slate-400 hover:text-white hover:bg-navy-900'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          Ask a Question & Verify
          {!llmConfigured && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-navy-900 text-amber-400 border border-amber-900/40">
              Needs LLM Key
            </span>
          )}
        </button>
      </div>

      {/* Disabled Question Mode Notice */}
      {!llmConfigured && mode === 'QUESTION' && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/40 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold">Question mode is disabled:</span>
            <p className="text-slate-300 leading-relaxed">
              Generating a provisional AI answer requires configuring an LLM key (e.g. OpenAI or Anthropic) in your server environment.
              Paste Mode remains fully functional in degraded extraction mode.
            </p>
          </div>
        </div>
      )}

      {/* Sample Loader */}
      <SampleLoader onSelectSample={handleSelectSample} />

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <label htmlFor="input-text" className="font-semibold text-slate-200">
              {mode === 'PASTED_ANSWER' ? 'AI Answer to Verify' : 'Question to Answer & Verify'}
            </label>
            <div className="flex items-center gap-3 font-mono">
              <span>{wordCount} words</span>
              <span className={isTooShort || isTooLong ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                {charCount} / {maxChars} chars
              </span>
            </div>
          </div>

          <textarea
            id="input-text"
            rows={mode === 'PASTED_ANSWER' ? 8 : 4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === 'PASTED_ANSWER'
                ? 'Paste the full AI-generated response here (min 40 characters)...'
                : 'Enter your factual question here...'
            }
            className="w-full rounded-xl border border-navy-700 bg-navy-900 p-4 text-sm text-slate-100 placeholder-slate-500 focus:border-accent-cyan focus:outline-none focus:ring-1 focus:ring-accent-cyan transition-all resize-y"
          />

          {isTooShort && (
            <p className="text-xs text-amber-400 font-medium">
              Input is too short. Minimum required: {minChars} characters.
            </p>
          )}
          {isTooLong && (
            <p className="text-xs text-rose-400 font-medium">
              Input exceeds maximum limit of {maxChars} characters.
            </p>
          )}
        </div>

        {/* Optional Context Field */}
        <div className="space-y-1.5">
          <label htmlFor="context-text" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Optional Verification Context (Topic, Jurisdiction, Date Range)</span>
            <span className="font-mono text-slate-500">{context.length} / 600</span>
          </label>
          <input
            id="context-text"
            type="text"
            maxLength={600}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. U.S. Federal Tax Law 2024, Renewable Energy, EU Regulations..."
            className="w-full rounded-lg border border-navy-700 bg-navy-900 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-accent-cyan focus:outline-none focus:ring-1 focus:ring-accent-cyan transition-all"
          />
        </div>

        {/* Toggle: Review claims before verifying */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-navy-750 bg-navy-850">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-200">
              Review extracted claims before verifying
            </span>
            <p className="text-[11px] text-slate-400">
              Allows you to inspect, exclude, or prioritize individual claims before triggering live TinyFish web retrieval.
            </p>
          </div>
          <input
            type="checkbox"
            checked={reviewBeforeVerify}
            onChange={(e) => setReviewBeforeVerify(e.target.checked)}
            className="h-4 w-4 rounded border-navy-600 bg-navy-900 text-accent-cyan focus:ring-accent-cyan focus:ring-offset-navy-950 cursor-pointer"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || loading}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-accent-cyan to-accent-teal text-navy-950 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-cyan/15 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-navy-950 border-t-transparent animate-spin" />
              Initializing Verification Run...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Begin Verification Pipeline
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
