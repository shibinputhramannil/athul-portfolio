import { useEffect, useMemo, useRef } from "react";
import SectionHead from "./SectionHead";
import Icon from "./Icon";
import Reveal from "./Reveal";
import { toolMeta } from "../lib/icons";
import { usePauseOffscreen, useScrollFrame } from "../lib/ticker";
import { Scramble } from "./Kinetic";
import { MaskDemo, ReframeDemo, RotoDemo } from "./ToolAI";
import AIPlayer from "./AIPlayer";

// What each tool is for (a general product role, not a claim about any
// specific project), and one real AI feature of it, played as a demo.
const toolInfo = {
  premiere: {
    verb: "Cut",
    use: "Editing & assembly",
    feature: "Auto Reframe",
    desc: "Premiere's AI finds the subject and keeps it in frame, turning a wide shot into a vertical 9:16 cut.",
    steps: ["Detect the subject", "Track the motion", "Reframe to 9:16"],
    chapters: ["Detect", "Track", "Reframe"],
    captions: [
      "The AI scans every frame and finds the subject.",
      "It tracks him as he moves, frame by frame.",
      "Then reframes the wide shot into a vertical 9:16 cut.",
    ],
    result: "Vertical cut ready",
    Demo: ReframeDemo,
  },
  aftereffects: {
    verb: "Animate",
    use: "Motion graphics & VFX",
    feature: "Roto Brush",
    desc: "After Effects' AI separates the subject from the background on every frame, so titles and effects can sit behind it.",
    steps: ["Paint the subject", "Propagate the mask", "Composite behind"],
    chapters: ["Paint", "Propagate", "Composite"],
    captions: [
      "One brush stroke tells the AI what to keep.",
      "It traces her edge and follows it through every frame.",
      "Now the title can sit behind her.",
    ],
    result: "Title behind subject",
    Demo: RotoDemo,
  },
  resolve: {
    verb: "Grade",
    use: "Colour grading & finishing",
    feature: "Magic Mask",
    desc: "Resolve's Neural Engine masks a person from a single stroke, so the subject and the background are graded separately.",
    steps: ["Stroke the person", "Neural mask", "Grade subject and background"],
    chapters: ["Stroke", "Mask", "Grade"],
    captions: [
      "One stroke on the person is all it needs.",
      "The Neural Engine finds and masks them.",
      "Then subject and background are graded separately.",
    ],
    result: "Graded in two looks",
    Demo: MaskDemo,
  },
};
const toolGlow = {
  premiere: "153 153 255",
  aftereffects: "153 153 255",
  resolve: "234 58 50",
};

/** Decorative keyframes for each skill lane (seeded, so they never jump). */
function buildLanes(count) {
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: count }, () => {
    const n = 2 + Math.floor(rand() * 3);
    const xs = Array.from({ length: n }, () =>
      Math.round(6 + rand() * 88),
    ).sort((a, b) => a - b);
    return xs.filter((x, i) => i === 0 || x - xs[i - 1] > 8);
  });
}

/**
 * One tool as a big card: its AI demo, played like a product video, on the
 * left; on the right the tool,
 * its job, the feature, what it does, and the three steps of the demo
 * filling in as it plays.
 */
function Tool({ name, i }) {
  const meta = toolMeta[name];
  const info = meta && toolInfo[meta.brand];
  if (!info) return null;
  const { Demo } = info;
  return (
    <Reveal
      as="li"
      className="tool"
      i={i}
      style={{ "--glow": toolGlow[meta.brand] }}
    >
      <span className="tool__glow" aria-hidden="true" />
      <div className="tool__stage">
        <AIPlayer
          Demo={Demo}
          n={i + 1}
          feature={info.feature}
          product={meta.name}
          captions={info.captions}
          chapters={info.chapters}
          result={info.result}
        />
      </div>
      <div className="tool__info">
        <div className="tool__head">
          <span className="tool__icon">
            <Icon brand={meta.brand} size={30} />
          </span>
          <span className="tool__verb">{info.verb}</span>
          <span className="tool__no label" aria-hidden="true">
            0{i + 1}
          </span>
        </div>
        <span className="tool__name">{meta.name}</span>
        <span className="label tool__use">{info.use}</span>
        <p className="tool__feature">
          <span className="tool__ai">AI</span>
          {info.feature}
        </p>
        <p className="tool__desc">{info.desc}</p>
        <ol className="ai-steps" aria-label={`${info.feature} steps`}>
          {info.steps.map((step, k) => (
            <li className={`ai-step ai-step--${k + 1}`} key={step}>
              <span className="ai-step__n" aria-hidden="true">
                {k + 1}
              </span>
              <span className="ai-step__t">{step}</span>
              <span className="ai-step__bar" aria-hidden="true">
                <i />
              </span>
            </li>
          ))}
        </ol>
      </div>
      <span className="tool__shade" aria-hidden="true" />
    </Reveal>
  );
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export default function Craft({ number, profile }) {
  const lanes = useMemo(
    () => buildLanes(profile.skills.length),
    [profile.skills.length],
  );
  const tcRef = useRef(null);
  const kitRef = useRef(null);

  // Stacked deck (wide screens): the cards stick in turn, and as the next
  // one slides over, the card beneath eases back and dims. Geometry is
  // cached on resize; scrolling only writes scale and opacity on change.
  const deck = useRef({ on: false, items: [] });
  useScrollFrame(
    (y) => {
      const d = deck.current;
      if (!d.on) return;
      d.items.forEach((it, k) => {
        const next = d.items[k + 1];
        if (!next) return;
        const nextTop = Math.max(next.stick, next.top - y);
        const p =
          Math.round(clamp01((it.stick + it.h - nextTop) / it.h) * 500) / 500;
        if (p === it.p) return;
        it.p = p;
        it.el.style.scale = p ? String(1 - p * 0.06) : "";
        if (it.shade) it.shade.style.opacity = String(p * 0.55);
      });
    },
    () => {
      const list = kitRef.current;
      const d = deck.current;
      const wide = window.matchMedia(
        "(min-width: 1001px) and (min-height: 700px)",
      ).matches;
      const still = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const cards = Array.from(list?.children ?? []);
      d.items.forEach((it) => {
        it.el.style.scale = "";
        if (it.shade) it.shade.style.opacity = "";
      });
      d.on = !!list && wide && !still;
      if (!d.on) {
        d.items = [];
        return;
      }
      // Natural (unstuck) positions: the list's top plus the cards above.
      const gap = parseFloat(getComputedStyle(list).rowGap) || 0;
      let top = list.getBoundingClientRect().top + window.scrollY;
      d.items = cards.map((el) => {
        const item = {
          el,
          shade: el.querySelector(".tool__shade"),
          top,
          h: el.offsetHeight,
          stick: parseFloat(getComputedStyle(el).top) || 0,
          p: -1,
        };
        top += el.offsetHeight + gap;
        return item;
      });
    },
  );

  // Keyframe sweeps pause off screen; the panel timecode only runs on screen.
  const sectionRef = useRef(null);
  usePauseOffscreen(sectionRef);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const start = performance.now();
    const two = (n) => String(Math.floor(n)).padStart(2, "0");
    let raf = 0;
    let last = "";
    const tick = (now) => {
      const s = (now - start) / 1000;
      const text = `00:00:${two(s % 60)}:${two((s % 1) * 24)}`;
      if (text !== last && tcRef.current) {
        tcRef.current.textContent = text;
        last = text;
      }
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      raf = e.isIntersecting ? requestAnimationFrame(tick) : 0;
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      className="section"
      data-section="craft"
      aria-labelledby="craft"
      ref={sectionRef}
    >
      <div className="wrap">
        <SectionHead
          number={number}
          title="Craft"
          id="craft"
          kicker="Everything that goes into a cut, laid out like an effect stack."
        />

        <Reveal className="fxp">
          <div className="fxp__bar label" aria-hidden="true">
            <span className="fxp__tab">
              <Icon name="craft" size={14} />
              <Scramble text="Effect controls" />
            </span>
            <span className="fxp__tc" ref={tcRef}>
              00:00:00:00
            </span>
          </div>
          <div className="fxp__ruler" aria-hidden="true">
            <span />
            <span className="fxp__ticks" />
          </div>
          <h3 className="sr-only">Skills</h3>
          <ul className="fxp__rows">
            {profile.skills.map((s, i) => (
              <li className="fxp__row" style={{ "--i": i }} key={s}>
                <span className="fxp__fx" aria-hidden="true">
                  fx
                </span>
                <span className="fxp__eye" aria-hidden="true">
                  <Icon name="eye" size={14} />
                </span>
                <span className="fxp__name">{s}</span>
                <span className="fxp__lane" aria-hidden="true">
                  <span className="fxp__render" />
                  {lanes[i].slice(1).map((x, k) => (
                    <span
                      key={`s${k}`}
                      className="fxp__seg"
                      style={{ "--x": lanes[i][k], "--w": x - lanes[i][k] }}
                    />
                  ))}
                  {lanes[i].map((x) => (
                    <span
                      key={`k${x}`}
                      className="fxp__key"
                      style={{ "--x": x }}
                    />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="kit">
          <h3 className="label kit__title">
            <span className="kit__no">({number}.1)</span>{" "}
            <Scramble text="Toolkit" />
          </h3>
          <ul className="kit__list" ref={kitRef}>
            {profile.tools.map((t, i) => (
              <Tool name={t} i={i} key={t} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
