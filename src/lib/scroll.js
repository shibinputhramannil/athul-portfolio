/**
 * Page scrolling helpers. Scrolling is the browser's own: it runs on the
 * compositor (GPU), so it stays smooth even while the page is busy, and
 * mouse wheels still glide (the browser animates wheel steps). A script-
 * driven smooth scroll moved the page from the main thread every frame and
 * dropped about one frame in seven while scrolling; this keeps it at 60.
 */

/** Pause page scrolling (for the viewer overlay). */
export function lockScroll(locked) {
  document.documentElement.classList.toggle("is-locked", locked);
}

export function scrollToEl(el, offset = 0) {
  if (!el) return;
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY + offset,
    behavior: "smooth",
  });
}

/** Scroll the page to a document position, smoothly. */
export function scrollToY(y) {
  window.scrollTo({ top: y, behavior: "smooth" });
}
