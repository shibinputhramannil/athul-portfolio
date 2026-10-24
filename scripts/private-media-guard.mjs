import { readFile, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

/**
 * Removes every media folder from the build output unless its video is
 * marked `"public": true` in src/content/videos.json, so private encodes
 * sitting in public/media/ on a local machine can never ship in dist/.
 */
export function privateMediaGuard() {
  return {
    name: "private-media-guard",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const data = JSON.parse(
          await readFile(
            new URL("../src/content/videos.json", import.meta.url),
            "utf8",
          ),
        );
        const allowed = new Set(
          data.videos.filter((v) => v.public === true).map((v) => v.id),
        );
        const mediaDir = join(fileURLToPath(dir), "media");
        let entries = [];
        try {
          entries = await readdir(mediaDir);
        } catch {
          return;
        }
        for (const name of entries) {
          if (!allowed.has(name)) {
            await rm(join(mediaDir, name), { recursive: true, force: true });
            logger.info(`removed private media: media/${name}`);
          }
        }
      },
    },
  };
}
