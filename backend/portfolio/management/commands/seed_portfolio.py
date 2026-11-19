"""
Load the frontend's bundled content into the database.

    python manage.py seed_portfolio
    python manage.py seed_portfolio --profile path/to/profile.json --videos path/to/videos.json

Idempotent: rows are matched by slug (videos) / singleton (profile) and updated
in place. The profile's experience, skills, tools, education and languages are
replaced on every run. Video metadata keys missing from videos.json (title,
client, kind, role, year) are left as they are, so titles edited in the admin
survive a re-seed; is_public, order, number and duration always follow the JSON.
"""

import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from portfolio.models import (
    Education,
    Experience,
    Language,
    Profile,
    Skill,
    Tool,
    Video,
)

FILE_FIELDS = {"poster": "poster.jpg", "preview": "preview.mp4", "full": "full.mp4"}
OPTIONAL_TEXT = {"title": "title", "client": "client", "kind": "kind", "role": "role", "year": "year"}
ORDER_STEP = 10  # gaps make reordering in the admin easy


def _read_json(path: Path) -> dict:
    try:
        with path.open(encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        raise CommandError(f"File not found: {path}")
    except json.JSONDecodeError as exc:
        raise CommandError(f"Invalid JSON in {path}: {exc}")


class Command(BaseCommand):
    help = "Seed Profile and Video rows from src/content/profile.json and videos.json."

    def add_arguments(self, parser):
        repo_root = Path(settings.BASE_DIR).parent
        parser.add_argument(
            "--profile",
            type=Path,
            default=repo_root / "src" / "content" / "profile.json",
            help="Path to profile.json (default: <repo>/src/content/profile.json).",
        )
        parser.add_argument(
            "--videos",
            type=Path,
            default=repo_root / "src" / "content" / "videos.json",
            help="Path to videos.json (default: <repo>/src/content/videos.json).",
        )
        parser.add_argument("--skip-profile", action="store_true", help="Do not touch the profile.")
        parser.add_argument("--skip-videos", action="store_true", help="Do not touch videos.")

    @transaction.atomic
    def handle(self, *args, **options):
        if not options["skip_profile"]:
            self._seed_profile(options["profile"].resolve())
        if not options["skip_videos"]:
            self._seed_videos(options["videos"].resolve())

    # -- profile -----------------------------------------------------------

    def _seed_profile(self, path: Path) -> None:
        data = _read_json(path)
        if not data.get("name"):
            raise CommandError(f"{path} has no 'name'.")

        profile, _ = Profile.objects.update_or_create(
            pk=1,
            defaults={
                field: data.get(field) or ""
                for field in ("name", "role", "email", "location", "summary")
            },
        )

        related = [
            (Experience, data.get("experience") or [], ("company", "role", "period", "description")),
            (Education, data.get("education") or [], ("qualification", "institution", "period")),
            (Language, data.get("languages") or [], ("name", "level")),
        ]
        for model, items, fields in related:
            model.objects.filter(profile=profile).delete()
            model.objects.bulk_create(
                model(profile=profile, order=i, **{f: item.get(f) or "" for f in fields})
                for i, item in enumerate(items)
            )
        for model, names in ((Skill, data.get("skills") or []), (Tool, data.get("tools") or [])):
            model.objects.filter(profile=profile).delete()
            model.objects.bulk_create(
                model(profile=profile, order=i, name=name) for i, name in enumerate(names)
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Profile: {profile.name} "
                f"({profile.experience.count()} experience, {profile.skills.count()} skills, "
                f"{profile.tools.count()} tools, {profile.education.count()} education, "
                f"{profile.languages.count()} languages)"
            )
        )

    # -- videos ------------------------------------------------------------

    def _seed_videos(self, path: Path) -> None:
        data = _read_json(path)
        videos = data.get("videos") or []
        ids = [v.get("id") for v in videos]
        if not all(ids):
            raise CommandError(f"Every video in {path} needs an 'id'.")
        if len(set(ids)) != len(ids):
            raise CommandError(f"Duplicate video ids in {path}.")

        # Display order: the `order` array first, then everything else by number.
        explicit = []
        for slug in data.get("order") or []:
            if slug not in ids:
                self.stderr.write(self.style.WARNING(f"order: unknown video id {slug!r} ignored"))
            elif slug not in explicit:
                explicit.append(slug)
        rest = [slug for slug in ids if slug not in explicit]  # already in number order
        position = {slug: (i + 1) * ORDER_STEP for i, slug in enumerate(explicit + rest)}

        storage = Video._meta.get_field("poster").storage
        created = linked = 0
        for index, item in enumerate(videos, start=1):
            slug = item["id"]
            defaults = {
                "number": f"{index:02d}",
                "is_public": bool(item.get("public", False)),  # private unless said otherwise
                "order": position[slug],
                "duration_sec": item.get("durationSec"),
            }
            for json_key, field in OPTIONAL_TEXT.items():
                if json_key in item:
                    defaults[field] = item.get(json_key) or ""
            for field, filename in FILE_FIELDS.items():
                name = f"{slug}/{filename}"
                if storage.exists(name):
                    defaults[field] = name
                    linked += 1

            _, was_created = Video.objects.update_or_create(slug=slug, defaults=defaults)
            created += was_created

        public = Video.objects.filter(slug__in=ids, is_public=True).count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Videos: {len(videos)} in JSON ({created} created, {len(videos) - created} updated), "
                f"{public} public, {linked} media files linked from {settings.MEDIA_ROOT}"
            )
        )
