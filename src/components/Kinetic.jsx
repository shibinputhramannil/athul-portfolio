import { useEffect, useRef, useState } from "react";
import { useInView } from "../hooks/useInView";

const cx = (...c) => c.filter(Boolean).join(" ");

/**
 * Kinetic headline: each character rises out of a mask with a slight
 * rotation, staggered left to right. Only transform and opacity animate.
 *
 * trigger="view" (default) starts when the line scrolls into view;
 * trigger="ready" leaves it to the page's opening sequence (html.is-ready).
 */
export function SplitText({
  text,
  as: Tag = "span",
  className,
  trigger = "view",
  delay = 0,
  stagger = 24,
  hover = false,
  grad,
}) {
  const [ref, inView] = useInView({ threshold: 0.2 });
  let i = 0;
  // Total characters: lets each letter show its own slice of one gradient,
  // so the word reads as a single continuous blend even while letters move.
  const count = text.replace(/ /g, "").length;
  return (
    <Tag
      ref={trigger === "view" ? ref : undefined}
      className={cx(
        "split",
        hover && "split--hover",
        trigger === "ready" && "split--ready",
        grad && `split--grad split--${grad}`,
        inView && "is-in",
        className,
      )}
      style={{ "--d": `${delay}ms`, "--st": `${stagger}ms`, "--n": count }}
    >
      {/* aria-label is ignored on plain spans and paragraphs, so screen
          readers get the words as real (visually hidden) text instead. */}
      <span className="sr-only">{text}</span>
      {text.split(" ").map((word, w) => (
        <span className="split__w" aria-hidden="true" key={w}>
          {[...word].map((ch, k) => (
            <span className="split__c" style={{ "--i": i++ }} key={k}>
              {ch}
            </span>
          ))}
          {w < text.split(" ").length - 1 && (
            <span className="split__sp"> </span>
          )}
        </span>
      ))}
    </Tag>
  );
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/:+";

/**
 * Label that decodes like a timecode: random glyphs settle into the real
 * text from left to right when it first comes into view.
 */
export function Scramble({
  text,
  as: Tag = "span",
  className,
  duration = 700,
}) {
  const [ref, inView] = useInView({ threshold: 0.4 });
  const [out, setOut] = useState(text);
  const done = useRef(false);

  useEffect(() => {
    if (!inView || done.current) return;
    done.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    let raf = 0;
    let last = 0;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      if (now - last > 40 || p === 1) {
        last = now;
        const settled = Math.floor(p * text.length);
        setOut(
          [...text]
            .map((ch, i) =>
              i < settled || ch === " "
                ? ch
                : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
            )
            .join(""),
        );
      }
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, text, duration]);

  return (
    <Tag ref={ref} className={cx("scramble", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{out}</span>
    </Tag>
  );
}

/**
 * Rolling word: cycles through a list like a slot reel, each word rolling
 * up letter by letter. The longest word reserves the width so nothing
 * around it shifts. Pauses off screen and under reduced motion.
 */
export function WordRoll({ words, interval = 2400, className }) {
  const [index, setIndex] = useState(0);
  const [ref, inView] = useInView({ threshold: 0, once: false });
  useEffect(() => {
    if (!inView || words.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      interval,
    );
    return () => window.clearInterval(id);
  }, [inView, words.length, interval]);
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");
  const word = words[index];
  return (
    <span ref={ref} className={cx("roll", className)}>
      <span className="roll__size" aria-hidden="true">
        {longest}
      </span>
      <span className="sr-only">{words.join(", ")}</span>
      <span className="roll__word" key={word} aria-hidden="true">
        {[...word].map((ch, i) => (
          <span className="roll__c" style={{ "--i": i }} key={i}>
            {ch}
          </span>
        ))}
      </span>
    </span>
  );
}
