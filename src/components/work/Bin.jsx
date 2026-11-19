import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "motion/react";
import Icon from "../Icon";
import { SplitText } from "../Kinetic";
import { labelOf } from "../../lib/data";
import { duration, timecode } from "../../lib/media";
import { useFinePointer, useReducedMotion } from "../../hooks/useInView";

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "short", label: "Under 15s", test: (s) => s != null && s < 15 },
  { id: "mid", label: "15–30s", test: (s) => s != null && s >= 15 && s <= 30 },
  { id: "long", label: "Over 30s", test: (s) => s != null && s > 30 },
];
const SORTS = [
  { id: "seq", label: "Sequence" },
  { id: "long", label: "Longest" },
  { id: "short", label: "Shortest" },
];
const FALLBACK_TONE = "142 210 190";

/**
 * The floating skim preview. It owns its own state, so moving between rows
 * re-renders only this element, never the list.
 */
function SkimFloat({ videos, tones, ref }) {
  const [hovered, setHovered] = useState(null);
  const floatRef = useRef(null);
  const videoRef = useRef(null);
  const headRef = useRef(null);
  const tcRef = useRef(null);
  const seek = useRef({ raf: 0, f: 0 });
  const current = useRef(null);

  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 380, damping: 34, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 380, damping: 34, mass: 0.6 });

  useImperativeHandle(
    ref,
    () => ({
      move(index, clientX, clientY, f) {
        x.set(clientX);
        y.set(clientY);
        floatRef.current?.classList.toggle(
          "is-flip",
          clientX > window.innerWidth - 300,
        );
        if (current.current !== index) {
          current.current = index;
          setHovered(index);
        }
        if (headRef.current)
          headRef.current.style.transform = `scaleX(${f.toFixed(4)})`;
        seek.current.f = f;
        if (seek.current.raf) return;
        seek.current.raf = requestAnimationFrame(() => {
          seek.current.raf = 0;
          const v = videoRef.current;
          if (!v || !v.duration) return;
          const t = seek.current.f * v.duration;
          if (typeof v.fastSeek === "function") v.fastSeek(t);
          else v.currentTime = t;
          if (tcRef.current) tcRef.current.textContent = timecode(t);
        });
      },
      leave() {
        current.current = null;
        setHovered(null);
      },
    }),
    [x, y],
  );

  useEffect(() => () => cancelAnimationFrame(seek.current.raf), []);

  const v = hovered != null ? videos[hovered] : null;
  return (
    <motion.div
      ref={floatRef}
      className={`bin__float${v ? " is-on" : ""}`}
      style={{
        x: sx,
        y: sy,
        "--tone": v ? (tones[v.id] ?? FALLBACK_TONE) : undefined,
      }}
      aria-hidden="true"
    >
      <div className="bin__float-inner">
        {v && (
          <>
            <img src={v.poster} alt="" />
            <video
              key={v.id}
              ref={videoRef}
              src={v.preview}
              muted
              playsInline
              preload="auto"
            />
            <span className="bin__float-hud label">
              <span>
                <span className="wk-dot" /> Skim
              </span>
              <span ref={tcRef}>00:00:00:00</span>
            </span>
            <span className="bin__float-head">
              <span ref={headRef} />
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}

/** The rows. Memoised: hovering never re-renders or re-measures them. */
const BinRows = memo(function BinRows({
  rows,
  tones,
  maxDur,
  onOpen,
  onSkim,
  onLeave,
  reduced,
}) {
  return (
    <ul className="bin__list">
      <AnimatePresence initial={false}>
        {rows.map(({ v, index }) => (
          <motion.li
            key={v.id}
            layout={reduced ? false : "position"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: reduced ? 0 : 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="bin__row"
            style={{ "--tone": tones[v.id] ?? FALLBACK_TONE }}
          >
            <button
              type="button"
              className="bin__btn"
              onClick={() => onOpen(index)}
              onPointerMove={(e) => onSkim(e, index)}
              onPointerLeave={onLeave}
              data-cursor-label="Watch"
            >
              {/* Spoken name as text (not aria-label), so it can't disagree
                  with the number and title drawn on the row. */}
              <span className="sr-only">
                Watch {labelOf(v)} with sound
                {v.durationSec != null && `, ${duration(v.durationSec)}`}
              </span>
              <span className="bin__no" aria-hidden="true">
                {v.number}
              </span>
              <span className="bin__clip" aria-hidden="true">
                <span className="bin__thumb">
                  <img src={v.poster} alt="" loading="lazy" decoding="async" />
                </span>
                <span className="bin__name">{labelOf(v)}</span>
              </span>
              <span className="bin__dur" aria-hidden="true">
                <span className="bin__bar">
                  <i
                    style={{
                      width: `${((v.durationSec ?? 0) / maxDur) * 100}%`,
                    }}
                  />
                </span>
                <span className="label">{duration(v.durationSec) ?? "–"}</span>
              </span>
              <span className="bin__go" aria-hidden="true">
                <Icon name="arrow-right" size={18} />
              </span>
              <span className="bin__skimline" aria-hidden="true" />
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
});

/**
 * The bin: every edit as a row, like a project panel. On a mouse, a preview
 * floats beside the pointer and skims through the clip as you move across
 * the row (the way an editor skims footage). Rows filter by running time.
 */
export default function Bin({ videos, tones, onOpen }) {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("seq");
  const floatApi = useRef(null);
  const skimOn = fine && !reduced;

  const maxDur = useMemo(
    () => Math.max(...videos.map((v) => v.durationSec ?? 0), 1),
    [videos],
  );
  const rows = useMemo(() => {
    const test = FILTERS.find((f) => f.id === filter).test;
    const list = videos
      .map((v, index) => ({ v, index }))
      .filter(({ v }) => test(v.durationSec));
    if (sort === "long")
      list.sort((a, b) => (b.v.durationSec ?? 0) - (a.v.durationSec ?? 0));
    if (sort === "short")
      list.sort((a, b) => (a.v.durationSec ?? 0) - (b.v.durationSec ?? 0));
    return list;
  }, [videos, filter, sort]);
  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [
          f.id,
          videos.filter((v) => f.test(v.durationSec)).length,
        ]),
      ),
    [videos],
  );

  // Stable handlers: the row list never re-renders while skimming.
  const onSkim = useCallback(
    (e, index) => {
      if (!skimOn) return;
      const r = e.currentTarget.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      e.currentTarget.style.setProperty("--skim", f.toFixed(4));
      floatApi.current?.move(index, e.clientX, e.clientY, f);
    },
    [skimOn],
  );
  const onLeave = useCallback(() => floatApi.current?.leave(), []);

  return (
    <div className="bin">
      <div className="bin__head">
        <h3 className="bin__title">
          <SplitText text="Every edit" hover grad="grade" />
          <span className="bin__count label">{rows.length}</span>
        </h3>
        <div className="bin__tools">
          <div
            className="bin__filters"
            role="group"
            aria-label="Filter by running time"
          >
            {FILTERS.map((f) => (
              <button
                type="button"
                key={f.id}
                className="bin__chip"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                disabled={!counts[f.id]}
              >
                {f.label}
                <sup>{counts[f.id]}</sup>
              </button>
            ))}
          </div>
          <div className="bin__sort" role="group" aria-label="Sort">
            {SORTS.map((s) => (
              <button
                type="button"
                key={s.id}
                className="bin__sortbtn label"
                aria-pressed={sort === s.id}
                onClick={() => setSort(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bin__panel">
        <div className="bin__cols label" aria-hidden="true">
          <span>#</span>
          <span>Clip</span>
          <span>Running time</span>
          <span />
        </div>

        <BinRows
          rows={rows}
          tones={tones}
          maxDur={maxDur}
          onOpen={onOpen}
          onSkim={onSkim}
          onLeave={onLeave}
          reduced={reduced}
        />
      </div>

      {skimOn && <SkimFloat videos={videos} tones={tones} ref={floatApi} />}
    </div>
  );
}
