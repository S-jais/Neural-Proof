import React, { useState } from 'react';
import { VerificationRun } from '../types';
import { Download, Printer, Copy, Check, ChevronDown } from 'lucide-react';

interface ExportMenuProps {
  run: VerificationRun;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ run }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownloadJson = () => {
    const exportData = {
      schemaVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      run: {
        id: run.id,
        mode: run.mode,
        inputType: run.inputType,
        status: run.status,
        originalInput: run.originalInput,
        contextText: run.contextText,
        generatedAnswer: run.generatedAnswer,
        summary: run.summary,
        counts: run.counts,
        claims: run.claims,
        conflicts: run.conflicts,
        warnings: run.warnings,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        durationMs: run.durationMs,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neural-proof-report-${run.id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const handlePrint = () => {
    window.print();
    setOpen(false);
  };

  const handleCopySummary = () => {
    const summaryText = `Neural Proof Verification Report (${run.id.slice(0, 8)})\n` +
      `Status: ${run.status}\n` +
      `Summary: ${run.summary?.text || 'N/A'}\n` +
      `Supported: ${run.counts.supported}, Contradicted: ${run.counts.contradicted}, ` +
      `Partially Supported: ${run.counts.partiallySupported}, Insufficient Evidence: ${run.counts.insufficientEvidence}\n` +
      `Checked via live web retrieval with TinyFish.`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left no-print">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-navy-700 bg-navy-800 text-xs font-semibold text-slate-200 hover:bg-navy-750 hover:text-white transition-colors"
      >
        <Download className="h-3.5 w-3.5 text-accent-cyan" />
        <span>Export</span>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-xl bg-navy-850 border border-navy-700 ring-1 ring-black ring-opacity-5 divide-y divide-navy-750 z-50">
          <div className="py-1">
            <button
              onClick={handleDownloadJson}
              className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-navy-750 flex items-center gap-2"
            >
              <Download className="h-3.5 w-3.5 text-accent-cyan" />
              Download JSON
            </button>
            <button
              onClick={handlePrint}
              className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-navy-750 flex items-center gap-2"
            >
              <Printer className="h-3.5 w-3.5 text-accent-teal" />
              Print / Save as PDF
            </button>
            <button
              onClick={handleCopySummary}
              className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-navy-750 flex items-center gap-2"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              {copied ? 'Copied!' : 'Copy Summary'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
