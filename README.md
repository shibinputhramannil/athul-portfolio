# Adhul U Krishna — portfolio

Portfolio site for Adhul U Krishna, video editor.

- **Frontend**: React 19 + Vite (JavaScript), [Motion](https://motion.dev) for animation and [Lenis](https://lenis.darkroom.engineering) for smooth scrolling. It builds to a static site for GitHub Pages.
- **Backend (optional)**: Django REST Framework in [`backend/`](backend/README.md). It serves the profile and videos from an admin-managed database and receives the contact form. Without it, the site runs entirely on the bundled content, and the contact form is delivered by Netlify Forms (see Contact form below).

## Design

"In the edit suite": near-black with seafoam teal and restrained crimson, cinematic motion, built mobile-first for vertical (9:16) edits. The page plays out like a post-production session.

- **Opener ("Reframe")**: about 2 s, once per visit. A 9:16 frame, the shape of every edit on the site, is drawn in light; the name is cut in letter by letter on a scrubbing playhead with a running timecode; then the four panels around the frame slide apart, each carrying one edge of the light, so the vertical crop grows out to the full screen onto the hero. It waits until the page has rendered (React sends `ak:ready`, capped at 3.2 s), so it never opens onto an empty page. Skipped under reduced motion; any key or tap cuts it short. It lives in `index.html` and `styles/parts/Intro.css`, so it shows before React loads.
- **Type**: Archivo (variable width) for headlines and body, Instrument Serif italic as the editorial accent ("_Video Editor_", "_the next cut_"), and JetBrains Mono for timecode-style labels. Changing numbers use tabular figures so they don't jitter.
- **Kinetic type** (`Kinetic.jsx`, `styles/kinetic.css`): headlines rise letter by letter out of a mask, letters lift under the pointer, and short mono labels decode like a timecode. On desktop, the giant name in the opening scene ripples in width under the pointer, using the font's variable width axis.
- **Scene 01 · About** (`Hero.jsx`): the cut-out portrait between two layers of the name, and a colour-grade wipe from flat "log" to graded (hovering scrubs the split on desktop). Around it sit face-tracking brackets, a vectorscope, audio meters and a spinning badge. Below come the summary, which brightens word by word, rolling stat counters and languages.
- **Tapes** (`Tapes.jsx`): two crossing skill bands, tinted glass with the words in the balanced grade, that speed up with scroll velocity.
- **Scene 02 · Work** (`components/work/`):
  - **The reel** (`ReelRing.jsx`): every edit stands on a 3D cylinder. The edit facing the viewer plays muted, inside a rotating light border. The edits either side keep their video buffered, and the front edit is promoted before the spin fully stops, so a new edit starts playing as it arrives. Its frames are sampled live into a blurred ambient glow, and its colour spills onto a receding studio floor. The reel advances on its own when the clip ends. Playback is built to hold up on phones: a card's video drops its source the moment it leaves the reel (freeing the decoder at once), a watchdog retries the front edit twice a second until it plays, and swipes, taps and keys start the arriving edit inside the gesture itself, which power-saving modes require. Drag or swipe it, flick a trackpad sideways, use ← → or the filmstrip; click the front edit to watch it with sound.
  - **Colour signatures**: each edit's accent colour is sampled from its poster frame (`lib/media.js`). It tints that edit's card, border, numbers, duration bar and viewer.
  - **The bin** (`Bin.jsx`): every edit as a row in a project panel, filterable by running time and sortable. With a mouse, a preview floats beside the pointer and skims through the clip as you move across the row, with live timecode.
  - **The viewer** (`Viewer.jsx`): a full-screen player with sound, custom controls, timecode, editor shortcuts (K play/pause, J/L shuttle, N/P next and previous edit, M mute, F full screen, Esc close) and an "Up next" card.
- **Scene 03 · Craft** (`Craft.jsx`): skills as an effect-controls stack whose keyframes flash as a playhead passes, and the toolkit: three big cards that stack as a deck on wide screens. Each card is a 50 s explainer of one tool, played like a course video (`AIPlayer.jsx`, topics in `toolPrograms.js`): five important topics of 10 s each, every one a cartoon motion graphic of how the feature or algorithm works (`ToolAI.jsx`, `scenes/*.jsx`, `styles/parts/Toolkit.css` and `styles/parts/scenes/`). Premiere Pro: Auto Reframe, Scene Edit Detection, Speech to Text, Enhance Speech, Generative Extend. After Effects: Roto Brush, Content-Aware Fill, 3D Camera Tracker, Graph Editor, Expressions. DaVinci Resolve: Magic Mask, Speed Warp, Depth Map, Face Refinement, Super Scale. Each topic opens on a title card naming the algorithm, the camera pushes in while it works, narration appears word by word over three beats, and a result badge lands. It plays on its own, with no play or pause: under the video sit a five-segment progress bar (click a segment to jump) and the topic's AI pipeline (the engine that runs it, such as Adobe Sensei, Adobe Firefly or the DaVinci Neural Engine, and its three steps lighting up in turn, plus a running clock); beside it, the topic playlist shows the one playing (open, with its description, algorithm and a filling bar) and jumps to any topic. Each card plays only while it is on screen, so every explainer starts from its first topic when you reach it, and stops when covered in the deck. The programme clock is the progress bar's own CSS animation; only the playing scene is mounted and is lined up with the clock when it starts. The animated video mounts as the card nears the screen and the other twelve scenes load as their own chunks then, so the first page load stays light. The cards themselves are animated: they lift in one after another, a light sweeps the top edge as each lands, a soft beam circles the border while it plays, and with a mouse the card leans toward the pointer with a spotlight and a gradient border (none of it exists until a card is on screen, so it costs nothing at load). SVG and CSS only; under reduced motion each topic shows its finished result as a still, chosen from the playlist.
- **Experience, Contact**: clapperboard section slates (`SectionHead.jsx`), each title over an outlined echo split into the same letter boxes so it stays in register. Experience is a set of editorial rows (dates, studio and role, the work) whose hairlines draw in the scene's grade. Contact has a project-brief form and an audio track (`Waveform.jsx`) that a playhead lights up.
- **Header** (`Header.jsx`): a brand lockup, sentence-case section links with a sliding glass highlight and a dot in the scene's colour, search (Ctrl/⌘ K) and a call to action. Flat over the first screen; once the page scrolls it condenses into a floating glass bar with a reading-progress line, hides while scrolling down and returns on the way up. Below 920px the links move into a full-screen menu (large links rising in turn, email, local time, call to action) that locks the page, closes on Esc and returns focus.
- **Footer** (`Footer.jsx`): name and blurb with a live IST clock, Navigate / Services / Contact columns (with copy email), the legal line, and the page ends on a giant near-black "ADHUL" wordmark cut off by the bottom edge. Its letters rise in on arrival; on desktop a spotlight follows the pointer and shows the colour grade inside the letters.
- **Colour grade** (`styles/color.css`): a teal-and-orange palette (cyan, seafoam, amber, coral, crimson, plus a violet night tone) with matching gradients. The gradients are balanced: every stop sits in one lightness band (OKLCH L 0.70–0.90) with real colour, a pale-gold bridge keeps teal-to-orange from turning khaki, and browsers that support it blend them in OKLab. Each scene has its own accent, so headings, rules and the header indicator change colour as you move through the page. Headings use a per-letter slice of one gradient, so words stay one continuous blend while the letters animate.
- **Command palette** (`CommandPalette.jsx`, Ctrl/⌘ K or `/`): jump to any scene, play any edit, copy the email, write an email or share the portfolio from the keyboard. Glass toasts (`Toaster.jsx`) confirm actions.
- **Text in motion**: a rolling word in the opening line ("cut for Reels / Shorts / Stories / Ads"), key skills in the summary that light up in their own gradient as you read, letters that rise in gradient, and labels that decode like timecode.
- **Glass** (`styles/glass.css`): panels, chips and controls are frosted glass. Most of it is layered fills, a light-catching gradient rim and an inner highlight, painted once so it costs nothing while scrolling. Live backdrop blur is kept to small or fixed surfaces: header, cursor lens, hero chips and viewer controls.

Everything settles to a static, fully readable layout under `prefers-reduced-motion`.

## Run it

Requires Node 20.19+ (CI uses 22).

```sh
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # static output in dist/
npm run preview    # serve dist/
npm run lint       # prettier --check
npm run format     # prettier --write
```

To run the frontend against the Django API, start the backend (see [backend/README.md](backend/README.md)) and set `VITE_API_URL`:

```sh
VITE_API_URL=http://127.0.0.1:8000 npm run dev
```

If the API can't be reached, the site falls back to the bundled content.

## Content

- `src/content/profile.json`: name, summary, experience, skills, tools, education, languages and contact. Every value comes from the CV. The backend's `seed_portfolio` command reads the same file.
- `src/content/videos.json`: the video list and display `order`. This is the publishing gate (see below). The old `showreel` key is no longer used; the reel in Selected work plays every visible edit.

## Videos and privacy

The repository is public, so anything committed is published. Video files are never committed unless the owner has confirmed they may be shown.

- Every video in `videos.json` has `"public": false` by default. Add `title`, `client`, `kind` (`"client"` or `"practice"`), `role` or `year` only once confirmed. Missing fields are not shown.
- `media-src/`, `media.local.json` and `public/media/` are git-ignored.
- The build only includes videos with `"public": true` (the `virtual:videos` module from `scripts/portfolio-videos.mjs`). A build hook (`scripts/private-media-guard.mjs`) also deletes any private media folder from `dist/`. The Django API applies the same rule.
- Selected work only appears once at least one video is public.
- Edits without a confirmed `title` are labelled "Edit 01", "Edit 02" and so on.

Encoding (needs `ffmpeg` and `ffprobe` on PATH):

```sh
cp media.local.example.json media.local.json   # map ids to files in media-src/
npm run media                                  # writes public/media/<id>/{full,preview}.mp4, poster.jpg
npm run dev:private                            # local preview including private videos (dev only)
PREVIEW_VIDEOS=video-01,video-04 npm run dev:private   # limit that preview to the listed ids
```

To publish a video once it has been confirmed:

1. Set `"public": true` and the confirmed fields in `videos.json`.
2. Add a `!public/media/<id>/` exception to `.gitignore` and commit that folder.

## Profile photo

- `src/assets/profile.png`: the approved cut-out portrait (transparent background).
- `src/assets/profile-{480,720,940}.webp`: the sizes the site serves, made from the PNG.
- `public/og.jpg`: 1:1 link-preview image, emitted as `og:image` when `SITE_URL` is set.

## Deployment

### Netlify

The site is deployed to Netlify on the `shibi-ii` team. `netlify.toml` declares the build (`npm run build` → `dist/`) and headers, and `public/_headers` carries the same caching and security headers into prebuilt deploys:

```sh
SITE_URL=https://<site>.netlify.app npm run build
npx netlify-cli deploy --prod --dir dist
```

Connecting the GitHub repository in the Netlify dashboard turns this into a deploy on every push. Netlify hosts only the static frontend; the Django REST backend runs elsewhere if used.

Netlify's free plan adds a "Powered by Netlify" badge in the bottom-right corner. It is part of the plan, so the site doesn't hide it: `src/lib/hostBadge.js` measures it and the toasts move above it; the page ends on the decorative footer wordmark, which the badge may sit over.

#### Contact form

The form sends, in order of preference:

1. **Django API** when the site is built with `VITE_API_URL` (stored in the admin, emailed to `CONTACT_NOTIFY_EMAIL`).
2. **Netlify Forms** on Netlify: a hidden `<form name="contact" data-netlify="true">` in `index.html` registers the fields at deploy time, and the React form posts to it. Form detection must be on (Netlify → Forms), and an email notification for new submissions sends each brief to the portfolio address. A `website` honeypot field filters bots.
3. **The visitor's email app** (`mailto:`) anywhere else. Other hosts answer the post with 404/405, which triggers this fallback.

#### Caching

Media URLs carry a short content hash (`poster.jpg?v=…`, added by `scripts/portfolio-videos.mjs`), so `/media/*` is cached for a year like the hashed `/assets/*`. Replacing a video changes its hash, and visitors get the new file.

#### Performance notes

- The first render runs as a React transition (`main.jsx`), so building the page never blocks the main thread in one long task.
- The first screen's fonts and the portrait are preloaded from the HTML (`preloadFirstScreen` in `vite.config.js`).
- The reel requests no posters or videos until it is within a screen of the viewport.
- `scrollbar-gutter: stable` keeps the page from jumping sideways when scrolling is locked (opener, palette, viewer). Animated layers move with transforms only, so the page has no layout shift.

### Vercel

The site deploys to Vercel as the `adhul-portfolio` project on the `shibin1` team. `vercel.json` sets the Vite build, long-lived caching for hashed assets and media, and basic security headers. `.vercelignore` keeps the Django backend and any unconfirmed media out of the upload; it follows the same publishing gate as `.gitignore`. The production domain is picked up automatically for the `og:image` URL.

```sh
npx vercel deploy --prod --scope shibin1   # from the repo root, once linked to adhul-portfolio
```

To deploy on every push instead, connect the GitHub repository to the project in the Vercel dashboard (Settings → Git).

### GitHub Pages

The frontend deploys to GitHub Pages via `.github/workflows/deploy.yml`. It runs on every push to `main` (or manually from the Actions tab), builds with `SITE_URL=https://shibinputhramannil.github.io` and `BASE_PATH=/athul-portfolio`, and publishes `dist/` to https://shibinputhramannil.github.io/athul-portfolio/. One-time setup: Settings → Pages → Source: **GitHub Actions**.

`.github/workflows/ci.yml` checks formatting and builds the frontend, and runs the Django test suite.

GitHub Pages can only host the static frontend. To use the backend in production, deploy `backend/` to a Python host (see its README). Then add a `VITE_API_URL` env value to the build step of `deploy.yml`, and add the Pages origin to the API's `CORS_ALLOWED_ORIGINS`.
