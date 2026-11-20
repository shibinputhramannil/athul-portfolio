/**
 * Some hosts inject a fixed badge into the bottom-right corner of the page
 * (Netlify's "Powered by Netlify" on the free plan). The badge is part of the
 * hosting plan, so instead of hiding it we measure it and expose its height
 * as --host-inset; the toasts sit above it.
 */
const BADGE_IDS = ["nl-badge-frame"];

export function watchHostBadge() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  let raf = 0;
  let watched = null;

  const measure = () => {
    raf = 0;
    const el = BADGE_IDS.map((id) => document.getElementById(id)).find(Boolean);
    // The host script resizes its frame after inserting it, so follow the
    // frame itself as well as the page.
    if (el !== watched) {
      if (watched) sizes.unobserve(watched);
      if (el) sizes.observe(el);
      watched = el || null;
    }
    const rect = el?.getBoundingClientRect();
    const inset =
      rect && rect.height > 0 && rect.bottom >= window.innerHeight - 2
        ? Math.round(window.innerHeight - rect.top)
        : 0;
    root.classList.toggle("has-host-badge", inset > 0);
    root.style.setProperty("--host-inset", `${inset}px`);
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(measure);
  };
  const sizes = new ResizeObserver(schedule);

  // The badge script runs after the app, so watch for its frame arriving
  // (only direct children of <body>; cheap) and re-measure on resize.
  new MutationObserver(schedule).observe(document.body, { childList: true });
  window.addEventListener("resize", schedule, { passive: true });
  schedule();
}
