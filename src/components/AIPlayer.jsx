import { useRef, useState } from "react";
import Icon from "./Icon";

const LOOP_MS = 10_000;
// Where each chapter starts in the shared 10 s loop (see Toolkit.css).
const CHAPTER_AT = [0.138, 0.296, 0.49];

/**
 * Plays a toolkit demo like an AI product video: a title card that wipes
 * into the scene (and covers each loop's reset), narrated captions that
 * appear word by word, a result badge, and a real player bar: play/pause,
 * a scrubber with chapter markers you can click, and a running clock.
 *
 * Everything runs on the card's CSS animations; seeking just moves each
 * loop-length animation in the card (demo, captions, steps) to the same
 * point, so the step list beside the demo stays in sync.
 */
export default function AIPlayer({
  Demo,
  n,
  feature,
  product,
  captions,
  chapters,
  result,
}) {
  const ref = useRef(null);
  const [paused, setPaused] = useState(false);

  const card = () => ref.current?.closest(".tool");
  const seek = (fraction) => {
    card()
      ?.getAnimations({ subtree: true })
      .forEach((a) => {
        const t = a.effect?.getTiming?.();
        if (!t || t.duration !== LOOP_MS) return;
        a.currentTime = fraction * LOOP_MS + (Number(t.delay) || 0);
      });
  };
  const toggle = () => {
    const next = !paused;
    card()?.toggleAttribute("data-hold", next);
    setPaused(next);
  };
  const onScrub = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    seek(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
  };

  return (
    <div className="aip" ref={ref}>
      <div className="aip__video" aria-hidden="true">
        <Demo />

        {/* Title card: opens each loop and hides its reset. */}
        <div className="aip__intro">
          <span className="aip__chip">
            <span className="aip__dot" />
            AI feature {String(n).padStart(2, "0")}
          </span>
          <span className="aip__title">{feature}</span>
          <span className="aip__product">{product}</span>
        </div>

        {/* Result: pops when the demo lands. */}
        <span className="aip__result">
          <Icon name="check" size={12} />
          {result}
          <i className="aip__spark aip__spark--1" />
          <i className="aip__spark aip__spark--2" />
          <i className="aip__spark aip__spark--3" />
          <i className="aip__spark aip__spark--4" />
        </span>

        {/* Narration, one line per chapter, word by word. */}
        <p className="aip__captions">
          {captions.map((line, c) => (
            <span className={`aip__cap aip__cap--${c + 1}`} key={line}>
              {line.split(" ").map((w, k) => (
                <span className="aip__w" style={{ "--k": k }} key={k}>
                  {w}{" "}
                </span>
              ))}
            </span>
          ))}
        </p>
      </div>

      <div className="aip__bar">
        <button
          type="button"
          className="aip__play"
          onClick={toggle}
          aria-label={
            paused ? `Play the ${feature} demo` : `Pause the ${feature} demo`
          }
        >
          <Icon name={paused ? "play" : "pause"} size={14} />
        </button>
        <div className="aip__scrub">
          <div className="aip__track" onClick={onScrub} aria-hidden="true">
            <span className="aip__fill" />
            <span className="aip__head" />
            {CHAPTER_AT.map((at) => (
              <span
                className="aip__tick"
                style={{ left: `${at * 100}%` }}
                key={at}
              />
            ))}
          </div>
          <div className="aip__chapters">
            {chapters.map((c, k) => (
              <button
                type="button"
                className={`aip__chapter aip__chapter--${k + 1}`}
                style={{ left: `${CHAPTER_AT[k] * 100}%` }}
                onClick={() => seek(CHAPTER_AT[k] + 0.002)}
                aria-label={`Jump to ${c}`}
                key={c}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <span className="aip__time" aria-hidden="true">
          <span className="aip__now" /> / 0:10
        </span>
      </div>
    </div>
  );
}
