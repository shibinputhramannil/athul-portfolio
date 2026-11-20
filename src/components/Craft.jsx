import { Component, useEffect, useMemo, useRef } from "react";
import SectionHead from "./SectionHead";
import Icon from "./Icon";
import Reveal from "./Reveal";
import { toolMeta } from "../lib/icons";
import { docTop, usePauseOffscreen, useScrollFrame } from "../lib/ticker";
import { scrollToY } from "../lib/scroll";
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

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

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

  // Pinned slider (wide screens with room for a whole card): the toolkit
  // pins and scrolling slides the cards across one at a time. Each card
  // holds still for a beat, then the next glides in with a slight 3D turn
  // while the one leaving eases back and dims; only the card in front
  // plays. Geometry is cached on resize; scrolling only writes transforms.
  // Elsewhere the cards stay stacked and focus in as they arrive (CSS).
  const stageRef = useRef(null);
  const railRef = useRef(null);
  const pin = useRef({ on: false, items: [], x: -1, active: -1 });
  const goTo = (k) => {
    const s = pin.current;
    if (s.on) scrollToY(s.start + k * s.step + 1);
  };
  useScrollFrame(
    (y) => {
      const s = pin.current;
      if (!s.on) return;
      const n = s.items.length;
      const raw = clamp((y - s.start) / s.step, 0, n - 1);
      const seg = Math.min(n - 2, Math.floor(raw));
      // Dwell: hold the first and last fifth of each step, ease between.
      const t = clamp((raw - seg - 0.2) / 0.6, 0, 1);
      const x = Math.round((seg + t * t * (3 - 2 * t)) * 1000) / 1000;
      if (x === s.x) return;
      s.x = x;
      // With scroll-driven CSS (s.css) the visuals run on the compositor;
      // otherwise they are written here.
      if (!s.css) {
        s.list.style.transform = `translate3d(${(-x * s.shift).toFixed(1)}px, 0, 0)`;
        s.items.forEach((it, k) => {
          const d = clamp(k - x, -1, 1);
          const a = Math.abs(d);
          it.el.style.scale = a ? String(1 - a * 0.08) : "";
          it.el.style.rotate = a ? `y ${(-d * 9).toFixed(2)}deg` : "";
          if (it.shade) it.shade.style.opacity = String(a * 0.6);
        });
        if (s.fill)
          s.fill.style.transform = `scaleX(${(x / (n - 1)).toFixed(4)})`;
      }
      const active = Math.round(x);
      if (active !== s.active) {
        s.active = active;
        // Only the card in front plays.
        s.items.forEach((it, k) =>
          it.el.toggleAttribute("data-paused", k !== active),
        );
        s.tabs.forEach((tab, k) => {
          tab.classList.toggle("is-on", k === active);
          if (k === active) tab.setAttribute("aria-current", "true");
          else tab.removeAttribute("aria-current");
        });
        if (s.count) s.count.textContent = `0${active + 1}`;
      }
    },
    () => {
      const s = pin.current;
      const stage = stageRef.current;
      const list = kitRef.current;
      const kit = stage?.parentElement;
      if (!stage || !list || !kit) return;
      const cards = Array.from(list.children);
      const reset = () => {
        list.style.transform = "";
        cards.forEach((el) => {
          el.style.scale = "";
          el.style.rotate = "";
          el.removeAttribute("data-paused");
          const shade = el.querySelector(".tool__shade");
          if (shade) shade.style.opacity = "";
        });
      };
      const wide = window.matchMedia("(min-width: 1001px)").matches;
      const still = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      // Phones and reduced motion never pin: leave without reading layout
      // (this runs on every resize while the page loads).
      if (!wide || still) {
        if (s.on || kit.classList.contains("kit--pin")) {
          reset();
          kit.classList.remove("kit--pin", "kit--sda");
          stage.style.height = "";
          stage.style.removeProperty("--pin-h");
        }
        s.on = false;
        return;
      }
      reset();
      const header =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--header-h",
          ),
        ) || 60;
      const avail = window.innerHeight - header;
      const cardH = Math.max(0, ...cards.map((el) => el.offsetHeight));
      // Only pin when a whole card (plus the tab rail) fits on screen.
      const on = cards.length > 1 && cardH + 120 <= avail;
      kit.classList.toggle("kit--pin", on);
      s.on = on;
      s.css =
        on &&
        cards.length === 3 &&
        !!window.CSS?.supports?.("animation-timeline: view()");
      kit.classList.toggle("kit--sda", s.css);
      s.x = -1;
      s.active = -1;
      if (!on) {
        stage.style.height = "";
        stage.style.removeProperty("--pin-h");
        return;
      }
      const step = Math.round(avail * 0.85);
      stage.style.setProperty("--pin-h", `${avail}px`);
      stage.style.height = `${avail + step * (cards.length - 1)}px`;
      s.start = docTop(stage) - header;
      s.step = step;
      s.shift =
        cards[0].offsetWidth +
        (parseFloat(getComputedStyle(list).columnGap) || 0);
      s.list = list;
      s.items = cards.map((el) => ({
        el,
        shade: el.querySelector(".tool__shade"),
      }));
      const rail = railRef.current;
      s.tabs = Array.from(rail?.querySelectorAll(".kit__tab") ?? []);
      s.fill = rail?.querySelector(".kit__progress i");
      s.count = rail?.querySelector(".kit__count b");
    },
  );
  // Keyboard focus moving into a card that is off to the side brings it in.
  const onFocusIn = (e) => {
    const s = pin.current;
    if (!s.on) return;
    const k = s.items.findIndex((it) => it.el.contains(e.target));
    if (k >= 0 && k !== s.active) goTo(k);
  };

  // Keyframe sweeps pause off screen; the panel timecode only runs on screen.
  const sectionRef = useRef(null);
  usePauseOffscreen(sectionRef);
  // The skills panel also pauses on its own once scrolled past, while the
  // section (and its toolkit) is still on screen.
  useEffect(() => {
    const el = sectionRef.current?.querySelector(".fxp");
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([e]) => el.toggleAttribute("data-paused", !e.isIntersecting),
      { rootMargin: "100px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
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
          <div className="kit__stage" ref={stageRef}>
            <div className="kit__pin">
              <div className="kit__rail" ref={railRef}>
                {profile.tools.map((t, i) => {
                  const meta = toolMeta[t];
                  if (!meta) return null;
                  return (
                    <button
                      type="button"
                      className={`kit__tab${i === 0 ? " is-on" : ""}`}
                      style={{ "--glow": toolGlow[meta.brand] }}
                      onClick={() => goTo(i)}
                      key={t}
                    >
                      <Icon brand={meta.brand} size={16} />
                      {meta.name}
                    </button>
                  );
                })}
                <span className="kit__progress" aria-hidden="true">
                  <i />
                </span>
                <span className="kit__count" aria-hidden="true">
                  <b>01</b> / 0{profile.tools.length}
                </span>
              </div>
              <ul className="kit__list" ref={kitRef} onFocus={onFocusIn}>
                {profile.tools.map((t, i) => (
                  <Tool name={t} i={i} key={t} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
