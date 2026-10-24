import React, { useState } from 'react';
import { VerificationRun } from '../types';
import { ClaimCard } from '../components/ClaimCard';
import { VerdictChart } from '../components/VerdictChart';
import { ExportMenu } from '../components/ExportMenu';
import { ModeBanner } from '../components/ModeBanner';
import { Search } from 'lucide-react';

const SAMPLE_RUN_FIXTURE: VerificationRun = {
  id: 'fixture-sample-solar-report',
  status: 'COMPLETED',
  currentStage: 'COMPLETED',
  mode: 'MOCK',
  inputType: 'PASTED_ANSWER',
  originalInput:
    'Solar energy generation has zero environmental impact throughout its lifecycle. Most residential silicon panels operate with a lifespan of 25 to 30 years. In 2024, solar power generated over 15% of total global electricity.',
  contextText: 'Renewable energy lifecycle and global grid statistics',
  reviewBeforeVerify: true,
  summary: {
    text: 'Out of 3 claims evaluated against live evidence: 1 claim is supported (solar panel operational lifespan), 1 claim is contradicted by authoritative lifecycle assessments (solar energy produces emissions during manufacturing and mining, thus not zero), and 1 claim is contradicted by global energy agency statistics (solar provided approximately 5.5% of global electricity in 2023–2024, not 15%).',
    method: 'FIXTURE',
  },
  counts: {
    totalClaims: 3,
    includedClaims: 3,
    supported: 1,
    contradicted: 2,
    partiallySupported: 0,
    insufficientEvidence: 0,
    notCompleted: 0,
  },
  warnings: [],
  startedAt: '2026-10-24T12:00:00Z',
  completedAt: '2026-10-24T12:00:45Z',
  durationMs: 45000,
  createdAt: '2026-10-24T12:00:00Z',
  conflicts: [
    {
      id: 'conf-1',
      claimId: 'claim-1',
      conflictType: 'FACTUAL_DISAGREEMENT',
      description:
        'Advocacy sites claim zero emissions, while NREL and IPCC scientific lifecycle analyses document manufacturing emissions between 20-50 g CO2/kWh.',
      resolution: 'PREFERRED_SIDE_B',
      resolutionBasis:
        'Primary scientific research and peer-reviewed lifecycle dataset preferred over marketing summaries.',
      createdAt: '2026-10-24T12:00:20Z',
    },
  ],
  claims: [
    {
      id: 'claim-1',
      ordinal: 1,
      claimKey: 'c1',
      originalText: 'Solar energy generation has zero environmental impact throughout its lifecycle.',
      normalizedText: 'Solar energy generation has zero environmental impact throughout its entire lifecycle.',
      claimType: 'SCIENTIFIC',
      isVerifiable: true,
      isTimeSensitive: false,
      entities: ['Solar energy', 'lifecycle'],
      qualifiers: ['zero'],
      included: true,
      processingStatus: 'COMPLETED',
      verdict: 'CONTRADICTED',
      confidenceLabel: 'HIGH',
      confidenceBasis: 'Authoritative life-cycle assessments from national laboratory and IPCC.',
      explanation:
        'While photovoltaic panels emit no greenhouse gases during direct electricity generation, comprehensive life cycle assessments document environmental impacts from silica mining, manufacturing energy, and hazardous chemical processing.',
      verdictRationale:
        'Direct contradiction: NREL and peer-reviewed research document that solar PV has life-cycle greenhouse gas emissions of 20 to 50 grams of CO2-equivalent per kilowatt-hour.',
      unsupportedParts: [],
      neededQualifications: ['Zero emissions applies strictly to electricity generation, not full lifecycle.'],
      limitations: [],
      createdAt: '2026-10-24T12:00:10Z',
      evidence: [
        {
          id: 'ev-1',
          passageId: 's1-p1',
          passageText:
            'While solar PV produces no direct greenhouse gases during electricity generation, the manufacturing phase requires energy and raw mineral mining. Comprehensive lifecycle assessments calculate solar PV emissions between 20 and 50 g CO2-eq/kWh.',
          stance: 'CONTRADICTS',
          note: 'Documents non-zero emissions across the full lifecycle.',
          usedInVerdict: true,
          sourceId: 'src-1',
          sourceUrl: 'https://www.nrel.gov/analysis/life-cycle-assessment.html',
          sourceDomain: 'nrel.gov',
          sourceTitle: 'Life Cycle Assessment of Photovoltaics | NREL',
          sourceClass: 'PRIMARY_RESEARCH_OR_DATASET',
          publicationDate: '2023-04-10',
          retrievalMethod: 'FETCH',
        },
      ],
    },
    {
      id: 'claim-2',
      ordinal: 2,
      claimKey: 'c2',
      originalText: 'Most residential silicon panels operate with a lifespan of 25 to 30 years.',
      normalizedText: 'Most residential silicon photovoltaic panels operate with an expected lifespan of 25 to 30 years.',
      claimType: 'NUMERICAL',
      isVerifiable: true,
      isTimeSensitive: false,
      entities: ['silicon panels'],
      qualifiers: ['most', '25 to 30 years'],
      included: true,
      processingStatus: 'COMPLETED',
      verdict: 'SUPPORTED',
      confidenceLabel: 'HIGH',
      confidenceBasis: 'Official Department of Energy guidelines and manufacturer standard warranties.',
      explanation:
        'Authoritative documentation from the U.S. Department of Energy and National Renewable Energy Laboratory confirms that silicon photovoltaic panels are designed and warrantied for a useful lifespan of 25 to 30 years.',
      verdictRationale:
        'Direct support: Standard industry warranties and federal energy testing confirm degradation rates of 0.5% per year, ensuring over 80% capacity after 25 years.',
      unsupportedParts: [],
      neededQualifications: [],
      limitations: [],
      createdAt: '2026-10-24T12:00:15Z',
      evidence: [
        {
          id: 'ev-2',
          passageId: 's2-p1',
          passageText:
            'Most solar panels are designed to last between 25 and 30 years. During this period, degradation occurs at an average rate of 0.5% per year, meaning panels typically produce at least 80% of their original output after 25 years.',
          stance: 'SUPPORTS',
          note: 'Directly confirms the 25 to 30 year operational lifespan.',
          usedInVerdict: true,
          sourceId: 'src-2',
          sourceUrl: 'https://energy.gov/eere/solar/solar-photovoltaic-cell-basics',
          sourceDomain: 'energy.gov',
          sourceTitle: 'Solar Photovoltaic Cell Basics | Department of Energy',
          sourceClass: 'OFFICIAL_GOVERNMENT',
          publicationDate: '2024-01-15',
          retrievalMethod: 'FETCH',
        },
      ],
    },
    {
      id: 'claim-3',
      ordinal: 3,
      claimKey: 'c3',
      originalText: 'In 2024, solar power generated over 15% of total global electricity.',
      normalizedText: 'In 2024, solar power generated over 15% of total global electricity.',
      claimType: 'STATISTICAL',
      isVerifiable: true,
      isTimeSensitive: true,
      entities: ['solar power', 'global electricity'],
      qualifiers: ['over 15%'],
      included: true,
      processingStatus: 'COMPLETED',
      verdict: 'CONTRADICTED',
      confidenceLabel: 'HIGH',
      confidenceBasis: 'International Energy Agency (IEA) official global electricity generation data.',
      explanation:
        'Official statistical data from the International Energy Agency (IEA) reports that solar PV generated approximately 5.5% of total global electricity generation in 2023, and approximately 6% in 2024, significantly below the asserted 15%.',
      verdictRationale:
        'Direct contradiction: Official IEA reports record solar global share at ~5.5–6%, refuting the 15% claim.',
      unsupportedParts: [],
      neededQualifications: [],
      limitations: [],
      createdAt: '2026-10-24T12:00:20Z',
      evidence: [
        {
          id: 'ev-3',
          passageId: 's3-p1',
          passageText:
            'Solar PV generation increased by a record 340 TWh in 2023, accounting for 5.5% of total global electricity supply. All renewable sources combined reached roughly 30%.',
          stance: 'CONTRADICTS',
          note: 'Official statistics show 5.5% share, refuting 15% assertion.',
          usedInVerdict: true,
          sourceId: 'src-3',
          sourceUrl: 'https://www.iea.org/reports/solar-pv',
          sourceDomain: 'iea.org',
          sourceTitle: 'Solar PV Report | International Energy Agency',
          sourceClass: 'INTERGOVERNMENTAL_OR_STANDARDS',
          publicationDate: '2024-06-20',
          retrievalMethod: 'FETCH',
        },
      ],
    },
  ],
};

export const SampleReportPage: React.FC = () => {
  const [run] = useState<VerificationRun>(SAMPLE_RUN_FIXTURE);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerdictFilter, setSelectedVerdictFilter] = useState('ALL');

  const filteredClaims = run.claims.filter((c) => {
    if (selectedVerdictFilter !== 'ALL' && c.verdict !== selectedVerdictFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.normalizedText.toLowerCase().includes(q) ||
        (c.explanation && c.explanation.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Permanent Sample Report Banner */}
      <ModeBanner mode="SAMPLE" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-semibold">
                Demonstration Fixture
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                COMPLETED
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Sample Report: Solar Energy Lifecycle & Grid Statistics
            </h1>
          </div>

          <ExportMenu run={run} />
        </div>

        {/* Executive Summary */}
        <div className="rounded-xl border border-navy-750 bg-navy-850 p-6 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-accent-cyan">
            Executive Verification Summary
          </h3>
          <p className="text-sm sm:text-base leading-relaxed text-slate-200">
            {run.summary.text}
          </p>
        </div>

        {/* Verdict Distribution Chart */}
        <VerdictChart counts={run.counts} />

        {/* Filters */}
        <div className="flex items-center justify-between border-b border-navy-850 pb-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Verified Claims ({run.claims.length})
          </h2>

          <div className="flex items-center gap-3">
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
        </div>

        {/* Claims List */}
        <div className="space-y-4">
          {filteredClaims.map((claim, idx) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              conflicts={run.conflicts.filter((c) => c.claimId === claim.id)}
              defaultExpanded={idx === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
