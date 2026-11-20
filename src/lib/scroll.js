import Lenis from "lenis";

/**
 * Smooth scrolling (Lenis) shared by the app. Off under reduced motion and
 * for touch input, where the native scroll is better.
 */
let lenis = null;

export function startSmoothScroll() {
  // Low-power devices scroll more smoothly with the browser's own scrolling.
  const lowPower =
    (navigator.hardwareConcurrency ?? 8) <= 4 ||
    (navigator.deviceMemory ?? 8) <= 4;
  if (
    lenis ||
    lowPower ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return () => {};
  lenis = new Lenis({
    autoRaf: true,
    lerp: 0.13,
    wheelMultiplier: 1,
    anchors: { offset: 0 },
  });
  return () => {
    lenis?.destroy();
    lenis = null;
  };
}

/** Pause page scrolling (for the viewer overlay). */
export function lockScroll(locked) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.classList.toggle("is-locked", locked);
}

export function scrollToEl(el, offset = 0) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset });
  else
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY + offset,
      behavior: "smooth",
    });
}

/** Scroll the page to a document position (smoothly, through Lenis if on). */
export function scrollToY(y) {
  if (lenis) lenis.scrollTo(y);
  else window.scrollTo({ top: y, behavior: "smooth" });
}
