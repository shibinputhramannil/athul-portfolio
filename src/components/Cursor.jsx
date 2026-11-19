import { useEffect, useRef } from "react";

/** Trailing ring for mouse users; it becomes a "Play" disc over edits. */
export default function Cursor() {
  const ref = useRef(null);

  useEffect(() => {
    const cursor = ref.current;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!cursor || !fine.matches || still.matches) return;

    let x = -100;
    let y = -100;
    let tx = x;
    let ty = y;
    let raf = 0;
    const loop = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf =
        Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2
          ? requestAnimationFrame(loop)
          : 0;
    };
    // Work out what is under the pointer (also re-run after scrolling,
    // when the page moves under a still mouse).
    const update = (t) => {
      if (!t) return;
      const labelled = t.closest?.("[data-cursor-label]");
      const label = cursor.querySelector(".cursor__label");
      if (label)
        label.textContent =
          labelled?.getAttribute("data-cursor-label") || "Play";
      cursor.classList.add("is-on");
      cursor.classList.toggle("is-play", !!labelled);
      // Short tags (Drag, Select, Grade) use a compact bubble; Play/Watch stay big.
      const tag = labelled?.getAttribute("data-cursor-label");
      cursor.classList.toggle(
        "is-tag",
        !!tag && tag !== "Play" && tag !== "Watch",
      );
      cursor.classList.toggle(
        "is-link",
        !labelled && !!t.closest?.("a, button, [data-tilt], [data-grade]"),
      );
    };
    const move = (e) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      update(e.target);
      if (!raf) raf = requestAnimationFrame(loop);
    };
    let scrollFrame = 0;
    const onScroll = () => {
      if (scrollFrame || tx < 0) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        update(document.elementFromPoint(tx, ty));
      });
    };
    const leave = () => cursor.classList.remove("is-on");
    const down = () => cursor.classList.add("is-down");
    const up = () => cursor.classList.remove("is-down");
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(scrollFrame);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true" ref={ref}>
      <span className="cursor__ring" />
      <span className="cursor__label">Play</span>
    </div>
  );
}
