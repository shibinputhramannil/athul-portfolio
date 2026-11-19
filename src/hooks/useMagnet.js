import { useEffect } from "react";

/**
 * Magnetic buttons: elements marked [data-magnet] lean toward the pointer
 * and spring back when it leaves. Driven by a small lerp loop on the
 * `translate` property, so the buttons' own CSS transitions stay intact.
 * Mouse only; off under reduced motion.
 */
export function useMagnet() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || still.matches) return;

    const cleanups = Array.from(document.querySelectorAll("[data-magnet]")).map(
      (el) => {
        let rect = null;
        let tx = 0;
        let ty = 0;
        let x = 0;
        let y = 0;
        let raf = 0;
        const loop = () => {
          x += (tx - x) * 0.18;
          y += (ty - y) * 0.18;
          el.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
          raf =
            Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05
              ? requestAnimationFrame(loop)
              : 0;
        };
        const kick = () => {
          if (!raf) raf = requestAnimationFrame(loop);
        };
        const move = (e) => {
          if (!rect) rect = el.getBoundingClientRect();
          tx = (e.clientX - (rect.left + rect.width / 2)) * 0.28;
          ty = (e.clientY - (rect.top + rect.height / 2)) * 0.38;
          kick();
        };
        const leave = () => {
          rect = null;
          tx = 0;
          ty = 0;
          kick();
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        return () => {
          cancelAnimationFrame(raf);
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        };
      },
    );
    return () => cleanups.forEach((fn) => fn());
  }, []);
}
