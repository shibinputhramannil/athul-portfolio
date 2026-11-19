import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { portfolioVideos } from "./scripts/portfolio-videos.mjs";
import { privateMediaGuard } from "./scripts/private-media-guard.mjs";

// BASE_PATH ("/athul-portfolio") and SITE_URL come from the GitHub Pages
// workflow. On Vercel the site lives at the root and its production domain
// comes from Vercel's system environment variable.
const base = `${(process.env.BASE_PATH || "").replace(/\/$/, "")}/`;
const vercelSite = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "";
// Netlify sets URL during its builds.
const site = (process.env.SITE_URL || process.env.URL || vercelSite).replace(
  /\/$/,
  "",
);

/** Adds the absolute og:image and canonical URL when SITE_URL is known. */
function siteMeta() {
  return {
    name: "site-meta",
    transformIndexHtml(html) {
      if (!site) return html;
      const url = `${site}${base}`;
      return html.replace(
        "</head>",
        `  <meta property="og:image" content="${url}og.jpg" />\n    <meta property="og:url" content="${url}" />\n    <link rel="canonical" href="${url}" />\n  </head>`,
      );
    },
  };
}

/**
 * Preloads what the first screen needs (the Latin font files and the
 * portrait) straight from the HTML. Otherwise the browser only discovers
 * them after the JavaScript has rendered the page, so the name re-flows when
 * its font lands and the portrait (the LCP image) starts late.
 */
function preloadFirstScreen() {
  const fonts = [
    /archivo-latin-wdth-normal-[\w-]+\.woff2$/,
    /jetbrains-mono-latin-500-normal-[\w-]+\.woff2$/,
    /instrument-serif-latin-400-italic-[\w-]+\.woff2$/,
  ];
  const portrait = {
    480: /profile-480-/,
    720: /profile-720-/,
    940: /profile-940-/,
  };
  return {
    name: "preload-first-screen",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        const files = Object.keys(ctx.bundle ?? {});
        const find = (re) => files.find((f) => re.test(f));
        const tags = fonts
          .map(find)
          .filter(Boolean)
          .map((f) => ({
            tag: "link",
            attrs: {
              rel: "preload",
              as: "font",
              type: "font/woff2",
              href: `${base}${f}`,
              crossorigin: "",
            },
            injectTo: "head",
          }));
        const srcset = Object.entries(portrait)
          .map(([w, re]) => [w, find(re)])
          .filter(([, f]) => f)
          .map(([w, f]) => `${base}${f} ${w}w`)
          .join(", ");
        if (srcset)
          tags.push({
            tag: "link",
            attrs: {
              rel: "preload",
              as: "image",
              type: "image/webp",
              imagesrcset: srcset,
              // Must match the <img sizes> in Hero.jsx.
              imagesizes: "(max-width: 760px) 92vw, 46vw",
              fetchpriority: "high",
            },
            injectTo: "head",
          });
        return tags;
      },
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    react(),
    portfolioVideos(),
    privateMediaGuard(),
    siteMeta(),
    preloadFirstScreen(),
  ],
  build: {
    target: "es2022",
    assetsInlineLimit: 0,
  },
  server: { host: "127.0.0.1", port: 5173 },
  preview: { host: "127.0.0.1", port: 4173 },
});
