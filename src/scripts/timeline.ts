import { animate, inView, scroll, stagger } from "motion";

const root = document.querySelector<HTMLElement>("[data-timeline]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (root && !reduceMotion.matches) {
  root.classList.add("tl--animate");
  const ease = [0.2, 0.8, 0.2, 1] as const;

  const fill = root.querySelector<HTMLElement>("[data-tl-fill]");
  const list = root.querySelector<HTMLElement>(".tl__list");
  if (fill && list) {
    scroll(animate(fill, { scaleY: [0, 1] }, { ease: "linear" }), {
      target: list,
      offset: ["start 75%", "end 60%"],
    });
  }

  root.querySelectorAll<HTMLElement>("[data-tl-item]").forEach((item) => {
    const years = item.querySelector<HTMLElement>(".tl__years");
    if (years) {
      scroll(animate(years, { x: ["4%", "-4%"] }, { ease: "linear" }), {
        target: item,
        offset: ["start end", "end start"],
      });
    }

    inView(
      item,
      () => {
        item.classList.add("is-active");
        const node = item.querySelector(".tl__node");
        if (node)
          animate(node, { scale: [0, 1] }, { type: "spring", bounce: 0.4 });
        animate(
          item.querySelectorAll(".tl__char"),
          { y: ["110%", "0%"] },
          { delay: stagger(0.025), duration: 0.6, ease },
        );
        animate(
          item.querySelectorAll("[data-tl-line]"),
          { opacity: [0, 1], y: [16, 0] },
          { delay: stagger(0.1, { startDelay: 0.2 }), duration: 0.6, ease },
        );
      },
      { amount: 0.3 },
    );
  });

  reduceMotion.addEventListener("change", () => {
    if (!reduceMotion.matches) return;
    root.classList.remove("tl--animate");
    root
      .querySelectorAll<HTMLElement>(
        ".tl__char, [data-tl-line], .tl__node, .tl__years, [data-tl-fill]",
      )
      .forEach((el) => el.removeAttribute("style"));
  });
}
