import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import Icon from "../Icon";
import { SplitText } from "../Kinetic";
import { labelOf } from "../../lib/data";
import { duration, timecode } from "../../lib/media";
import { useReducedMotion } from "../../hooks/useInView";
import { usePauseOffscreen } from "../../lib/ticker";

const mod = (a, n) => ((a % n) + n) % n;

/**
 * The reel: every edit stands on a turning cylinder. The edit facing the
 * viewer plays, its light spills onto the studio floor, and the reel moves
 * on by itself when the clip ends.
 *
 * Playback is built for instant response: the edits either side of the
 * front one keep their own video loaded and buffered, so whichever edit
 * turns into view starts at once. The front edit is promoted as soon as the
 * spin is nearly finished, not after it stops.
 */
export default function ReelRing({ videos, tones, onOpen, suspended }) {
  const n = videos.length;
  const step = 360 / n;
  const reduced = useReducedMotion();

  const stageRef = useRef(null);
  const ringRef = useRef(null);
  const cardsRef = useRef([]);
  const dimRefs = useRef([]);
  const dimVals = useRef([]);
  const videoRefs = useRef([]);
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const progRef = useRef(null);
  const tcRef = useRef(null);
  const stripRef = useRef(null);

  const rot = useRef(0);
  const target = useRef(0);
  const raf = useRef(0);
  const radius = useRef(0);
  const pitch = useRef(300); // px of drag per step
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const hovering = useRef(false);
  const viaKeys = useRef(false);
  const activeRef = useRef(0);
  const settledRef = useRef(0);

  const [active, setActive] = useState(0);
  const [settled, setSettled] = useState(0);
  const [running, setRunning] = useState(true);
  const [inView, setInView] = useState(false);
  // Becomes true (once) when the reel is within a screen of the viewport.
  // Until then no poster or video is requested, so the reel never competes
  // with the first screen (portrait, fonts) for bandwidth.
  const [near, setNear] = useState(false);
  const [playing, setPlaying] = useState({});

  const tone = (i) => tones[videos[i]?.id] ?? "142 210 190";
  const current = videos[active];

  // Edits that keep a video element: the front one and its neighbours.
  const inWindow = (i) => {
    if (n < 3) return i === settled;
    const d = Math.min(mod(i - settled, n), mod(settled - i, n));
    return d <= 1;
  };

  /* ---------- Geometry ---------- */
  const place = useCallback(() => {
    const ring = ringRef.current;
    if (!ring) return;
    ring.style.transform = `translateZ(${-radius.current}px) rotateY(${-rot.current}deg)`;
    dimRefs.current.forEach((el, i) => {
      if (!el) return;
      const rel = mod(i * step - rot.current + 180, 360) - 180;
      const o =
        Math.round(Math.min(Math.abs(rel) / 90, 1.3) * 0.62 * 100) / 100;
      if (dimVals.current[i] !== o) {
        dimVals.current[i] = o;
        el.style.opacity = String(o);
      }
    });
  }, [step]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const card = cardsRef.current[0];
      const w = card?.offsetWidth || 280;
      const gap = w * 0.12;
      pitch.current = w + gap;
      radius.current = n >= 3 ? (w + gap) / (2 * Math.tan(Math.PI / n)) : 0;
      stage.style.setProperty("--R", `${radius.current.toFixed(1)}px`);
      place();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [n, place]);

  /* ---------- Motion loop ---------- */
  const frame = useCallback(() => {
    raf.current = 0;
    const k = reduced ? 1 : drag.current?.moved ? 0.45 : 0.12;
    rot.current += (target.current - rot.current) * k;
    if (Math.abs(target.current - rot.current) < 0.05)
      rot.current = target.current;
    place();
    const idx = mod(Math.round(rot.current / step), n);
    if (idx !== activeRef.current) {
      activeRef.current = idx;
      setActive(idx);
    }
    // Promote the front edit as soon as the spin is nearly done.
    const closeEnough =
      !drag.current && Math.abs(target.current - rot.current) < step * 0.2;
    if (closeEnough && idx !== settledRef.current) {
      settledRef.current = idx;
      setSettled(idx);
    }
    if (rot.current !== target.current || drag.current)
      raf.current = requestAnimationFrame(frame);
  }, [n, step, place, reduced]);

  const kick = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(frame);
  }, [frame]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const goTo = useCallback(
    (i) => {
      target.current += mod(i * step - target.current + 180, 360) - 180;
      kick();
    },
    [step, kick],
  );
  const nudge = useCallback(
    (d) => goTo(mod(Math.round(target.current / step) + d, n)),
    [goTo, step, n],
  );

  usePauseOffscreen(rootRef);

  /* ---------- Visibility: only run while the reel is on screen ---------- */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setNear(true);
        io.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  const live = inView && running && !suspended && !reduced;

  // Drive every loaded video: the front one plays to its end (then the reel
  // moves on); neighbours wait buffered on their first frame, so whichever
  // one turns to the front starts instantly without decoding three at once.
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (!live) {
        v.pause();
        return;
      }
      if (i === settled) {
        v.loop = false;
        if (v.duration && v.currentTime > v.duration * 0.6) v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [live, settled]);

  /* ---------- Progress, timecode and ambient light ---------- */
  // The ambient glow is drawn into a tiny canvas with the blur applied inside
  // the canvas, then simply scaled up: no full-screen CSS blur to recompute.
  useEffect(() => {
    const v = videoRefs.current[settled];
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (ctx && typeof ctx.filter === "string")
      ctx.filter = "blur(5px) saturate(1.8)";
    let raf2 = 0;
    let lastDraw = 0;
    let lastTc = "";
    const draw = (src) => {
      if (!ctx || !src) return;
      try {
        ctx.drawImage(src, -8, -8, canvas.width + 16, canvas.height + 16);
      } catch {
        /* frame not ready */
      }
    };
    const img = new Image();
    img.decoding = "async";
    img.onload = () => draw(img);
    img.src = videos[settled]?.poster ?? "";
    if (!v) return;
    const tick = (now) => {
      raf2 = 0;
      if (v.duration) {
        if (progRef.current)
          progRef.current.style.transform = `scaleX(${(v.currentTime / v.duration).toFixed(4)})`;
        const tc = timecode(v.currentTime);
        if (tc !== lastTc && tcRef.current) {
          tcRef.current.textContent = tc;
          lastTc = tc;
        }
      }
      if (now - lastDraw > 110) {
        lastDraw = now;
        draw(v);
      }
      if (!v.paused && !v.ended) raf2 = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf2) raf2 = requestAnimationFrame(tick);
    };
    v.addEventListener("playing", start);
    if (!v.paused) start();
    return () => {
      v.removeEventListener("playing", start);
      cancelAnimationFrame(raf2);
    };
  }, [settled, videos]);

  /* ---------- Keyboard focus follows the front edit ---------- */
  useEffect(() => {
    if (!viaKeys.current) return;
    viaKeys.current = false;
    cardsRef.current[active]?.focus({ preventScroll: true });
  }, [active]);

  // Keep the active filmstrip frame in view (horizontal only; never moves the page).
  useEffect(() => {
    const strip = stripRef.current;
    const item = strip?.children[active];
    if (!strip || !item) return;
    const left = item.offsetLeft - strip.clientWidth / 2 + item.offsetWidth / 2;
    strip.scrollTo({ left, behavior: reduced ? "auto" : "smooth" });
  }, [active, reduced]);

  /* ---------- Input ---------- */
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    drag.current = {
      x: e.clientX,
      start: target.current,
      moved: false,
      lastX: e.clientX,
      t: performance.now(),
      v: 0,
      id: e.pointerId,
    };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(dx) < 8) return;
      d.moved = true;
      stageRef.current.setPointerCapture(d.id);
      stageRef.current.classList.add("is-dragging");
    }
    const now = performance.now();
    d.v = (e.clientX - d.lastX) / Math.max(1, now - d.t);
    d.lastX = e.clientX;
    d.t = now;
    target.current = d.start - (dx / pitch.current) * step;
    kick();
  };
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    suppressClick.current = true;
    requestAnimationFrame(() => (suppressClick.current = false));
    stageRef.current.classList.remove("is-dragging");
    const fling = Math.max(-3, Math.min(3, (-d.v * 260) / pitch.current));
    target.current = Math.round(target.current / step + fling) * step;
    kick();
  };

  // Trackpad: a sideways flick turns the reel.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let snap = 0;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      target.current += (e.deltaX / pitch.current) * step * 0.8;
      kick();
      clearTimeout(snap);
      snap = window.setTimeout(() => {
        target.current = Math.round(target.current / step) * step;
        kick();
      }, 120);
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      stage.removeEventListener("wheel", onWheel);
      clearTimeout(snap);
    };
  }, [kick, step]);

  const onKeyDown = (e) => {
    const keys = { ArrowRight: 1, ArrowLeft: -1 };
    if (e.key in keys) {
      e.preventDefault();
      viaKeys.current = true;
      nudge(keys[e.key]);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      viaKeys.current = true;
      goTo(e.key === "Home" ? 0 : n - 1);
    }
  };

  const onCardClick = (i) => {
    if (suppressClick.current) return;
    if (i === activeRef.current && i === settledRef.current) onOpen(i);
    else goTo(i);
  };

  const onEnded = (i) => {
    if (i !== settledRef.current) return;
    const v = videoRefs.current[i];
    if (live && !hovering.current && n > 1) nudge(1);
    else if (v) {
      v.currentTime = 0;
      if (live) v.play().catch(() => {});
    }
  };

  const setPlay = (i, on) =>
    setPlaying((p) => (p[i] === on ? p : { ...p, [i]: on }));

  const runtimeOf = (v) => duration(v.durationSec) ?? "–";

  return (
    <div className="wk-reel" ref={rootRef} style={{ "--tone": tone(active) }}>
      <div
        className="wk-stage"
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Edits reel"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        style={{ "--step": `${step}deg` }}
        data-cursor-label="Drag"
      >
        <canvas
          className="wk-ambient"
          ref={canvasRef}
          width="40"
          height="40"
          aria-hidden="true"
        />
        <div className="wk-floor" aria-hidden="true" />
        <div className="wk-bignum" aria-hidden="true">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={current?.id}
              initial={{ y: "40%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-40%", opacity: 0 }}
              transition={{
                duration: reduced ? 0 : 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {current?.number}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="wk-ring" ref={ringRef}>
          {videos.map((v, i) => {
            const isFront = i === active;
            const loaded = near && inWindow(i) && !reduced;
            const isLive = loaded && playing[i];
            return (
              <button
                type="button"
                key={v.id}
                ref={(el) => (cardsRef.current[i] = el)}
                className={`wk-card${isFront ? " is-front" : ""}${isLive ? " is-live" : ""}`}
                style={{ "--i": i, "--tone": tone(i) }}
                tabIndex={isFront ? 0 : -1}
                onClick={() => onCardClick(i)}
                onPointerEnter={() => isFront && (hovering.current = true)}
                onPointerLeave={() => (hovering.current = false)}
                data-cursor-label={isFront ? "Play" : "Select"}
              >
                {/* The name comes from this text, not aria-label, so it never
                    contradicts the runtime and number drawn on the card. */}
                <span className="sr-only">
                  {isFront
                    ? `${labelOf(v)}, ${runtimeOf(v)}. Watch with sound`
                    : `Show ${labelOf(v)}`}
                </span>
                <span className="wk-card__border" aria-hidden="true">
                  {isFront && <span className="wk-card__spin" />}
                </span>
                <span
                  className="wk-card__dim"
                  aria-hidden="true"
                  ref={(el) => (dimRefs.current[i] = el)}
                />
                <span className="wk-card__frame">
                  <img
                    className="wk-card__poster"
                    src={near ? v.poster : undefined}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                  />
                  {loaded && (
                    <video
                      ref={(el) => (videoRefs.current[i] = el)}
                      className="wk-card__video"
                      src={v.preview}
                      poster={v.poster}
                      muted
                      playsInline
                      preload="auto"
                      disablePictureInPicture
                      aria-hidden="true"
                      tabIndex={-1}
                      onPlaying={() => setPlay(i, true)}
                      onPause={() => setPlay(i, false)}
                      onEnded={() => onEnded(i)}
                    />
                  )}
                  <span className="wk-card__shade" aria-hidden="true" />
                  <span className="wk-card__hud label" aria-hidden="true">
                    <span className="wk-pill">
                      {isLive && isFront && <span className="wk-dot" />}
                      {runtimeOf(v)}
                    </span>
                  </span>
                  <span className="wk-card__foot" aria-hidden="true">
                    <span className="wk-card__no">{v.number}</span>
                    {isFront && (
                      <span className="wk-card__play">
                        <Icon name="play" size={18} />
                      </span>
                    )}
                  </span>
                  {isFront && (
                    <span className="wk-card__progress" aria-hidden="true">
                      <span ref={i === settled ? progRef : undefined} />
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="wrap">
        <div className="wk-controls">
          <div className="wk-now">
            <SplitText
              key={current?.id}
              as="p"
              className="wk-now__title"
              text={current ? labelOf(current) : ""}
              stagger={30}
            />
            <span className="label wk-now__tc">
              <span className="rec" />
              <span ref={tcRef}>00:00:00:00</span>
              <span className="wk-now__of">
                {current?.number} / {String(n).padStart(2, "0")}
              </span>
            </span>
          </div>
          <div className="wk-buttons">
            <button
              type="button"
              className="wk-btn"
              onClick={() => nudge(-1)}
              aria-label="Previous edit"
            >
              <Icon name="chevron-left" size={20} />
            </button>
            <button
              type="button"
              className="wk-btn wk-btn--play"
              onClick={() => setRunning((r) => !r)}
              aria-label={running ? "Pause the reel" : "Play the reel"}
              aria-pressed={!running}
              disabled={reduced}
            >
              <Icon name={running && !reduced ? "pause" : "play"} size={18} />
            </button>
            <button
              type="button"
              className="wk-btn"
              onClick={() => nudge(1)}
              aria-label="Next edit"
            >
              <Icon name="chevron-right" size={20} />
            </button>
            <button
              type="button"
              className="wk-btn wk-btn--sound"
              onClick={() => onOpen(active)}
              aria-label="Watch with sound"
              title="Watch with sound"
              data-magnet=""
            >
              <Icon name="volume" size={22} />
            </button>
          </div>
        </div>
      </div>

      <div className="wk-strip-wrap">
        <ol className="wk-strip" ref={stripRef} aria-label="All edits">
          {videos.map((v, i) => (
            <li key={v.id}>
              <button
                type="button"
                className="wk-strip__item"
                style={{ "--tone": tone(i) }}
                aria-current={i === active ? "true" : undefined}
                onClick={() => goTo(i)}
              >
                <span className="sr-only">Show {labelOf(v)}</span>
                <img
                  src={near ? v.poster : undefined}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span className="label" aria-hidden="true">
                  {v.number}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <p className="sr-only" aria-live="polite">
        {current ? `${labelOf(current)}, ${active + 1} of ${n}` : ""}
      </p>
    </div>
  );
}
