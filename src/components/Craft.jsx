import { Component, useEffect, useMemo, useRef } from "react";
import SectionHead from "./SectionHead";
import Icon from "./Icon";
import Reveal from "./Reveal";
import { toolMeta } from "../lib/icons";
import { usePauseOffscreen, useScrollFrame } from "../lib/ticker";
import { Scramble } from "./Kinetic";
import AIPlayer from "./AIPlayer";
import { programs } from "./toolPrograms";

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

/** If a player ever fails, the card keeps its tool info instead of the
 * error taking the whole page down. */
class Safe extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * One tool as a big card: a 50 s explainer of five of its important
 * topics, played like a course video, with the tool and its topic
 * playlist beside it.
 */
function Tool({ name, i }) {
  const meta = toolMeta[name];
  const prog = meta && programs[meta.brand];
  if (!prog) return null;
  const head = (
    <>
      <div className="tool__head">
        <span className="tool__icon">
          <Icon brand={meta.brand} size={30} />
        </span>
        <span className="tool__verb">{prog.verb}</span>
        <span className="tool__no label" aria-hidden="true">
          0{i + 1}
        </span>
      </div>
      <span className="tool__name">{meta.name}</span>
      <span className="label tool__use">{prog.use}</span>
      <p className="tool__desc">{prog.desc}</p>
    </>
  );
  return (
    <Reveal
      as="li"
      className="tool"
      i={i}
      style={{ "--glow": toolGlow[meta.brand] }}
    >
      <span className="tool__glow" aria-hidden="true" />
      <span className="tool__edge" aria-hidden="true" />
      <Safe fallback={<div className="tool__info">{head}</div>}>
        <AIPlayer product={meta.name} head={head} topics={prog.topics} />
      </Safe>
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

  // Cards lean gently toward the pointer, with a spotlight following it
  // (fine pointers only; written once a frame, as CSS variables).
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cards = kitRef.current?.querySelectorAll(":scope > .tool") ?? [];
    if (!fine.matches || still.matches) return;
    const offs = [];
    cards.forEach((el) => {
      let raf = 0;
      const move = (e) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
          el.style.setProperty("--tx", (x * 2 - 1).toFixed(3));
          el.style.setProperty("--ty", (y * 2 - 1).toFixed(3));
          el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
          el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
        });
      };
      const leave = () => {
        cancelAnimationFrame(raf);
        el.style.setProperty("--tx", "0");
        el.style.setProperty("--ty", "0");
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      offs.push(() => {
        cancelAnimationFrame(raf);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      });
    });
    return () => offs.forEach((off) => off());
  }, [profile.tools]);

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
        // A card covered by the next one (all but its top edge) stops playing.
        it.el.toggleAttribute("data-paused", p >= 0.9);
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
        it.el.removeAttribute("data-paused");
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
