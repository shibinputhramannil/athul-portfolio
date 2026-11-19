import { useEffect, useRef } from "react";

/**
 * One shared scroll loop for every scroll-driven effect.
 *
 * Layout is measured only when it can change (resize, fonts, content size),
 * never while scrolling. On scroll, one animation frame calls each subscriber
 * with the scroll position and viewport height, and subscribers only write
 * (transforms, opacity), so scrolling never forces a layout.
 */
const frames = new Set();
const measures = new Set();
let raf = 0;
let dirty = true;
let started = false;

function run() {
  raf = 0;
  if (dirty) {
    dirty = false;
    measures.forEach((fn) => fn());
  }
  const y = window.scrollY;
  const vh = window.innerHeight;
  frames.forEach((fn) => fn(y, vh));
}

export function requestFrame() {
  if (!raf) raf = requestAnimationFrame(run);
}

export function invalidate() {
  dirty = true;
  requestFrame();
}

function start() {
  if (started) return;
  started = true;
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", invalidate);
  new ResizeObserver(invalidate).observe(document.body);
  document.fonts?.ready.then(invalidate);
}

/** Document-relative top of an element (layout read: call only in a measure). */
export const docTop = (el) =>
  el ? el.getBoundingClientRect().top + window.scrollY : 0;

/**
 * Subscribe to the shared loop. `onFrame(y, vh)` runs on scroll (writes only);
 * `onMeasure()` runs before it whenever layout may have changed (reads only).
 */
export function useScrollFrame(onFrame, onMeasure) {
  const frameRef = useRef(onFrame);
  const measureRef = useRef(onMeasure);
  frameRef.current = onFrame;
  measureRef.current = onMeasure;
  useEffect(() => {
    start();
    const frame = (y, vh) => frameRef.current?.(y, vh);
    const measure = () => measureRef.current?.();
    frames.add(frame);
    measures.add(measure);
    invalidate();
    return () => {
      frames.delete(frame);
      measures.delete(measure);
    };
  }, []);
}

/**
 * Pauses CSS animations inside an element while it is off screen, so
 * decorative loops cost nothing when nobody can see them.
 */
export function usePauseOffscreen(ref, rootMargin = "100px 0px") {
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([e]) => el.toggleAttribute("data-paused", !e.isIntersecting),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
}
