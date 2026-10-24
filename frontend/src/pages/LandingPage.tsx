import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Search, FileSearch, Scale, CheckCircle2, ArrowRight, AlertTriangle, Globe } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-navy-800">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-cyan/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800/80 border border-navy-700 text-xs font-semibold text-accent-cyan">
            <span className="h-2 w-2 rounded-full bg-accent-cyan animate-ping" />
            Live Web Grounding via TinyFish
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Independently verify factual assertions in <span className="bg-gradient-to-r from-accent-cyan to-accent-teal bg-clip-text text-transparent">AI-generated answers</span>.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Neural Proof decomposes answers into individual claims, retrieves authentic evidence from the live web using TinyFish, inspects contradictions, and generates an auditable, transparent verification report.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/verify"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-gradient-to-r from-accent-cyan to-accent-teal text-navy-950 hover:brightness-110 shadow-lg shadow-accent-cyan/20 transition-all text-sm"
            >
              Start Verifying Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/sample"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-navy-800 text-slate-200 border border-navy-700 hover:bg-navy-750 hover:text-white transition-all text-sm"
            >
              Explore Sample Report
            </Link>
          </div>

          {/* Core Principle Quote Card */}
          <div className="mt-12 max-w-3xl mx-auto p-6 rounded-2xl border border-navy-700 bg-navy-900/90 shadow-2xl backdrop-blur-md">
            <p className="text-sm sm:text-base font-medium italic text-slate-200 leading-relaxed">
              "Every factual claim should be inspectable, every verdict should have a reason, every source should be traceable, and uncertainty should never be disguised as certainty."
            </p>
            <div className="mt-3 text-xs font-mono uppercase tracking-widest text-accent-cyan font-semibold">
              — Neural Proof Core Engineering Principle
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Strip */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How Neural Proof Works
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            A four-stage autonomous pipeline designed to eliminate hallucinations and enforce strict evidence grounding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-xl border border-navy-750 bg-navy-850 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-accent-cyan">
              <FileSearch className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">1. Decompose Claims</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Splits text into atomic, checkable assertions while preserving qualifiers, entities, and time context.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-navy-750 bg-navy-850 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-accent-teal">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">2. Retrieve Evidence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Queries the live web via TinyFish Search and fetches authentic primary source pages with anti-confirmation queries.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-navy-750 bg-navy-850 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-amber-400">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">3. Evaluate Grounding</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compares claims against stored verbatim passages with deterministic guardrails (G1–G7) and conflict detection.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-navy-750 bg-navy-850 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">4. Transparent Report</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Produces inspectable claim cards, verbatim excerpts, outbound links, and honest uncertainty reporting.
            </p>
          </div>
        </div>
      </section>

      {/* The 4 Verdicts Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            The Exactly Four Top-Level Verdicts
          </h2>
          <p className="text-sm text-slate-400">
            No ambiguous percentages presented as truth scores. Every verdict requires rigorous evidence grounding.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Supported
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every core assertion of the claim is affirmed verbatim by retrieved authoritative sources.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="h-4 w-4" />
              Contradicted (Refuted)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The retrieved live evidence directly refutes or proves false one or more core factual assertions.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Scale className="h-4 w-4" />
              Partially Supported (Revised)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The claim is partially accurate, but requires qualifications, is missing context, or has unsupported parts.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-600/40 bg-slate-900 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
              <Globe className="h-4 w-4" />
              Insufficient Evidence
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Retrieved sources do not contain enough clear information to substantiate or refute the assertion.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
