import "./video";

const revealTargets = document.querySelectorAll<HTMLElement>(
  "[data-reveal], [data-fade]",
);

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.2 },
  );
  revealTargets.forEach((el) => io.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("is-in"));
}

const playhead = document.querySelector<HTMLElement>(".playhead");
const ticks = document.querySelector<HTMLElement>(".playhead__ticks");

function maxScroll() {
  return Math.max(
    1,
    document.documentElement.scrollHeight - window.innerHeight,
  );
}

function placeTicks() {
  if (!ticks) return;
  ticks.replaceChildren();
  document.querySelectorAll<HTMLElement>("main .section").forEach((section) => {
    const top = section.getBoundingClientRect().top + window.scrollY;
    const tick = document.createElement("span");
    tick.style.left = `${Math.min(100, (top / maxScroll()) * 100)}%`;
    ticks.append(tick);
  });
}

let frame = 0;
function updatePlayhead() {
  frame = 0;
  playhead?.style.setProperty(
    "--p",
    String(Math.min(1, window.scrollY / maxScroll())),
  );
}

window.addEventListener(
  "scroll",
  () => {
    if (!frame) frame = requestAnimationFrame(updatePlayhead);
  },
  { passive: true },
);
window.addEventListener("resize", () => {
  placeTicks();
  updatePlayhead();
});
window.addEventListener("load", placeTicks);
placeTicks();
updatePlayhead();

const timeline = document.querySelector<HTMLElement>(".hero__timeline");
function sizeTimeline() {
  if (timeline)
    timeline.style.setProperty("--tl-w", `${timeline.clientWidth - 38}px`);
}
window.addEventListener("resize", sizeTimeline);
sizeTimeline();

document
  .querySelectorAll<HTMLButtonElement>("[data-copy]")
  .forEach((button) => {
    const status =
      button.parentElement?.querySelector<HTMLElement>("[role='status']");
    button.addEventListener("click", async () => {
      const text = button.dataset.copy ?? "";
      try {
        await navigator.clipboard.writeText(text);
        if (status) status.textContent = "Email copied";
      } catch {
        if (status) status.textContent = text;
      }
      window.setTimeout(() => {
        if (status) status.textContent = "";
      }, 3000);
    });
  });
