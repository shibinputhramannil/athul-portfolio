# Portfolio API (optional backend)

A small Django REST Framework backend for the portfolio site. It is **optional**:
the site is a static build on GitHub Pages and works without it using the bundled
`src/content/*.json`. When the frontend is built with `VITE_API_URL` pointing here,
it reads the profile and videos from this API and posts the contact form to it.

What it gives you over the static data:

- An admin (`/admin/`) to edit the profile, reorder videos, and switch videos between public and private.
- A contact form endpoint that stores messages (spam honeypot and rate limit included) and can email you.

Stack: Django 6.1, Django REST Framework, django-cors-headers, WhiteNoise, gunicorn, SQLite.

## Setup

Requires Python 3.12+ (verified on Python 3.15.0). All commands run from `backend/`.

```bash
cd backend
python -m venv .venv

# Windows (PowerShell):   .venv\Scripts\Activate.ps1
# Windows (Git Bash):     source .venv/Scripts/activate
# macOS / Linux:          source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_portfolio      # loads src/content/profile.json + videos.json
python manage.py createsuperuser     # for /admin/
```

Configuration is read from environment variables. To keep it in a file, copy
`.env.example` to `.env` (git-ignored). Everything has a development default, so
you don't need a `.env` locally.

### Seeding

`python manage.py seed_portfolio` is safe to run repeatedly:

- **Profile**: the single profile row is updated. Experience, skills, tools, education and languages are replaced with the JSON contents.
- **Videos**: matched by `id` (stored as `slug`). Each run sets these from `videos.json`:
  - `is_public` from `public`. A video with no `public` key is private.
  - `order` from the `order` array, in steps of 10 so you can slot videos in from the admin. Videos missing from the array go after, by number.
  - `number` from the 1-based position in `videos` (`"01"`).
  - `duration_sec` from `durationSec`.
  - Optional metadata (`title`, `client`, `kind`, `role`, `year`), only when the key is present. That way titles you typed in the admin survive a re-seed.
- **Media**: `poster`, `preview` and `full` are set to `<id>/poster.jpg`, `<id>/preview.mp4` and `<id>/full.mp4`, but only when that file exists under `MEDIA_ROOT`. By default `MEDIA_ROOT` is the repo's `public/media/`, so the API serves the same files as the static site.

Flags: `--profile PATH` and `--videos PATH` read other files (relative paths are
resolved from the current directory). `--skip-profile` and `--skip-videos` limit
what gets seeded.

> Re-seeding resets `is_public` and `order` to whatever `videos.json` says. If you
> manage visibility in the admin, don't re-seed afterwards, or update the JSON too.

## Run

```bash
python manage.py runserver 8000
```

- API: http://127.0.0.1:8000/api/health/
- Admin: http://127.0.0.1:8000/admin/

While `DJANGO_DEBUG` is true, the dev server also serves `MEDIA_ROOT` at `/media/`.

Tests:

```bash
python manage.py test
```

## Using it from the frontend

Set `VITE_API_URL` when you run or build the React app, from the repo root:

```bash
# PowerShell
$env:VITE_API_URL = "http://127.0.0.1:8000"; npm run dev

# bash
VITE_API_URL=http://127.0.0.1:8000 npm run dev
```

Leave `VITE_API_URL` unset and the frontend uses its bundled JSON. The API allows
CORS from `http://localhost:5173` and `http://127.0.0.1:5173` by default. Add other
origins, like your GitHub Pages origin, with `CORS_ALLOWED_ORIGINS`.

## API reference

All responses are JSON. The keys below are a fixed contract with the frontend.

### `GET /api/health/`

```json
{ "ok": true }
```

### `GET /api/profile/`

Same shape as `src/content/profile.json`. Returns `404` if no profile exists yet (run `seed_portfolio`).

```json
{
  "name": "…",
  "role": "…",
  "email": "…",
  "location": "…",
  "summary": "…",
  "experience": [
    { "company": "…", "role": "…", "period": "…", "description": "…" }
  ],
  "skills": ["…"],
  "tools": ["…"],
  "education": [{ "qualification": "…", "institution": "…", "period": "…" }],
  "languages": [{ "name": "…", "level": "…" }]
}
```

### `GET /api/videos/`

A plain JSON array, not paginated, of **public** videos in display order (`order`, then `number`).

```json
[
  {
    "id": "video-05",
    "number": "05",
    "title": null,
    "client": null,
    "kind": null,
    "role": null,
    "year": null,
    "durationSec": 32.3,
    "poster": "http://127.0.0.1:8000/media/video-05/poster.jpg",
    "preview": "http://127.0.0.1:8000/media/video-05/preview.mp4",
    "full": "http://127.0.0.1:8000/media/video-05/full.mp4"
  }
]
```

- Empty text fields are `null`. `kind` is `"client"`, `"practice"` or `null`.
- File URLs are absolute. A URL is `null` when the file isn't set or is missing from `MEDIA_ROOT`.

### `GET /api/videos/<id>/`

One public video, same shape. Returns `404` for unknown **and** private videos.

### `POST /api/contact/`

Request body (JSON):

```json
{
  "name": "Jane",
  "email": "jane@example.com",
  "message": "At least ten characters…",
  "project": "optional, up to 200 chars",
  "website": ""
}
```

| Response                      | When                                                                                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `201 {"ok": true}`            | The message was stored. If `CONTACT_NOTIFY_EMAIL` is set, a notification is emailed too, and an email failure is logged without failing the request. |
| `201 {"ok": true}`            | `website` (the honeypot) was filled in. Nothing is stored or sent.                                                                                   |
| `400 {"field": ["error", …]}` | Validation failed. `name` must be 1–120 chars, `email` must be valid, `message` must be 10–5000 chars.                                               |
| `429 {"detail": "…"}`         | More than 5 contact requests per hour from one client (`CONTACT_THROTTLE_RATE`).                                                                     |

### Privacy

A video with `is_public = false` is excluded from every API response: the list and
detail endpoints only query public rows. That rule only covers the API. The dev
server's `/media/` route serves any file in `MEDIA_ROOT`, so never put private
footage in a publicly served media folder. Keep it in `media-src/`, as the root
README describes.

## Production notes

GitHub Pages can only host the static frontend. To use this API in production,
deploy it to a Python host such as **Render**, **Railway** or **PythonAnywhere**,
then rebuild the frontend with `VITE_API_URL=https://your-api-host`.

1. Build and release:

   ```bash
   pip install -r requirements.txt
   python manage.py collectstatic --noinput   # admin CSS/JS, served by WhiteNoise
   python manage.py migrate
   python manage.py seed_portfolio            # first deploy only, or when the JSON changes
   ```

2. Start command (Linux; gunicorn does not run on Windows):

   ```bash
   gunicorn config.wsgi --bind 0.0.0.0:$PORT
   ```

   PythonAnywhere uses its own WSGI setup. Point its WSGI file at `config.wsgi.application`.

3. Environment variables:

   | Variable                      | Production value                                                                                                                                     |
   | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `DJANGO_DEBUG`                | `false`                                                                                                                                              |
   | `DJANGO_SECRET_KEY`           | A long random string (required when debug is off)                                                                                                    |
   | `DJANGO_ALLOWED_HOSTS`        | `your-api-host.onrender.com`                                                                                                                         |
   | `DJANGO_CSRF_TRUSTED_ORIGINS` | `https://your-api-host.onrender.com` (admin login)                                                                                                   |
   | `DJANGO_NUM_PROXIES`          | `1` behind the platform's proxy (real client IPs, https URLs)                                                                                        |
   | `CORS_ALLOWED_ORIGINS`        | `https://<user>.github.io`                                                                                                                           |
   | `MEDIA_URL`                   | Where the video files are publicly hosted (see below)                                                                                                |
   | `CONTACT_NOTIFY_EMAIL`        | Optional. Set with `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` |

4. **Media files.** Django doesn't serve `/media/` when debug is off. The simplest
   option is the copy GitHub Pages already serves: set
   `MEDIA_URL=https://<user>.github.io/athul-portfolio/media/`. Keep the repo's
   `public/media/` on the server, because the API only returns URLs for files it
   can find in `MEDIA_ROOT`. Files you upload through the admin then also need
   public hosting, such as a CDN, object storage, or committing them to
   `public/media/`.

5. **Database.** SQLite (`backend/db.sqlite3`) is enough for this site. Some hosts
   (Render's free tier) have an ephemeral filesystem, which wipes the database on
   every deploy or restart. There, attach a persistent disk, or run `migrate` and
   `seed_portfolio` on every deploy and accept that stored contact messages and
   admin edits won't survive. `CONTACT_NOTIFY_EMAIL` still delivers each message
   to your inbox.

`python manage.py check --deploy` will suggest HSTS and SSL redirect settings.
Hosts like Render already force HTTPS at the proxy.
