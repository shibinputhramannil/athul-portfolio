import { defineConfig } from "astro/config";
import { privateMediaGuard } from "./scripts/private-media-guard.mjs";

export default defineConfig({
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || "/",
  integrations: [privateMediaGuard()],
});
