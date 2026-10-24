import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface ClaimData {
  id: number;
  v: 'ok' | 'mid' | 'bad';
  text: string;
  why: string;
  sources: Array<{ name: string; title: string; url: string }>;
}

const SAMPLE_CLAIMS: ClaimData[] = [
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
];

const LABEL: Record<string, string> = {
  ok: 'Supported',
  mid: 'Nuanced',
  bad: 'Contradicted'
};

export const SampleReportPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'ok' | 'mid' | 'bad'>('all');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true });
  const [copied, setCopied] = useState(false);
  const [barIn, setBarIn] = useState(false);

  useEffect(() => {
    // Trigger distribution bar clip-path entry animation
    const timer = setTimeout(() => setBarIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySummary = async () => {
    const summaryText =
      'Sample report: The Webb telescope and solar energy\n' +
      '3 claims checked. 1 supported, 1 nuanced, 1 contradicted.\n\n' +
      SAMPLE_CLAIMS.map((c) => `- [${LABEL[c.v]}] ${c.text}\n  Reason: ${c.why}`).join('\n\n');

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const filteredClaims = SAMPLE_CLAIMS.filter(
    (c) => filter === 'all' || c.v === filter
  );

  return (
    <div className="view page narrow">
      <div className="wrap">
        <div className="badges">
          <span className="badge plain">Illustrative sample</span>
          <span className="badge">Completed</span>
        </div>

        <h1 tabIndex={-1}>Sample report: the Webb telescope and solar energy</h1>
        <p className="sub">3 claims checked against live web sources.</p>

        {/* Summary card */}
        <section className="sheet summary" aria-labelledby="sumT">
          <h2 id="sumT">Summary</h2>
          <p>
            The Webb launch date holds up. The orbit claim has the right distance but the wrong centre of motion.
            The zero-impact claim for solar panels is contradicted by peer-reviewed lifecycle studies.
          </p>
        </section>

        {/* Distribution bar */}
        <section className="sheet dist" aria-label="Verdict distribution">
          <div
            className={`dist-bar ${barIn ? 'in' : ''}`}
            role="img"
            aria-label="1 supported, 1 nuanced, 1 contradicted"
          >
            <i data-v="ok" style={{ ['--n' as any]: 1 }} />
            <i data-v="mid" style={{ ['--n' as any]: 1 }} />
            <i data-v="bad" style={{ ['--n' as any]: 1 }} />
          </div>
          <div className="legend">
            <span data-v="ok">
              Supported <b>1</b>
            </span>
            <span data-v="mid">
              Nuanced <b>1</b>
            </span>
            <span data-v="bad">
              Contradicted <b>1</b>
            </span>
          </div>
        </section>

        {/* Claim list & Filters */}
        <div className="list-head">
          <h2>Checked claims</h2>
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

        {/* Actions */}
        <div className="actions" style={{ marginTop: '28px' }}>
          <button className="btn" type="button" onClick={handleCopySummary}>
            <svg className="ic"><use href="#i-copy" /></svg>
            <span>{copied ? 'Copied' : 'Copy summary'}</span>
          </button>
          <Link className="btn primary" to="/verify">
            Verify another answer
          </Link>
        </div>

        <p className="fine" style={{ marginTop: '20px' }}>
          Verdicts are backed by sentence-level evidence passages. Click any source to inspect the original citation.
        </p>
      </div>
    </div>
  );
};
