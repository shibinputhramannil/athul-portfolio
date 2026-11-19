import { Fragment, useEffect, useRef } from "react";
import { usePauseOffscreen, useScrollFrame } from "../lib/ticker";

/**
 * Two crossing marquee tapes between scenes: one crimson, one outlined.
 * Their speed picks up with scroll velocity, then eases back.
 */
export default function Tapes({ skills }) {
  const ref = useRef(null);
  const words = skills.map((s) => s.split(" & ")[0]);

  usePauseOffscreen(ref);

  // Scroll velocity boosts the marquee speed (playbackRate is compositor-cheap).
  const speed = useRef({ rate: 1, y: 0, t: 0, raf: 0, anims: null });
  useEffect(() => {
    const s = speed.current;
    return () => cancelAnimationFrame(s.raf);
  }, []);
  useScrollFrame((y) => {
    const el = ref.current;
    const s = speed.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const now = performance.now();
    const v = s.t ? Math.abs(y - s.y) / Math.max(1, now - s.t) : 0;
    s.y = y;
    s.t = now;
    if (el.hasAttribute("data-paused") || v < 0.05) return;
    s.anims ??= Array.from(el.querySelectorAll(".tape__track")).flatMap((t) =>
      t.getAnimations ? t.getAnimations() : [],
    );
    s.rate = Math.max(s.rate, 1 + Math.min(v * 6, 7));
    const decay = () => {
      s.rate += (1 - s.rate) * 0.06;
      s.anims.forEach((a) => (a.playbackRate = s.rate));
      s.raf = Math.abs(s.rate - 1) > 0.01 ? requestAnimationFrame(decay) : 0;
    };
    if (!s.raf) s.raf = requestAnimationFrame(decay);
  });

  const run = (star) =>
    [0, 1].map((k) => (
      <span className="tape__run" key={k}>
        {words.map((w) => (
          <Fragment key={w}>
            <span className="tape__word">{w}</span>
            <i className="tape__star">{star}</i>
          </Fragment>
        ))}
      </span>
    ));

  return (
    <div className="tapes" aria-hidden="true" ref={ref}>
      <div className="tape tape--red">
        <div className="tape__track">{run("✦")}</div>
      </div>
      <div className="tape tape--line">
        <div className="tape__track tape__track--rev">{run("◆")}</div>
      </div>
    </div>
  );
}
