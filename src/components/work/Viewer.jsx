import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Icon from "../Icon";
import { labelOf } from "../../lib/data";
import { duration, timecode, useTone } from "../../lib/media";
import { lockScroll } from "../../lib/scroll";
import { useReducedMotion } from "../../hooks/useInView";

const focusables =
  'button:not([disabled]), [href], input:not([disabled]), video, [tabindex]:not([tabindex="-1"])';

function Screen({ video, onPrev, onNext, hasPrev, hasNext }) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const rangeRef = useRef(null);
  const tcRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(false);

  // Start with sound: the viewer only opens from a click or key press.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    v.play().catch(() => setBlocked(true));
  }, [video.id]);

  // Smooth progress and timecode while it plays.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = ref.current;
      if (v && v.duration && rangeRef.current) {
        rangeRef.current.value = String(v.currentTime);
        rangeRef.current.max = String(v.duration);
        rangeRef.current.style.setProperty(
          "--p",
          `${(v.currentTime / v.duration) * 100}%`,
        );
        if (tcRef.current) tcRef.current.textContent = timecode(v.currentTime);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [video.id]);

  const toggle = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (v.paused)
      v.play()
        .then(() => setBlocked(false))
        .catch(() => {});
    else v.pause();
  }, []);
  const seek = useCallback((d) => {
    const v = ref.current;
    if (v)
      v.currentTime = Math.min(v.duration || 0, Math.max(0, v.currentTime + d));
  }, []);
  const fullscreen = () => {
    const v = ref.current;
    const el = wrapRef.current;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el?.requestFullscreen) el.requestFullscreen().catch(() => {});
    else v?.webkitEnterFullscreen?.();
  };

  // Editor shortcuts: K / space play-pause, J / L and arrows shuttle, M mute, F full screen.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches?.("input[type=range]") && e.key.startsWith("Arrow"))
        return;
      const k = e.key.toLowerCase();
      if (k === " " || k === "k") {
        if (e.target.tagName === "BUTTON" && k === " ") return;
        e.preventDefault();
        toggle();
      } else if (k === "j" || k === "arrowleft") {
        e.preventDefault();
        seek(-5);
      } else if (k === "l" || k === "arrowright") {
        e.preventDefault();
        seek(5);
      } else if (k === "m") setMuted((m) => !m);
      else if (k === "f") fullscreen();
      else if (k === "n" && hasNext) onNext();
      else if (k === "p" && hasPrev) onPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, seek, onNext, onPrev, hasNext, hasPrev]);

  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  return (
    <div className={`vw-screen${playing ? " is-playing" : ""}`} ref={wrapRef}>
      <video
        key={video.id}
        ref={ref}
        className="vw-video"
        src={video.full}
        poster={video.poster}
        playsInline
        preload="auto"
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        aria-label={`${labelOf(video)}. Press K or space to play or pause.`}
      />
      {(!playing || blocked) && (
        <button
          type="button"
          className="vw-bigplay"
          onClick={toggle}
          aria-label="Play"
        >
          <Icon name="play" size={34} />
        </button>
      )}
      <div className="vw-controls">
        <input
          ref={rangeRef}
          className="vw-range"
          type="range"
          min="0"
          max={video.durationSec ?? 1}
          step="0.01"
          defaultValue="0"
          aria-label="Seek"
          onInput={(e) => {
            if (ref.current)
              ref.current.currentTime = Number(e.currentTarget.value);
          }}
        />
        <div className="vw-bar">
          <button
            type="button"
            className="vw-ctl"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Previous edit (P)"
          >
            <Icon name="rewind" size={16} />
          </button>
          <button
            type="button"
            className="vw-ctl vw-ctl--main"
            onClick={toggle}
            aria-label={playing ? "Pause (K)" : "Play (K)"}
          >
            <Icon name={playing ? "pause" : "play"} size={18} />
          </button>
          <button
            type="button"
            className="vw-ctl"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next edit (N)"
          >
            <Icon name="forward" size={16} />
          </button>
          <span className="label vw-tc" aria-hidden="true">
            <span ref={tcRef}>00:00:00:00</span>
            <span className="vw-tc__total">
              <span className="vw-tc__sep">/</span>
              {timecode(video.durationSec ?? 0)}
            </span>
          </span>
          <span className="vw-bar__gap" />
          <button
            type="button"
            className="vw-ctl"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute (M)" : "Mute (M)"}
            aria-pressed={muted}
          >
            <Icon name={muted ? "volume-off" : "volume"} size={16} />
          </button>
          <button
            type="button"
            className="vw-ctl"
            onClick={fullscreen}
            aria-label="Full screen (F)"
          >
            <Icon name="expand" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Full-screen viewer for one edit, with sound, shortcuts and up-next. */
export default function Viewer({ videos, index, onIndex, onClose }) {
  const open = index != null;
  const video = open ? videos[index] : null;
  const next = open && index < videos.length - 1 ? videos[index + 1] : null;
  const tone = useTone(video?.poster);
  const reduced = useReducedMotion();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const returnTo = useRef(null);

  const goPrev = useCallback(
    () => index > 0 && onIndex(index - 1),
    [index, onIndex],
  );
  const goNext = useCallback(
    () => index < videos.length - 1 && onIndex(index + 1),
    [index, videos.length, onIndex],
  );

  // Lock the page, move focus in, and give it back on close.
  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement;
    lockScroll(true);
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      lockScroll(false);
      returnTo.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  // Esc closes; Tab stays inside.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (document.fullscreenElement) document.exitFullscreen();
        else onClose();
      } else if (e.key === "Tab" && dialogRef.current) {
        const list = Array.from(dialogRef.current.querySelectorAll(focusables));
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const ease = [0.16, 1, 0.3, 1];

  return (
    <AnimatePresence>
      {open && video && (
        <motion.div
          className="vw"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="vw-title"
          style={{ "--tone": tone }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.35 }}
        >
          <div className="vw-backdrop" onClick={onClose} aria-hidden="true">
            <AnimatePresence mode="popLayout">
              <motion.img
                key={video.id}
                src={video.poster}
                alt=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.8, ease }}
              />
            </AnimatePresence>
          </div>

          <button
            type="button"
            className="vw-close"
            ref={closeRef}
            onClick={onClose}
          >
            <Icon name="close" size={16} />
            <span>Close</span>
          </button>

          <motion.div
            className="vw-panel"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 260, damping: 30 }
            }
          >
            <Screen
              video={video}
              onPrev={goPrev}
              onNext={goNext}
              hasPrev={index > 0}
              hasNext={!!next}
            />

            <aside className="vw-info">
              <p className="label vw-info__k">
                <span className="rec" /> Now viewing · {video.number} /{" "}
                {String(videos.length).padStart(2, "0")}
              </p>
              <h2 className="vw-info__title" id="vw-title">
                {labelOf(video)}
              </h2>
              <dl className="vw-specs">
                <div>
                  <dt className="label">Running time</dt>
                  <dd>{duration(video.durationSec) ?? "–"}</dd>
                </div>
                <div>
                  <dt className="label">Format</dt>
                  <dd>9:16 vertical</dd>
                </div>
                {video.client && (
                  <div>
                    <dt className="label">Client</dt>
                    <dd>{video.client}</dd>
                  </div>
                )}
                {video.role && (
                  <div>
                    <dt className="label">Role</dt>
                    <dd>{video.role}</dd>
                  </div>
                )}
                {video.year && (
                  <div>
                    <dt className="label">Year</dt>
                    <dd>{video.year}</dd>
                  </div>
                )}
              </dl>

              {next && (
                <button type="button" className="vw-next" onClick={goNext}>
                  <span className="vw-next__thumb">
                    <img src={next.poster} alt="" />
                  </span>
                  <span className="vw-next__text">
                    <span className="label">Up next</span>
                    <span className="vw-next__title">{labelOf(next)}</span>
                    <span className="label">{duration(next.durationSec)}</span>
                  </span>
                  <Icon name="arrow-right" size={18} />
                </button>
              )}

              <p className="label vw-keys" aria-hidden="true">
                <kbd>K</kbd> play <kbd>J</kbd>
                <kbd>L</kbd> shuttle <kbd>N</kbd>
                <kbd>P</kbd> next / prev <kbd>Esc</kbd> close
              </p>
            </aside>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
