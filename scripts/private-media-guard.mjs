import { readFile, readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

/**
 * Vite plugin. Removes every media folder from the build output unless its
 * video is marked `"public": true` in src/content/videos.json, so private
 * encodes sitting in public/media/ on a local machine can never ship in dist/.
 */
export function privateMediaGuard() {
  let outDir = "dist";
  return {
    name: "private-media-guard",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const data = JSON.parse(
        await readFile(
          new URL("../src/content/videos.json", import.meta.url),
          "utf8",
        ),
      );
      const allowed = new Set(
        data.videos.filter((v) => v.public === true).map((v) => v.id),
      );
      const mediaDir = join(outDir, "media");
      let entries = [];
      try {
        entries = await readdir(mediaDir);
      } catch {
        return;
      }
      for (const name of entries) {
        if (!allowed.has(name)) {
          await rm(join(mediaDir, name), { recursive: true, force: true });
          console.log(`[private-media-guard] removed media/${name}`);
        }
      }
      if ((await readdir(mediaDir)).length === 0)
        await rm(mediaDir, { recursive: true });
    },
  };
}
