# Adhul U Krishna — portfolio

Portfolio site for Adhul U Krishna, video editor. Built with [Astro](https://astro.build) and TypeScript, output as a static site.

Design direction: "Cut on black". Near-black with seafoam teal and restrained crimson, cinematic motion, laid out mobile-first for vertical (9:16) edits.

## Run it

Requires Node 20.3+.

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview    # serve dist/
npm run lint       # astro check (types) + prettier --check
npm run format     # prettier --write
```

## Content

- `src/content/profile.ts`: name, summary, experience, skills, tools, education, languages and contact. Every value comes from the CV.
- `src/content/videos.json`: the video list and showreel setting. This is the publishing gate (see below).

## Videos and privacy

The repository is public, so anything committed is published. Video files are never committed unless the owner has confirmed they may be shown.

- Every video in `videos.json` has `"public": false` by default. Add `title`, `client`, `kind` (`"client"` or `"practice"`), `role` or `year` only once confirmed. Missing fields are not shown.
- `media-src/`, `media.local.json` and `public/media/` are git-ignored.
- The build only renders videos with `"public": true`. A build hook (`scripts/private-media-guard.mjs`) also deletes any private media folder from `dist/`.
- The hero previews and Reel section only appear once at least one video is public. The showreel is set to `{ "mode": "playlist" }`: every visible edit plays muted while it is in view and pauses when it leaves. Selected work follows the Reel as a sideways strip of the same edits, using the short preview loops. Use `{ "mode": "reel", "id": "video-0X" }` for a single cut reel, or `null` to hide it.
- Edits without a confirmed `title` are labelled "Edit 01", "Edit 02" and so on.

Encoding (needs `ffmpeg` and `ffprobe` on PATH):

```sh
cp media.local.example.json media.local.json   # map ids to files in media-src/
npm run media                                  # writes public/media/<id>/{full,preview}.mp4, poster.jpg
npm run dev:private                            # local preview including private videos (dev only)
```

To publish a video once it has been confirmed:

1. Set `"public": true` and the confirmed fields in `videos.json`.
2. Add a `!public/media/<id>/` exception to `.gitignore` and commit that folder.

## Profile photo

Approved edit (natural crop, lighting, colour and an off-white background; face and features unchanged):

- `src/assets/profile.jpg`: 4:5 About portrait, resized to WebP at build time.
- `public/og.jpg`: 1:1 link-preview image, emitted as `og:image` when `SITE_URL` is set.

## Deployment

Not configured yet. For a GitHub Pages project site, build with `BASE_PATH=/athul-portfolio SITE_URL=https://<user>.github.io`. CI (`.github/workflows/ci.yml`) only lints and builds; it does not deploy.
