import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Vite plugin exposing `virtual:videos`: the edits that may be shown, in
 * display order, with media URLs under the site base. This is the publishing
 * gate. Only `"public": true` entries are included (private ones only in the
 * local `npm run dev:private` preview), and only when their poster exists.
 */
const VIRTUAL = "virtual:videos";
const RESOLVED = `\0${VIRTUAL}`;

const root = process.cwd();
const dataFile = join(root, "src", "content", "videos.json");
const mediaRoot = join(root, "public", "media");
const pad = (n) => String(n).padStart(2, "0");

function readJson(file, fallback) {
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : fallback;
}

/**
 * Media URL with a short content hash (?v=…). The files keep their names,
 * so the hash is what lets /media/* be cached for a year: replacing a video
 * changes its hash, and visitors fetch the new file. Hashes are memoised by
 * size and mtime, so the dev server only re-reads files that changed.
 */
const hashes = new Map();
function versioned(base, id, name) {
  const file = join(mediaRoot, id, name);
  const url = `${base}media/${id}/${name}`;
  if (!existsSync(file)) return url;
  const { size, mtimeMs } = statSync(file);
  const key = `${file}:${size}:${mtimeMs}`;
  let v = hashes.get(key);
  if (!v) {
    v = createHash("sha1")
      .update(readFileSync(file))
      .digest("hex")
      .slice(0, 10);
    hashes.set(key, v);
  }
  return `${url}?v=${v}`;
}

export function visibleVideos({ base, previewPrivate, previewOnly }) {
  const data = readJson(dataFile, { videos: [] });
  const manifest = readJson(join(mediaRoot, "manifest.json"), {});
  const order = data.order ?? [];
  const rank = (id) => {
    const i = order.indexOf(id);
    return i === -1 ? order.length : i;
  };
  return (
    data.videos
      // Numbered by position in the full list, so "Edit 04" keeps its label
      // even while earlier edits are private.
      .map((v, i) => ({ ...v, number: pad(i + 1) }))
      .filter(
        (v) =>
          v.public === true ||
          (previewPrivate &&
            (previewOnly.length === 0 || previewOnly.includes(v.id))),
      )
      .filter((v) => existsSync(join(mediaRoot, v.id, "poster.jpg")))
      .sort((a, b) => rank(a.id) - rank(b.id))
      .map((v) => ({
        id: v.id,
        number: v.number,
        title: v.title ?? null,
        client: v.client ?? null,
        kind: v.kind ?? null,
        role: v.role ?? null,
        year: v.year ?? null,
        durationSec: v.durationSec ?? manifest[v.id]?.durationSec ?? null,
        poster: versioned(base, v.id, "poster.jpg"),
        preview: versioned(base, v.id, "preview.mp4"),
        full: versioned(base, v.id, "full.mp4"),
      }))
  );
}

export function portfolioVideos() {
  let options = { base: "/", previewPrivate: false, previewOnly: [] };
  return {
    name: "portfolio-videos",
    configResolved(config) {
      const dev = config.command === "serve";
      options = {
        base: config.base,
        // Private edits can only ever be previewed by the local dev server.
        previewPrivate: dev && process.env.PREVIEW_PRIVATE_MEDIA === "1",
        previewOnly: String(process.env.PREVIEW_VIDEOS ?? "")
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean),
      };
    },
    resolveId(id) {
      if (id === VIRTUAL) return RESOLVED;
    },
    load(id) {
      if (id !== RESOLVED) return;
      this.addWatchFile(dataFile);
      return `export default ${JSON.stringify(visibleVideos(options))};`;
    },
    handleHotUpdate({ file, server }) {
      if (!file.replace(/\\/g, "/").endsWith("src/content/videos.json")) return;
      const mod = server.moduleGraph.getModuleById(RESOLVED);
      if (mod) server.moduleGraph.invalidateModule(mod);
      server.ws.send({ type: "full-reload" });
      return [];
    },
  };
}
