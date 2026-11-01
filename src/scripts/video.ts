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
// Previews within about a screen of the viewport: candidates for buffering ahead.
const near = new Set<HTMLVideoElement>();
const retries = new Map<HTMLVideoElement, number>();
const stalls = new Map<HTMLVideoElement, number>();
let autoplayBlocked = false;
let preferred: HTMLVideoElement | null = null;
const featured = document.querySelector<HTMLVideoElement>(
  "[data-feature] video",
);

const MAX_RETRIES = 2;
const STALL_MS = 12000;

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
const hasSrc = (video: HTMLVideoElement) => video.hasAttribute("src");
const fetching = (video: HTMLVideoElement) =>
  hasSrc(video) && video.networkState === HTMLMediaElement.NETWORK_LOADING;

function buffered(video: HTMLVideoElement) {
  if (video.readyState >= 4) return true;
  const b = video.buffered;
  return (
    b.length > 0 &&
    Number.isFinite(video.duration) &&
    b.end(b.length - 1) >= video.duration - 0.2
  );
}

function load(video: HTMLVideoElement) {
  if (hasSrc(video) || !video.dataset.src) return;
  video.preload = "auto";
  video.src = video.dataset.src;
}

// Cancel an unfinished download so it stops competing for bandwidth; the poster stays.
function unload(video: HTMLVideoElement) {
  if (!hasSrc(video)) return;
  video.removeAttribute("src");
  video.load();
}

const playlistNow = document.querySelector<HTMLElement>("[data-playlist-now]");
function markPlaylist(video: HTMLVideoElement) {
  const number = video.closest<HTMLElement>("[data-number]")?.dataset.number;
  if (playlistNow && number) playlistNow.textContent = number;
}

function clearStall(video: HTMLVideoElement) {
  clearTimeout(stalls.get(video));
  stalls.delete(video);
}

function stop(video: HTMLVideoElement) {
  video.pause();
  playing.delete(video);
  clearStall(video);
  cardOf(video)?.classList.remove("is-playing", "is-loading");
}

function fail(video: HTMLVideoElement) {
  if (failed.has(video)) return;
  const attempt = (retries.get(video) ?? 0) + 1;
  stop(video);
  unload(video);
  const card = cardOf(video);
  if (attempt <= MAX_RETRIES) {
    retries.set(video, attempt);
    card?.classList.add("is-retrying");
    window.setTimeout(() => {
      card?.classList.remove("is-retrying");
      load(video);
      refresh();
    }, 1500 * attempt);
    return;
  }
  failed.add(video);
  card?.classList.remove("is-retrying");
  card?.classList.add("is-error");
  console.warn(`Preview could not load: ${video.dataset.src}`);
  refresh();
}

function start(video: HTMLVideoElement) {
  if (!canAutoplay() || playing.has(video) || playing.size >= maxPlaying())
    return;
  load(video);
  video.muted = true;
  playing.add(video);
  if (video.readyState < 3) {
    cardOf(video)?.classList.add("is-loading");
    // A preview that never gets going is treated like a failed one and retried.
    stalls.set(
      video,
      window.setTimeout(() => {
        if (playing.has(video) && video.readyState < 3) fail(video);
      }, STALL_MS),
    );
  }
  video
    .play()
    .then(() => {
      if (!wanted().has(video)) stop(video);
      else {
        clearStall(video);
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
  // Coarse steps so near-equal frames fall through to the tie-breaks below.
  return Math.round(((h * w) / area) * 10);
}

const centreStep = (video: HTMLVideoElement) =>
  Math.floor(distanceFromCenter(video) / (window.innerHeight * 0.08));

const retrying = (video: HTMLVideoElement) =>
  cardOf(video)?.classList.contains("is-retrying") ?? false;

function wanted() {
  if (!canAutoplay()) return new Set<HTMLVideoElement>();
  const ranked = Array.from(visible)
    // Geometry, not the observer ratio: ancestor clips and masks skew the ratio.
    .filter((v) => visibleStep(v) >= 5 && !failed.has(v) && !retrying(v))
    .sort(
      (a, b) =>
        Number(b === preferred) - Number(a === preferred) ||
        visibleStep(b) - visibleStep(a) ||
        Number(played.has(a)) - Number(played.has(b)) ||
        // The frame nearest the middle of the screen leads after a scroll.
        centreStep(a) - centreStep(b) ||
        Number(b === featured) - Number(a === featured) ||
        // Don't cut off the preview that is already running for an equal one.
        Number(playing.has(b)) - Number(playing.has(a)) ||
        // A preview that can start now beats one still downloading.
        Number(buffered(b)) - Number(buffered(a)) ||
        distanceFromCenter(a) - distanceFromCenter(b),
    );
  return new Set(ranked.slice(0, maxPlaying()));
}

// One download at a time: the preview that should play now, then the nearest upcoming one.
function schedule(target: HTMLVideoElement | undefined) {
  if (target && !buffered(target)) {
    for (const v of previews) {
      if (v !== target && !playing.has(v) && fetching(v)) unload(v);
    }
    return;
  }
  if (!canAutoplay() || saveData() || previews.some(fetching)) return;
  const next = Array.from(near)
    .filter((v) => !hasSrc(v) && !failed.has(v) && !retrying(v))
    .sort((a, b) => distanceFromCenter(a) - distanceFromCenter(b))[0];
  if (next) load(next);
}

function refresh() {
  const want = wanted();
  for (const video of Array.from(playing)) {
    if (!want.has(video)) stop(video);
  }
  for (const video of want) start(video);
  schedule(want.values().next().value);
}

const attachPoster = (video: HTMLVideoElement) => {
  if (!video.poster && video.dataset.poster)
    video.poster = video.dataset.poster;
};

if (previews.length && "IntersectionObserver" in window) {
  const nearby = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          near.add(video);
          // Posters are attached just ahead of view instead of all at page load.
          attachPoster(video);
        } else {
          near.delete(video);
          if (!playing.has(video) && fetching(video)) unload(video);
        }
      }
      refresh();
    },
    { rootMargin: "100% 0px" },
  );
  const watch = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          // A failed preview gets one fresh attempt each time it comes back into view.
          if (failed.delete(video)) {
            retries.set(video, MAX_RETRIES);
            cardOf(video)?.classList.remove("is-error");
          }
          visible.add(video);
        } else {
          visible.delete(video);
          played.delete(video);
        }
      }
      refresh();
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  );
  previews.forEach((video) => {
    nearby.observe(video);
    watch.observe(video);
    video.addEventListener("error", () => {
      if (hasSrc(video) && video.error) fail(video);
    });
    video.addEventListener("waiting", () => {
      if (playing.has(video)) cardOf(video)?.classList.add("is-loading");
    });
    video.addEventListener("playing", () => {
      clearStall(video);
      cardOf(video)?.classList.remove("is-loading");
    });
    // The browser can pause a preview itself (background tab, power saving); free the slot.
    video.addEventListener("pause", () => {
      if (!playing.has(video) || video.ended) return;
      playing.delete(video);
      clearStall(video);
      cardOf(video)?.classList.remove("is-playing", "is-loading");
    });
    video.addEventListener("canplaythrough", refresh);
    video.addEventListener("suspend", refresh);
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
} else {
  previews.forEach(attachPoster);
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
