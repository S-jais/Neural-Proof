import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

interface ClaimItem {
  v: 'ok' | 'mid' | 'bad';
  label: string;
  why: string;
  src: string[];
}

interface AssistantAnswer {
  who: string;
  segs: Array<[ 't', string ] | [ 'c', number, string ]>;
  claims: ClaimItem[];
}

const ANSWERS: AssistantAnswer[] = [
  {
    who: 'Chat assistant',
    segs: [
      ['t', 'The James Webb Space Telescope '],
      ['c', 0, 'launched on December 25, 2021'],
      ['t', ', and it '],
      ['c', 1, 'orbits the Earth about 1.5 million kilometres away'],
      ['t', '. Solar panels, meanwhile, '],
      ['c', 2, 'have zero environmental impact'],
      ['t', '.']
    ],
    claims: [
      { v: 'ok', label: 'Webb launched on December 25, 2021', why: 'NASA and ESA launch records give the same date.', src: ['nasa.gov', 'esa.int'] },
      { v: 'mid', label: 'Webb orbits Earth at 1.5 million km', why: 'The distance is right, but Webb orbits the Sun at the L2 point.', src: ['nasa.gov', 'esa.int'] },
      { v: 'bad', label: 'Solar panels have zero environmental impact', why: 'Lifecycle studies count manufacturing and disposal emissions.', src: ['ipcc.ch', 'nrel.gov'] }
    ]
  },
  {
    who: 'Search assistant',
    segs: [
      ['t', 'Mount Everest is '],
      ['c', 0, 'about 8,849 metres tall'],
      ['t', ', and '],
      ['c', 1, 'the Great Wall of China is visible from space with the naked eye'],
      ['t', '. Sharks, unlike most fish, '],
      ['c', 2, 'have skeletons made of cartilage, not bone'],
      ['t', '.']
    ],
    claims: [
      { v: 'ok', label: 'Everest is about 8,849 metres tall', why: 'The 2020 China and Nepal survey gives 8,848.86 m.', src: ['britannica.com', 'nationalgeographic.com'] },
      { v: 'bad', label: 'Great Wall is visible from space by eye', why: 'Astronauts report it is not visible unaided from orbit.', src: ['nasa.gov', 'esa.int'] },
      { v: 'ok', label: 'Shark skeletons are cartilage', why: 'Sharks are cartilaginous fish with no true bone.', src: ['britannica.com', 'si.edu'] }
    ]
  },
  {
    who: 'Writing assistant',
    segs: [
      ['c', 0, 'Humans use only 10% of their brains'],
      ['t', ', and '],
      ['c', 1, 'taking vitamin C prevents the common cold'],
      ['t', '. As a quick check, '],
      ['c', 2, 'water boils at 100 °C at sea level'],
      ['t', '.']
    ],
    claims: [
      { v: 'bad', label: 'Humans use only 10% of their brains', why: 'Imaging shows activity across nearly the whole brain.', src: ['nih.gov', 'scientificamerican.com'] },
      { v: 'mid', label: 'Vitamin C prevents the common cold', why: 'Trials show no prevention in most people, only a slight shortening.', src: ['cochranelibrary.com', 'nih.gov'] },
      { v: 'ok', label: 'Water boils at 100 °C at sea level', why: 'Standard pressure sets the boiling point at 100 °C.', src: ['nist.gov', 'britannica.com'] }
    ]
  }
];

const LABEL: Record<string, string> = { ok: 'Supported', mid: 'Nuanced', bad: 'Contradicted' };

export const LandingPage: React.FC = () => {
  const theatreRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLParagraphElement>(null);
  const rowsRef = useRef<HTMLOListElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);

  const [activeAsst, setActiveAsst] = useState(0);
  const [paused, setPaused] = useState(false);
  const [counts, setCounts] = useState({ c: 0, s: 0, v: 0 });
  const [liveState, setLiveState] = useState<'type' | 'scan' | 'check' | 'done'>('type');
  const [liveText, setLiveText] = useState('Typing');
  const [progressWidth, setProgressWidth] = useState(0.05);

  const runIdRef = useRef(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const inViewRef = useRef(true);

  // Helper wait that pauses when tab is hidden or paused
  const wait = async (ms: number, myRunId: number) => {
    let elapsed = 0;
    while (elapsed < ms) {
      await new Promise(r => setTimeout(r, 25));
      if (myRunId !== runIdRef.current) throw new Error('CANCEL');
      if (!pausedRef.current && inViewRef.current && !document.hidden) {
        elapsed += 25;
      }
    }
  };

  const srcChipHtml = (s: string) => `<span class="src"><svg class="ic"><use href="#i-globe"/></svg>${s}</span>`;

  const addWords = (parent: HTMLElement, text: string) => {
    text.split(/(\s+)/).forEach(tok => {
      if (!tok) return;
      if (/^\s+$/.test(tok)) {
        parent.appendChild(document.createTextNode(tok));
      } else {
        const w = document.createElement('span');
        w.className = 'w';
        w.textContent = tok;
        parent.appendChild(w);
      }
    });
  };

  const buildDoc = (ans: AssistantAnswer) => {
    if (!docRef.current) return;
    docRef.current.textContent = '';
    ans.segs.forEach(seg => {
      if (seg[0] === 't') {
        addWords(docRef.current!, seg[1]);
        return;
      }
      const c = ans.claims[seg[1]];
      const el = document.createElement('span');
      el.className = 'claim';
      el.dataset.v = c.v;
      el.dataset.i = String(seg[1]);
      addWords(el, seg[2]);
      const lastWord = el.querySelector('.w:last-of-type') || el;
      lastWord.insertAdjacentHTML(
        'beforeend',
        `<span class="tag" aria-hidden="true"><svg class="ic"><use href="#i-${c.v}"/></svg></span>`
      );
      docRef.current!.appendChild(el);
    });
  };

  const buildRows = (ans: AssistantAnswer) => {
    if (!rowsRef.current) return;
    rowsRef.current.innerHTML = ans.claims.map((c, i) => `
      <li class="trow" data-state="idle" data-v="${c.v}" data-i="${i}">
        <span class="tstate"><svg class="ic"><use href="#i-${c.v}"/></svg></span>
        <div class="tclaim"><span class="sk"></span><span class="tt">${c.label}</span></div>
        <span class="chip tverdict" data-v="${c.v}"><svg class="ic"><use href="#i-${c.v}"/></svg>${LABEL[c.v]}</span>
        <div class="tsrc"></div>
        <div class="twhy">${c.why}</div>
        <i class="tbar"></i>
      </li>`).join('');
  };

  // Trajectory flight from manuscript claim to ledger row
  const fly = async (fromEl: Element, toEl: Element, myRunId: number) => {
    if (!theatreRef.current) return;
    const T = theatreRef.current.getBoundingClientRect();
    const rs = fromEl.getClientRects();
    const a = rs[rs.length - 1] || fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    const x0 = a.right - T.left;
    const y0 = a.top - T.top + a.height / 2;
    const x1 = b.left - T.left + b.width / 2;
    const y1 = b.top - T.top + b.height / 2;
    const xm = (x0 + x1) / 2 + 50;
    const ym = (y0 + y1) / 2;

    const p = document.createElement('i');
    p.className = 'packet';
    theatreRef.current.appendChild(p);

    const an = p.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(.5)`, opacity: 0 },
      { transform: `translate(${xm}px, ${ym}px) scale(1)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${x1}px, ${y1}px) scale(.6)`, opacity: 0 }
    ], { duration: 800, easing: 'cubic-bezier(.45,0,.3,1)' });

    an.onfinish = () => p.remove();
    await wait(800, myRunId);
  };

  const checkClaim = async (
    c: ClaimItem,
    i: number,
    claimEl: Element,
    myRunId: number,
    countsAccumulator: { c: number; s: number; v: number }
  ) => {
    if (!rowsRef.current) return;
    const row = rowsRef.current.children[i] as HTMLElement;
    if (!row) return;

    await wait(i * 950, myRunId);
    const tstate = row.querySelector('.tstate');
    if (tstate) await fly(claimEl, tstate, myRunId);

    row.dataset.state = 'search';
    const tbar = row.querySelector('.tbar') as HTMLElement;
    if (tbar) tbar.style.setProperty('--dur', `${c.src.length * 0.52 + 0.9}s`);

    const holder = row.querySelector('.tsrc');
    for (const s of c.src) {
      await wait(520, myRunId);
      if (holder) holder.insertAdjacentHTML('beforeend', srcChipHtml(s));
      countsAccumulator.s += 1;
      setCounts({ ...countsAccumulator });
    }

    await wait(900, myRunId);
    row.dataset.state = 'done';
    claimEl.classList.add('judged');
    countsAccumulator.v += 1;
    setCounts({ ...countsAccumulator });
    await wait(250, myRunId);
  };

  const playAnswer = async (k: number, myRunId: number) => {
    const ans = ANSWERS[k];
    setActiveAsst(k);
    const countsAcc = { c: 0, s: 0, v: 0 };
    setCounts(countsAcc);
    buildDoc(ans);
    buildRows(ans);

    setProgressWidth(0.05);
    setLiveState('type');
    setLiveText('Typing');

    if (stageRef.current) {
      stageRef.current.animate(
        [{ opacity: 0, transform: 'translateX(28px)' }, { opacity: 1, transform: 'none' }],
        { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)' }
      );
    }
    await wait(650, myRunId);

    // Type words
    if (docRef.current) {
      const words = Array.from(docRef.current.querySelectorAll('.w')) as HTMLElement[];
      for (let i = 0; i < words.length; i++) {
        if (i) words[i - 1].classList.remove('cur');
        words[i].classList.add('on', 'cur');
        if (i % 5 === 0) setProgressWidth(0.05 + 0.25 * (i / words.length));
        await wait(60, myRunId);
      }
      if (words.length > 0) words[words.length - 1].classList.remove('cur');
    }

    // Scan
    setProgressWidth(0.32);
    setLiveState('scan');
    setLiveText('Finding claims');

    if (beamRef.current) {
      beamRef.current.animate([
        { top: '0%', opacity: 0 },
        { top: '6%', opacity: 1, offset: 0.08 },
        { top: 'calc(100% + 52px)', opacity: 1, offset: 0.92 },
        { top: 'calc(100% + 52px)', opacity: 0 }
      ], { duration: 1800, easing: 'ease-in-out' });
    }

    if (docRef.current) {
      const claimEls = Array.from(docRef.current.querySelectorAll('.claim'));
      for (let i = 0; i < claimEls.length; i++) {
        await wait(i ? 430 : 560, myRunId);
        claimEls[i].classList.add('marked');
        countsAcc.c += 1;
        setCounts({ ...countsAcc });
      }
      await wait(650, myRunId);

      // Check claims
      setProgressWidth(0.5);
      setLiveState('check');
      setLiveText('Checking sources');

      await Promise.all(
        ans.claims.map((c, i) => checkClaim(c, i, claimEls[i], myRunId, countsAcc))
      );
    }

    setProgressWidth(1);
    setLiveState('done');
    setLiveText('All claims checked');
    await wait(3800, myRunId);

    if (stageRef.current) {
      await stageRef.current.animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-28px)' }],
        { duration: 420, easing: 'ease-in', fill: 'forwards' }
      ).finished;
    }
  };

  const fillFinal = (k: number) => {
    runIdRef.current++;
    const ans = ANSWERS[k];
    setActiveAsst(k);
    buildDoc(ans);
    buildRows(ans);

    if (docRef.current) {
      docRef.current.querySelectorAll('.w').forEach(x => x.classList.add('on'));
      docRef.current.querySelectorAll('.claim').forEach(x => x.classList.add('marked', 'judged'));
    }
    if (rowsRef.current) {
      Array.from(rowsRef.current.children).forEach((r, i) => {
        (r as HTMLElement).dataset.state = 'done';
        const tsrc = r.querySelector('.tsrc');
        if (tsrc) tsrc.innerHTML = ans.claims[i].src.map(srcChipHtml).join('');
      });
    }

    setCounts({
      c: 3,
      s: ans.claims.reduce((acc, cur) => acc + cur.src.length, 0),
      v: 3
    });
    setLiveState('done');
    setLiveText('All claims checked');
    setProgressWidth(1);
  };

  const startLoop = (k = 0) => {
    const myRunId = ++runIdRef.current;
    (async () => {
      let i = k;
      try {
        while (true) {
          await playAnswer(i, myRunId);
          i = (i + 1) % ANSWERS.length;
        }
      } catch (e: any) {
        if (e.message !== 'CANCEL') {
          // loop terminated gracefully
        }
      }
    })();
  };

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver(
      entries => {
        inViewRef.current = entries[0].isIntersecting;
      },
      { threshold: 0.1 }
    );
    if (theatreRef.current) observer.observe(theatreRef.current);

    if (reduceMotion) {
      fillFinal(0);
    } else {
      startLoop(0);
    }

    // Hover effect: hovering claim highlights ledger row
    const doc = docRef.current;
    const handleMouseOver = (e: MouseEvent) => {
      const c = (e.target as HTMLElement).closest('.claim') as HTMLElement;
      if (!c || !c.classList.contains('judged')) return;
      c.classList.add('link');
      const idx = Number(c.dataset.i);
      if (rowsRef.current && rowsRef.current.children[idx]) {
        rowsRef.current.children[idx].classList.add('link');
      }
    };
    const handleMouseOut = (e: MouseEvent) => {
      const c = (e.target as HTMLElement).closest('.claim') as HTMLElement;
      if (!c) return;
      c.classList.remove('link');
      const idx = Number(c.dataset.i);
      if (rowsRef.current && rowsRef.current.children[idx]) {
        rowsRef.current.children[idx].classList.remove('link');
      }
    };

    if (doc) {
      doc.addEventListener('mouseover', handleMouseOver);
      doc.addEventListener('mouseout', handleMouseOut);
    }

    return () => {
      runIdRef.current++;
      observer.disconnect();
      if (doc) {
        doc.removeEventListener('mouseover', handleMouseOver);
        doc.removeEventListener('mouseout', handleMouseOut);
      }
    };
  }, []);

  const handleSelectAsst = (idx: number) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      fillFinal(idx);
    } else {
      startLoop(idx);
    }
  };

  return (
    <div className="view" data-view="home">
      {/* Hero band */}
      <div className="hero-band">
        <section className="hero wrap">
          <div className="hero-grid">
            <div className="hero-copy">
              <h1 className="hl" tabIndex={-1}>
                <span style={{ ['--k' as any]: 0 }}>See</span>{' '}
                <span style={{ ['--k' as any]: 1 }}>which</span>{' '}
                <span style={{ ['--k' as any]: 2 }}>parts</span>{' '}
                <span style={{ ['--k' as any]: 3 }}>of</span>{' '}
                <span style={{ ['--k' as any]: 4 }}>an</span>{' '}
                <span style={{ ['--k' as any]: 5 }}>AI</span>{' '}
                <span style={{ ['--k' as any]: 6 }}>answer</span>{' '}
                <span style={{ ['--k' as any]: 7 }}>hold</span>{' '}
                <span style={{ ['--k' as any]: 8 }}>up.</span>
              </h1>
              <p className="lede">
                Paste an answer from any AI assistant. Neural Proof splits it into claims,
                reads live web sources for each one, and marks it supported, nuanced or contradicted,
                with the sources attached.
              </p>
              <div className="cta-row">
                <Link className="btn primary" to="/verify">
                  Verify an answer
                </Link>
                <Link className="btn" to="/sample">
                  View sample report
                </Link>
              </div>
              <p className="fine">
                Works on answers from any AI tool. Evidence is retrieved from live web pages through TinyFish.
              </p>
            </div>

            {/* Theatre */}
            <div
              className="theatre"
              id="theatre"
              ref={theatreRef}
              role="region"
              aria-label="Animated example: Neural Proof checking answers from other AI assistants"
            >
              <div className="th-top">
                <div className="asst-row">
                  {ANSWERS.map((a, i) => (
                    <button
                      key={a.who}
                      className="asst"
                      type="button"
                      aria-pressed={activeAsst === i}
                      onClick={() => handleSelectAsst(i)}
                    >
                      <span className={`g g${i}`} />
                      {a.who}
                      <i
                        className="prog"
                        style={{
                          transform: activeAsst === i ? `scaleX(${progressWidth})` : 'scaleX(0)'
                        }}
                      />
                    </button>
                  ))}
                </div>
                <button
                  className="pp"
                  type="button"
                  aria-pressed={paused}
                  aria-label={paused ? 'Play animation' : 'Pause animation'}
                  onClick={() => setPaused(!paused)}
                >
                  <svg className="ic pause"><use href="#i-pause" /></svg>
                  <svg className="ic play"><use href="#i-play" /></svg>
                </button>
              </div>

              <div className="th-stats" aria-hidden="true">
                <span>
                  Claims found <b key={`c-${counts.c}`} className="bump">{counts.c}</b>
                </span>
                <span>
                  Sources read <b key={`s-${counts.s}`} className="bump">{counts.s}</b>
                </span>
                <span>
                  Verdicts <b key={`v-${counts.v}`} className="bump">{counts.v}</b>/3
                </span>
              </div>

              <div className="th-stage" ref={stageRef}>
                <div className="sheet th-doc">
                  <div className="th-doc-head">
                    <span>
                      Answer from <b>{ANSWERS[activeAsst]?.who || 'Assistant'}</b>
                    </span>
                    <span className="live" data-s={liveState}>
                      <i />
                      <span>{liveText}</span>
                    </span>
                  </div>
                  <p className="manuscript" ref={docRef} />
                  <div className="beam" ref={beamRef} />
                </div>
                <ol className="th-rows" ref={rowsRef} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* How a check runs */}
      <section className="process wrap" aria-labelledby="howTitle">
        <div>
          <h2 id="howTitle">How a check runs</h2>
          <p className="intro">Every step leaves something you can open and inspect.</p>
        </div>
        <div>
          <ol className="steps">
            <li>
              <span className="n">1</span>
              <h3>Split the answer into claims</h3>
              <p>Each factual statement becomes its own claim, so one wrong number can't hide inside a correct paragraph.</p>
            </li>
            <li>
              <span className="n">2</span>
              <h3>Read live sources</h3>
              <p>Neural Proof searches the web through TinyFish and keeps the pages it actually read for each claim.</p>
            </li>
            <li>
              <span className="n">3</span>
              <h3>Weigh the evidence and explain</h3>
              <p>Each claim gets a verdict, a written reason and its sources. When sources disagree, the report says so.</p>
            </li>
          </ol>
          <dl className="meanings">
            <div>
              <dt>
                <span className="chip" data-v="ok">
                  <svg className="ic"><use href="#i-ok" /></svg>Supported
                </span>
              </dt>
              <dd>Sources agree with the claim as written.</dd>
            </div>
            <div>
              <dt>
                <span className="chip" data-v="mid">
                  <svg className="ic"><use href="#i-mid" /></svg>Nuanced
                </span>
              </dt>
              <dd>Partly right, or right only in some contexts.</dd>
            </div>
            <div>
              <dt>
                <span className="chip" data-v="bad">
                  <svg className="ic"><use href="#i-bad" /></svg>Contradicted
                </span>
              </dt>
              <dd>Sources say something different.</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Design principle */}
      <section className="principle wrap">
        <blockquote>
          Every factual claim should be inspectable, every verdict should have a reason, every source should be traceable, and uncertainty should never be disguised as certainty.
        </blockquote>
        <p>Neural Proof design principle</p>
      </section>
    </div>
  );
};
