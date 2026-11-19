import { useEffect, useMemo, useRef } from "react";
import SectionHead from "./SectionHead";
import Icon from "./Icon";
import Reveal from "./Reveal";
import { toolMeta } from "../lib/icons";
import { usePauseOffscreen } from "../lib/ticker";
import { Scramble } from "./Kinetic";
import ColourWheels from "./ColourWheels";

// General product categories, not claims about specific projects.
const toolUse = {
  premiere: "Editing & assembly",
  aftereffects: "Motion graphics & VFX",
  resolve: "Colour grading & finishing",
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

function Tool({ name, i }) {
  const meta = toolMeta[name];
  if (!meta) return null;
  return (
    <Reveal
      as="li"
      className="tool"
      i={i}
      data-tilt=""
      style={{ "--glow": toolGlow[meta.brand] }}
    >
      <span className="tool__glow" aria-hidden="true" />
      <span className="tool__icon">
        <Icon brand={meta.brand} size={44} />
      </span>
      <span className="tool__name">{meta.name}</span>
      <span className="label tool__use">{toolUse[meta.brand]}</span>
      <span className="tool__no label" aria-hidden="true">
        0{i + 1}
      </span>
    </Reveal>
  );
}

export default function Craft({ number, profile }) {
  const lanes = useMemo(
    () => buildLanes(profile.skills.length),
    [profile.skills.length],
  );
  const tcRef = useRef(null);
  const kitRef = useRef(null);

  // Tool tiles tilt toward the pointer.
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const tiles = kitRef.current?.querySelectorAll(".tool") ?? [];
    if (!fine.matches) return;
    const offs = [];
    tiles.forEach((el) => {
      const move = (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty(
          "--tx",
          (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3),
        );
        el.style.setProperty(
          "--ty",
          (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3),
        );
      };
      const leave = () => {
        el.style.setProperty("--tx", "0");
        el.style.setProperty("--ty", "0");
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      offs.push(() => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      });
    });
    return () => offs.forEach((off) => off());
  }, [profile.tools]);

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

        <ColourWheels number={number} />
      </div>
    </section>
  );
}
