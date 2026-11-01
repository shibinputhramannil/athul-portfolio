const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const dialog = document.querySelector<HTMLDialogElement>("[data-player]");
const dialogVideo = dialog?.querySelector<HTMLVideoElement>(
  "[data-player-video]",
);
const dialogTitle = dialog?.querySelector<HTMLElement>("#player-title");

const previews = Array.from(
  document.querySelectorAll<HTMLVideoElement>("video[data-src]"),
);
const visible = new Set<HTMLVideoElement>();
const playing = new Set<HTMLVideoElement>();
// Visible previews that already finished a pass; the next visible one takes over.
const played = new Set<HTMLVideoElement>();
const failed = new Set<HTMLVideoElement>();
let autoplayBlocked = false;
let preferred: HTMLVideoElement | null = null;
const featured = document.querySelector<HTMLVideoElement>(
  "[data-feature] video",
);

// Only the active project plays: the keyboard-focused card, else the most visible one.
const maxPlaying = () => 1;
const canAutoplay = () =>
  !autoplayBlocked &&
  !reduceMotion.matches &&
  !document.hidden &&
  !dialog?.open;
const saveData = () =>
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    ?.saveData === true;

const cardOf = (video: HTMLVideoElement) => video.closest(".card");

function load(video: HTMLVideoElement) {
  if (!video.getAttribute("src") && video.dataset.src)
    video.src = video.dataset.src;
}

const playlistNow = document.querySelector<HTMLElement>("[data-playlist-now]");
function markPlaylist(video: HTMLVideoElement) {
  const number = video.closest<HTMLElement>("[data-number]")?.dataset.number;
  if (playlistNow && number) playlistNow.textContent = number;
}

function stop(video: HTMLVideoElement) {
  video.pause();
  playing.delete(video);
  cardOf(video)?.classList.remove("is-playing", "is-loading");
}

function fail(video: HTMLVideoElement) {
  if (failed.has(video)) return;
  failed.add(video);
  stop(video);
  cardOf(video)?.classList.add("is-error");
  console.warn(`Preview could not load: ${video.currentSrc || video.src}`);
  refresh();
}

function start(video: HTMLVideoElement) {
  if (!canAutoplay() || playing.has(video) || playing.size >= maxPlaying())
    return;
  load(video);
  video.muted = true;
  playing.add(video);
  if (video.readyState < 3) cardOf(video)?.classList.add("is-loading");
  video
    .play()
    .then(() => {
      if (!wanted().has(video)) stop(video);
      else {
        cardOf(video)?.classList.remove("is-loading");
        cardOf(video)?.classList.add("is-playing");
        markPlaylist(video);
      }
    })
    .catch((error: DOMException) => {
      stop(video);
      // Browser policy (e.g. a battery saver) refused muted autoplay: keep posters, stop retrying.
      if (error.name === "NotAllowedError") autoplayBlocked = true;
      else if (video.error) fail(video);
    });
}

function distanceFromCenter(video: HTMLVideoElement) {
  const r = video.getBoundingClientRect();
  return Math.hypot(
    r.left + r.width / 2 - window.innerWidth / 2,
    r.top + r.height / 2 - window.innerHeight / 2,
  );
}

// Measured live: observer ratios can stall just short of a threshold after scrolling.
function visibleStep(video: HTMLVideoElement) {
  const r = video.getBoundingClientRect();
  const h = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
  const w = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0);
  const area = r.width * r.height;
  if (h <= 0 || w <= 0 || !area) return 0;
  // Coarse steps so near-equal frames fall through to the featured/centre tie-breaks.
  return Math.round(((h * w) / area) * 10);
}

function wanted() {
  if (!canAutoplay()) return new Set<HTMLVideoElement>();
  const ranked = Array.from(visible)
    .filter((v) => !failed.has(v))
    .sort(
      (a, b) =>
        Number(b === preferred) - Number(a === preferred) ||
        visibleStep(b) - visibleStep(a) ||
        Number(played.has(a)) - Number(played.has(b)) ||
        Number(b === featured) - Number(a === featured) ||
        distanceFromCenter(a) - distanceFromCenter(b),
    );
  return new Set(ranked.slice(0, maxPlaying()));
}

function refresh() {
  const want = wanted();
  for (const video of Array.from(playing)) {
    if (!want.has(video)) stop(video);
  }
  for (const video of want) start(video);
}

if (previews.length && "IntersectionObserver" in window) {
  // Buffer the short preview clips just before they scroll into view, so playback starts at once.
  const preload = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !canAutoplay() || saveData()) continue;
        const video = entry.target as HTMLVideoElement;
        video.preload = "auto";
        load(video);
        preload.unobserve(video);
      }
    },
    { rootMargin: "50% 0px" },
  );
  const watch = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.intersectionRatio >= 0.5) visible.add(video);
        else {
          visible.delete(video);
          played.delete(video);
        }
      }
      refresh();
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  );
  previews.forEach((video) => {
    preload.observe(video);
    watch.observe(video);
    video.addEventListener("error", () => fail(video));
    video.addEventListener("waiting", () => {
      if (playing.has(video)) cardOf(video)?.classList.add("is-loading");
    });
    video.addEventListener("playing", () =>
      cardOf(video)?.classList.remove("is-loading"),
    );
    // One pass each: when several previews are on screen they take turns.
    video.addEventListener("ended", () => {
      played.add(video);
      const others = Array.from(visible).filter(
        (v) => v !== video && !failed.has(v),
      );
      if (others.length && others.every((v) => played.has(v)))
        others.forEach((v) => played.delete(v));
      stop(video);
      video.currentTime = 0;
      if (!others.length) played.delete(video);
      refresh();
    });
  });
  let settle = 0;
  window.addEventListener(
    "scroll",
    () => {
      clearTimeout(settle);
      settle = window.setTimeout(() => {
        // Scrolling means a new choice: the centred preview leads again.
        played.clear();
        refresh();
      }, 150);
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", refresh);
  reduceMotion.addEventListener("change", refresh);
  previews.forEach((video) => {
    const card = video.closest<HTMLElement>(".card");
    const prefer = () => {
      preferred = video;
      refresh();
    };
    card?.addEventListener("focus", prefer);
  });
}

let playerOpener: HTMLButtonElement | null = null;

function closePlayer() {
  if (!dialog || !dialogVideo) return;
  dialogVideo.pause();
  dialogVideo.removeAttribute("src");
  dialogVideo.load();
  if (dialog.open) dialog.close();
}

document
  .querySelectorAll<HTMLButtonElement>("[data-video-open]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      if (!dialog || !dialogVideo) return;
      playerOpener = button;
      dialogVideo.poster = button.dataset.poster ?? "";
      dialogVideo.src = button.dataset.full ?? "";
      if (dialogTitle)
        dialogTitle.textContent = button.dataset.title ?? "Video";
      dialog.showModal();
      refresh();
      dialogVideo.focus();
    });
  });

dialog
  ?.querySelector("[data-player-close]")
  ?.addEventListener("click", closePlayer);
dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) closePlayer();
});
dialog?.addEventListener("close", () => {
  closePlayer();
  playerOpener?.focus({ preventScroll: true });
  refresh();
});

const strip = document.querySelector<HTMLElement>("[data-strip]");
function scrollStrip(direction: number) {
  if (!strip) return;
  const item = strip.querySelector<HTMLElement>(".strip__item");
  const step = (item?.offsetWidth ?? 300) + 24;
  strip.scrollBy({
    left: direction * step,
    behavior: reduceMotion.matches ? "auto" : "smooth",
  });
}
document
  .querySelector("[data-strip-prev]")
  ?.addEventListener("click", () => scrollStrip(-1));
document
  .querySelector("[data-strip-next]")
  ?.addEventListener("click", () => scrollStrip(1));

const reel = document.querySelector<HTMLElement>("[data-reel]");
const reelVideo = reel?.querySelector<HTMLVideoElement>("[data-reel-video]");
const reelItems = Array.from(
  reel?.querySelectorAll<HTMLButtonElement>("[data-reel-item]") ?? [],
);
function selectReel(index: number, autoplay: boolean) {
  const item = reelItems[index];
  if (!item || !reelVideo) return;
  reelItems.forEach((b) => b.removeAttribute("aria-current"));
  item.setAttribute("aria-current", "true");
  reelVideo.poster = item.dataset.poster ?? "";
  reelVideo.src = item.dataset.full ?? "";
  if (autoplay) reelVideo.play().catch(() => undefined);
}
reelItems.forEach((item, i) =>
  item.addEventListener("click", () => selectReel(i, true)),
);
reelVideo?.addEventListener("ended", () => {
  const current = reelItems.findIndex(
    (b) => b.getAttribute("aria-current") === "true",
  );
  if (current >= 0 && current < reelItems.length - 1)
    selectReel(current + 1, true);
});

// Featured edit: a running timecode (25 fps) follows its muted preview.
const featureTc = document.querySelector<HTMLElement>("[data-feature-tc]");
featured?.addEventListener("timeupdate", () => {
  if (!featureTc) return;
  const t = featured.currentTime;
  const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
  featureTc.textContent = `00:${pad(t / 60)}:${pad(t % 60)}:${pad((t % 1) * 25)}`;
});
