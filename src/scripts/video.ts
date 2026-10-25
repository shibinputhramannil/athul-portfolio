const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const wide = window.matchMedia("(min-width: 900px)");
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

const maxPlaying = () => (wide.matches ? 3 : 2);
const canAutoplay = () =>
  !reduceMotion.matches && !document.hidden && !dialog?.open;

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
  video.closest(".card")?.classList.remove("is-playing");
}

function start(video: HTMLVideoElement) {
  if (!canAutoplay() || playing.has(video) || playing.size >= maxPlaying())
    return;
  load(video);
  video.muted = true;
  playing.add(video);
  video
    .play()
    .then(() => {
      if (!visible.has(video) || !canAutoplay()) stop(video);
      else {
        video.closest(".card")?.classList.add("is-playing");
        markPlaylist(video);
      }
    })
    .catch(() => stop(video));
}

function refresh() {
  for (const video of Array.from(playing)) {
    if (!visible.has(video) || !canAutoplay()) stop(video);
  }
  for (const video of visible) start(video);
}

if (previews.length && "IntersectionObserver" in window) {
  const preload = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          load(entry.target as HTMLVideoElement);
          preload.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "200px" },
  );
  const watch = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.intersectionRatio >= 0.5) visible.add(video);
        else visible.delete(video);
      }
      refresh();
    },
    { threshold: [0, 0.5] },
  );
  previews.forEach((video) => {
    preload.observe(video);
    watch.observe(video);
  });
  document.addEventListener("visibilitychange", refresh);
  reduceMotion.addEventListener("change", refresh);
}

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
