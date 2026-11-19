"""
Django settings for the optional portfolio API.

Every value comes from environment variables with safe development defaults.
A `backend/.env` file (KEY=VALUE lines) is loaded if present; real environment
variables always win over it. See `.env.example` for the full list.
"""

import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

# backend/
BASE_DIR = Path(__file__).resolve().parent.parent
# Repository root (the frontend lives here; seed data and media are read from it).
REPO_ROOT = BASE_DIR.parent


# ---------------------------------------------------------------------------
# Environment helpers
# ---------------------------------------------------------------------------


def _load_dotenv(path: Path) -> None:
    """Tiny .env loader: KEY=VALUE lines, # comments, optional quotes/`export`."""
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        if line.startswith("export "):
            line = line[len("export ") :].lstrip()
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
            value = value[1:-1]
        if key:
            os.environ.setdefault(key, value)


_load_dotenv(BASE_DIR / ".env")


def env_str(name: str, default: str = "") -> str:
    """String value; unset or blank (e.g. `KEY=` in .env) falls back to default."""
    value = os.environ.get(name, "").strip()
    return value or default


def env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None or value.strip() == "":
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_int(name: str, default: int) -> int:
    value = os.environ.get(name, "").strip()
    return int(value) if value else default


def env_list(name: str, default: str = "") -> list[str]:
    return [item.strip() for item in env_str(name, default).split(",") if item.strip()]


# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------

DEBUG = env_bool("DJANGO_DEBUG", True)

_DEV_SECRET_KEY = "django-insecure-dev-only-change-me-in-production"
SECRET_KEY = env_str("DJANGO_SECRET_KEY") or _DEV_SECRET_KEY
if not DEBUG and SECRET_KEY == _DEV_SECRET_KEY:
    raise ImproperlyConfigured("Set DJANGO_SECRET_KEY when DJANGO_DEBUG is false.")

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,[::1]")
CSRF_TRUSTED_ORIGINS = env_list("DJANGO_CSRF_TRUSTED_ORIGINS")

# Number of reverse proxies in front of the app (Render/Railway/PythonAnywhere: 1).
# Used to read the client IP for throttling and to trust X-Forwarded-Proto so
# absolute media URLs come out as https://.
NUM_PROXIES = env_int("DJANGO_NUM_PROXIES", 0)
if NUM_PROXIES > 0:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "portfolio",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    # Production serves admin static files from STATIC_ROOT via WhiteNoise
    # (run collectstatic). In development runserver serves them itself.
    *([] if DEBUG else ["whitenoise.middleware.WhiteNoiseMiddleware"]),
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# ---------------------------------------------------------------------------
# Database (SQLite at backend/db.sqlite3)
# ---------------------------------------------------------------------------

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# ---------------------------------------------------------------------------
# Static (admin assets, served by WhiteNoise) and media (video files)
# ---------------------------------------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Media defaults to the frontend's public/media folder so seeded file names
# (<slug>/poster.jpg, ...) resolve to the same files the static site uses.
MEDIA_ROOT = Path(env_str("MEDIA_ROOT") or REPO_ROOT / "public" / "media")
MEDIA_URL = env_str("MEDIA_URL", "/media/")

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": (
            "django.contrib.staticfiles.storage.StaticFilesStorage"
            if DEBUG
            else "whitenoise.storage.CompressedManifestStaticFilesStorage"
        )
    },
}


# ---------------------------------------------------------------------------
# CORS (the React/Vite frontend runs on another origin)
# ---------------------------------------------------------------------------

CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
)
CORS_URLS_REGEX = r"^/(api|media)/.*$"


# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    # The public API is anonymous; no session auth means no CSRF on POST.
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "UNAUTHENTICATED_USER": None,
    "DEFAULT_PAGINATION_CLASS": None,
    "DEFAULT_THROTTLE_RATES": {
        "contact": env_str("CONTACT_THROTTLE_RATE", "5/hour"),
    },
    "NUM_PROXIES": NUM_PROXIES,
}


# ---------------------------------------------------------------------------
# Email (Django 6.1 MAILERS; console backend by default)
# ---------------------------------------------------------------------------

CONTACT_NOTIFY_EMAIL = env_str("CONTACT_NOTIFY_EMAIL")
DEFAULT_FROM_EMAIL = env_str("DEFAULT_FROM_EMAIL", "webmaster@localhost")

_email_backend = env_str("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
_email_options = {}
if _email_backend.endswith("smtp.EmailBackend"):
    _email_options = {
        "host": env_str("EMAIL_HOST", "localhost"),
        "port": env_int("EMAIL_PORT", 587),
        "username": env_str("EMAIL_HOST_USER"),
        "password": env_str("EMAIL_HOST_PASSWORD"),
        "use_tls": env_bool("EMAIL_USE_TLS", True),
        "timeout": env_int("EMAIL_TIMEOUT", 10),
    }

MAILERS = {
    "default": {"BACKEND": _email_backend, "OPTIONS": _email_options},
}

# The console backend is only a problem if we actually send mail.
SILENCED_SYSTEM_CHECKS = [] if CONTACT_NOTIFY_EMAIL else ["mail.E001"]
