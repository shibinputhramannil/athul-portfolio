import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import data from "./videos.json";

/**
 * Only fields the owner has confirmed belong here. Leave a field out
 * rather than guessing; the site hides anything that is missing.
 */
export interface VideoEntry {
  id: string;
  public: boolean;
  title?: string;
  client?: string;
  kind?: "client" | "practice";
  role?: string;
  year?: string;
}

export type Showreel =
  { mode: "playlist" } | { mode: "reel"; id: string } | null;

export interface Video extends VideoEntry {
  number: string;
  full: string;
  preview: string;
  poster: string;
  durationSec?: number;
}

const mediaRoot = join(process.cwd(), "public", "media");
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

const previewPrivate =
  import.meta.env.DEV &&
  String(
    import.meta.env.PREVIEW_PRIVATE_MEDIA || process.env.PREVIEW_PRIVATE_MEDIA,
  ) === "1";

function readManifest(): Record<string, { durationSec?: number }> {
  const file = join(mediaRoot, "manifest.json");
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, "utf8"));
}

export function getVisibleVideos(): Video[] {
  const manifest = readManifest();
  return (data.videos as VideoEntry[])
    .filter((v) => v.public === true || previewPrivate)
    .filter((v) => existsSync(join(mediaRoot, v.id, "poster.jpg")))
    .map((v, i) => ({
      ...v,
      number: String(i + 1).padStart(2, "0"),
      full: `${base}/media/${v.id}/full.mp4`,
      preview: `${base}/media/${v.id}/preview.mp4`,
      poster: `${base}/media/${v.id}/poster.jpg`,
      durationSec: manifest[v.id]?.durationSec,
    }));
}

export function getShowreel(videos: Video[]): Showreel {
  const reel = data.showreel as Showreel;
  if (!reel || videos.length === 0) return null;
  if (reel.mode === "reel" && !videos.some((v) => v.id === reel.id))
    return null;
  return reel;
}

export function formatDuration(sec?: number): string | undefined {
  if (sec === undefined) return undefined;
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
