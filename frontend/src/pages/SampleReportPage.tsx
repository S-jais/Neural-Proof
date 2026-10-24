import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface ClaimData {
  id: number;
  v: 'ok' | 'mid' | 'bad';
  text: string;
  why: string;
  sources: Array<{ name: string; title: string; url: string }>;
}

interface ReportBundle {
  assistant: 'Chat assistant' | 'Search assistant' | 'Writing assistant';
  title: string;
  subtitle: string;
  summary: string;
  counts: { ok: number; mid: number; bad: number };
  claims: ClaimData[];
  manuscriptMarkup?: {
    original: string;
    annotatedHtml: string;
  };
  sourcesAudit?: Array<{
    domain: string;
    url: string;
    title: string;
    crawlStatus: string;
    stance: 'Supports' | 'Contradicts' | 'Nuances';
  }>;
}

const REPORTS: Record<string, ReportBundle> = {
  'Chat assistant': {
    assistant: 'Chat assistant',
    title: 'Sample report: The Webb telescope and solar energy',
    subtitle: 'Conversational answer audited against peer-reviewed astrophysics and energy studies.',
    summary: 'The Webb launch date holds up. The orbit claim has the right distance but the wrong centre of motion. The zero-impact claim for solar panels is contradicted by peer-reviewed lifecycle studies.',
    counts: { ok: 1, mid: 1, bad: 1 },
    claims: [
      {
        id: 1,
        v: 'ok',
        text: 'The James Webb Space Telescope launched on December 25, 2021.',
        why: 'Launch records from NASA, ESA, and Arianespace give the same date, and nothing in the verified live evidence disputes it.',
        sources: [
          { name: 'NASA', title: 'Webb mission and launch overview', url: 'https://nasa.gov/webb' },
          { name: 'ESA', title: 'Webb launch on Ariane 5 from Kourou', url: 'https://esa.int/Science_Exploration/Space_Science/Webb' }
        ]
      },
      {
        id: 2,
        v: 'mid',
        text: 'It orbits the Earth about 1.5 million kilometres away.',
        why: 'The distance is right, but Webb does not orbit Earth. It circles the Sun at the second Lagrange point (L2), approximately 1.5 million kilometres from Earth.',
        sources: [
          { name: 'NASA', title: 'Webb orbit and trajectory explained', url: 'https://webb.nasa.gov/content/about/orbit.html' },
          { name: 'ESA', title: 'Why Webb sits at the Sun-Earth L2 halo orbit', url: 'https://esa.int/Science_Exploration/Space_Science/Webb/L2_orbit' }
        ]
      },
      {
        id: 3,
        v: 'bad',
        text: 'Solar panels have zero environmental impact.',
        why: 'Comprehensive lifecycle assessments quantify emissions and material waste from silicon refining, quartz mining, transportation, and end-of-life recycling. While emissions are vastly lower than fossil fuels, they are not zero.',
        sources: [
          { name: 'IPCC', title: 'Lifecycle emissions of electricity generation systems', url: 'https://ipcc.ch/report/ar6/wg3/' },
          { name: 'NREL', title: 'Life cycle assessment harmonization of photovoltaics', url: 'https://nrel.gov/analysis/life-cycle-assessment.html' }
        ]
      }
    ]
  },
  'Search assistant': {
    assistant: 'Search assistant',
    title: 'Sample report: Mount Everest, the Great Wall, and Shark anatomy',
    subtitle: 'AI Search overview (Perplexity / Google AI) audited against live web crawl.',
    summary: 'Everest elevation is corroborated by joint survey records. The claim that the Great Wall is visible from space unaided is contradicted by NASA astronauts and orbital telemetry. Shark cartilage anatomy is supported.',
    counts: { ok: 2, mid: 0, bad: 1 },
    claims: [
      {
        id: 101,
        v: 'ok',
        text: 'Mount Everest is about 8,849 metres tall.',
        why: 'The definitive 2020 joint survey by China and Nepal established Mount Everest’s official height at 8,848.86 metres (rounded to 8,849 m).',
        sources: [
          { name: 'Britannica', title: 'Mount Everest height and topography', url: 'https://britannica.com/place/Mount-Everest' },
          { name: 'National Geographic', title: 'Mount Everest official revised elevation', url: 'https://nationalgeographic.com/adventure/article/mount-everest-new-height' }
        ]
      },
      {
        id: 102,
        v: 'bad',
        text: 'The Great Wall of China is visible from space with the naked eye.',
        why: 'Multiple astronaut debriefs and orbital photography confirm the wall is composed of materials identical to surrounding terrain and is far too narrow to distinguish with the unaided eye from low Earth orbit.',
        sources: [
          { name: 'NASA', title: 'China’s wall less and more visible from space', url: 'https://nasa.gov/vision/space/workinginspace/great_wall.html' },
          { name: 'ESA', title: 'Great Wall from orbit observation limits', url: 'https://esa.int/Applications/Observing_the_Earth' }
        ]
      },
      {
        id: 103,
        v: 'ok',
        text: 'Sharks have skeletons made of cartilage, not bone.',
        why: 'Sharks are classified as Chondrichthyes (cartilaginous fishes) whose endoskeletons consist entirely of flexible cartilage without true ossified bone tissue.',
        sources: [
          { name: 'Smithsonian', title: 'Shark anatomy and cartilaginous skeleton', url: 'https://si.edu/spotlight/sharks' },
          { name: 'Britannica', title: 'Chondrichthyes skeletal traits', url: 'https://britannica.com/animal/chondrichthian' }
        ]
      }
    ],
    sourcesAudit: [
      { domain: 'britannica.com', url: 'https://britannica.com/place/Mount-Everest', title: 'Mount Everest height and topography', crawlStatus: 'HTTP 200 • Live Crawl Verified', stance: 'Supports' },
      { domain: 'nationalgeographic.com', url: 'https://nationalgeographic.com/adventure/article/mount-everest-new-height', title: 'Mount Everest official revised elevation', crawlStatus: 'HTTP 200 • Live Crawl Verified', stance: 'Supports' },
      { domain: 'nasa.gov', url: 'https://nasa.gov/vision/space/workinginspace/great_wall.html', title: 'Astronaut photography debunks unaided naked eye visibility', crawlStatus: 'HTTP 200 • Live Crawl Verified', stance: 'Contradicts' },
      { domain: 'si.edu', url: 'https://si.edu/spotlight/sharks', title: 'Smithsonian shark skeletal structure taxonomy', crawlStatus: 'HTTP 200 • Live Crawl Verified', stance: 'Supports' }
    ]
  },
  'Writing assistant': {
    assistant: 'Writing assistant',
    title: 'Sample report: Human brain myth & common cold remedies',
    subtitle: 'Draft prose audited for popular scientific folklore and overconfident assertions.',
    summary: 'The 10% brain myth is contradicted by neuroimaging across all cerebral regions. Vitamin C prevention is nuanced; clinical trials show modest symptom duration reduction but no general prevention. Water boiling point is supported.',
    counts: { ok: 1, mid: 1, bad: 1 },
    claims: [
      {
        id: 201,
        v: 'bad',
        text: 'Humans use only 10% of their brains.',
        why: 'Functional MRI and PET brain scans prove that humans use virtually 100% of their brains over the course of a normal day, with no dormant evolutionary capacity.',
        sources: [
          { name: 'NIH', title: 'Do people only use 10 percent of their brain?', url: 'https://nih.gov/health-information/brain-basics' },
          { name: 'Scientific American', title: 'People only use 10 percent of their brain myth debunked', url: 'https://scientificamerican.com/article/do-people-only-use-10-percent-of-their-brains/' }
        ]
      },
      {
        id: 202,
        v: 'mid',
        text: 'Taking vitamin C prevents the common cold.',
        why: 'Extensive randomized meta-analyses demonstrate that routine vitamin C supplementation does not prevent colds in the general community, though it marginally reduces symptom duration by 8%.',
        sources: [
          { name: 'Cochrane Library', title: 'Vitamin C for preventing and treating the common cold', url: 'https://cochranelibrary.com/cdsr/doi/10.1002/14651858.CD000980.pub4/full' },
          { name: 'NIH', title: 'Vitamin C Fact Sheet for Health Professionals', url: 'https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/' }
        ]
      },
      {
        id: 203,
        v: 'ok',
        text: 'Water boils at 100 °C at sea level.',
        why: 'Under standard international atmospheric pressure (101.325 kPa), the thermodynamic boiling transition of pure water occurs at 100.0 °C.',
        sources: [
          { name: 'NIST', title: 'Thermophysical properties of water standards', url: 'https://nist.gov/srd/nist10' },
          { name: 'Britannica', title: 'Boiling point constants at standard pressure', url: 'https://britannica.com/science/boiling-point' }
        ]
      }
    ],
    manuscriptMarkup: {
      original: 'Humans use only 10% of their brains, and taking vitamin C prevents the common cold. As a quick check, water boils at 100 °C at sea level.',
      annotatedHtml: `
        <span class="claim judged" data-v="bad" title="Contradicted by neuroimaging">
          <del>Humans use only 10% of their brains</del>
          <span class="tag"><svg class="ic"><use href="#i-bad"/></svg></span>
        </span>
        <span style="color:var(--bad);font-weight:600;font-size:0.9em;margin-inline:4px;">[Correction: Neuroimaging proves active metabolic processes across virtually 100% of brain tissue]</span>,
        and
        <span class="claim judged" data-v="mid" title="Nuanced: slight symptom duration decrease only">
          taking vitamin C prevents the common cold
          <span class="tag"><svg class="ic"><use href="#i-mid"/></svg></span>
        </span>
        <span style="color:var(--mid);font-weight:600;font-size:0.9em;margin-inline:4px;">[Nuance: Trials show no prevention in the general population, only ~8% duration reduction]</span>.
        As a quick check,
        <span class="claim judged" data-v="ok" title="Supported by NIST standards">
          water boils at 100 °C at sea level
          <span class="tag"><svg class="ic"><use href="#i-ok"/></svg></span>
        </span>.
      `
    }
  }
};

const LABEL: Record<string, string> = {
  ok: 'Supported',
  mid: 'Nuanced',
  bad: 'Contradicted'
};

export const SampleReportPage: React.FC = () => {
  const [activeAsst, setActiveAsst] = useState<'Chat assistant' | 'Search assistant' | 'Writing assistant'>('Chat assistant');
  const [activeTab, setActiveTab] = useState<'ledger' | 'features'>('ledger');
  const [filter, setFilter] = useState<'all' | 'ok' | 'mid' | 'bad'>('all');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true, 101: true, 201: true });
  const [copied, setCopied] = useState(false);
  const [barIn, setBarIn] = useState(false);

  const report = REPORTS[activeAsst];

  useEffect(() => {
    setBarIn(false);
    const timer = setTimeout(() => setBarIn(true), 60);
    return () => clearTimeout(timer);
  }, [activeAsst]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySummary = async () => {
    const summaryText =
      `Sample report for ${report.assistant}: ${report.title}\n` +
      `Summary: ${report.summary}\n\n` +
      report.claims.map((c) => `- [${LABEL[c.v]}] ${c.text}\n  Reason: ${c.why}`).join('\n\n');

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const filteredClaims = report.claims.filter(
    (c) => filter === 'all' || c.v === filter
  );

  return (
    <div className="view page narrow">
      <div className="wrap">
        {/* Assistant Switcher in Report */}
        <div style={{ marginBottom: '20px' }}>
          <span className="field-label" style={{ margin: '0 0 10px' }}>
            Select Assistant Report to Inspect
          </span>
          <div className="asst-row">
            {(['Chat assistant', 'Search assistant', 'Writing assistant'] as const).map((asst, i) => (
              <button
                key={asst}
                className="asst"
                type="button"
                aria-pressed={activeAsst === asst}
                onClick={() => {
                  setActiveAsst(asst);
                  setFilter('all');
                }}
              >
                <span className={`g g${i}`} />
                {asst}
              </button>
            ))}
          </div>
        </div>

        <div className="badges">
          <span className="badge plain">{report.assistant} Report</span>
          <span className="badge">Completed • Live Verified</span>
        </div>

        <h1 tabIndex={-1}>{report.title}</h1>
        <p className="sub">{report.subtitle}</p>

        {/* Summary card */}
        <section className="sheet summary" aria-labelledby="sumT">
          <h2 id="sumT">Summary</h2>
          <p>{report.summary}</p>
        </section>

        {/* Distribution bar */}
        <section className="sheet dist" aria-label="Verdict distribution">
          <div
            className={`dist-bar ${barIn ? 'in' : ''}`}
            role="img"
            aria-label={`${report.counts.ok} supported, ${report.counts.mid} nuanced, ${report.counts.bad} contradicted`}
          >
            {report.counts.ok > 0 && <i data-v="ok" style={{ ['--n' as any]: report.counts.ok }} />}
            {report.counts.mid > 0 && <i data-v="mid" style={{ ['--n' as any]: report.counts.mid }} />}
            {report.counts.bad > 0 && <i data-v="bad" style={{ ['--n' as any]: report.counts.bad }} />}
          </div>
          <div className="legend">
            <span data-v="ok">
              Supported <b>{report.counts.ok}</b>
            </span>
            <span data-v="mid">
              Nuanced <b>{report.counts.mid}</b>
            </span>
            <span data-v="bad">
              Contradicted <b>{report.counts.bad}</b>
            </span>
          </div>
        </section>

        {/* Mode-specific feature tabs */}
        {(report.manuscriptMarkup || report.sourcesAudit) && (
          <div className="modes" style={{ marginTop: '24px' }}>
            <button
              className="mode"
              type="button"
              aria-selected={activeTab === 'ledger'}
              onClick={() => setActiveTab('ledger')}
            >
              Claims Ledger
            </button>
            {report.manuscriptMarkup && (
              <button
                className="mode"
                type="button"
                aria-selected={activeTab === 'features'}
                onClick={() => setActiveTab('features')}
              >
                Editorial Blue-Pencil Markup
              </button>
            )}
            {report.sourcesAudit && (
              <button
                className="mode"
                type="button"
                aria-selected={activeTab === 'features'}
                onClick={() => setActiveTab('features')}
              >
                Live Web Grounding Audit ({report.sourcesAudit.length} sources)
              </button>
            )}
          </div>
        )}

        {/* Feature Tab: Editorial Markup for Writing Assistant */}
        {activeTab === 'features' && report.manuscriptMarkup && (
          <div className="sheet" style={{ padding: '24px', marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                Writing Assistant: Inline Blue-Pencil Manuscript
              </h3>
              <span className="badge">Proofing Mode</span>
            </div>
            <p style={{ color: 'var(--ink-2)', fontSize: '0.875rem', marginBottom: '16px' }}>
              The verifier acts as an editor: false claims and scientific myths are struck through, and factual revisions are written directly into the draft.
            </p>
            <div
              className="manuscript"
              style={{
                background: 'var(--paper)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--rule)',
                padding: '24px'
              }}
              dangerouslySetInnerHTML={{ __html: report.manuscriptMarkup.annotatedHtml }}
            />
          </div>
        )}

        {/* Feature Tab: Web Grounding Audit for Search Assistant */}
        {activeTab === 'features' && report.sourcesAudit && (
          <div className="sheet" style={{ padding: '24px', marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                Search Assistant: Live Web Crawl & Citation Audit
              </h3>
              <span className="badge">TinyFish Grounding</span>
            </div>
            <p style={{ color: 'var(--ink-2)', fontSize: '0.875rem', marginBottom: '16px' }}>
              Every web citation cited by synthetic search summaries is accessed directly via live scraping to guarantee citation integrity.
            </p>
            <div style={{ display: 'grid', gap: '12px' }}>
              {report.sourcesAudit.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    border: '1px solid var(--rule)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--paper)',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <div>
                    <span className="src" style={{ marginRight: '8px' }}>
                      <svg className="ic"><use href="#i-globe" /></svg>
                      {s.domain}
                    </span>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[var(--blue)] hover:underline"
                    >
                      {s.title}
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ok)', fontWeight: 600 }}>
                      {s.crawlStatus}
                    </span>
                    <span
                      className="chip"
                      data-v={s.stance === 'Supports' ? 'ok' : s.stance === 'Contradicts' ? 'bad' : 'mid'}
                    >
                      {s.stance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Claims Ledger */}
        {(activeTab === 'ledger' || (!report.manuscriptMarkup && !report.sourcesAudit)) && (
          <>
            <div className="list-head">
              <h2>Checked claims ({filteredClaims.length})</h2>
              <div className="filters" role="group" aria-label="Filter claims by verdict">
                {(['all', 'ok', 'mid', 'bad'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={filter === f}
                    onClick={() => setFilter(f)}
                  >
                    {f === 'all' ? 'All' : LABEL[f]}
                  </button>
                ))}
              </div>
            </div>

            <ul className="sheet claims">
              {filteredClaims.map((c) => {
                const isExp = !!expanded[c.id];
                return (
                  <li key={c.id} className="claim-item" data-v={c.v}>
                    <button
                      className="claim-btn"
                      type="button"
                      aria-expanded={isExp}
                      onClick={() => toggleExpand(c.id)}
                    >
                      <span className="chip" data-v={c.v}>
                        <svg className="ic"><use href={`#i-${c.v}`} /></svg>
                        {LABEL[c.v]}
                      </span>
                      <span className="claim-text">{c.text}</span>
                      <span className="meta">{c.sources.length} sources</span>
                      <svg className="ic chev"><use href="#i-chev" /></svg>
                    </button>

                    <div className="panel" role="region">
                      <div className="panel-in">
                        <h4>Why this verdict</h4>
                        <p>{c.why}</p>

                        <h4>Sources read</h4>
                        <ul>
                          {c.sources.map((s, idx) => (
                            <li key={idx}>
                              <strong>{s.name}</strong>{' '}
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-[var(--blue)] transition-colors"
                              >
                                {s.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {/* Actions */}
        <div className="actions" style={{ marginTop: '28px' }}>
          <button className="btn" type="button" onClick={handleCopySummary}>
            <svg className="ic"><use href="#i-copy" /></svg>
            <span>{copied ? 'Copied' : 'Copy summary'}</span>
          </button>
          <Link
            className="btn primary"
            to={`/verify?assistant=${encodeURIComponent(report.assistant)}&sample=${activeAsst === 'Writing assistant' ? 0 : 1}`}
          >
            Verify another {report.assistant} answer
          </Link>
        </div>

        <p className="fine" style={{ marginTop: '20px' }}>
          Verdicts are backed by sentence-level evidence passages. Click any source to inspect the original citation.
        </p>
      </div>
    </div>
  );
};
