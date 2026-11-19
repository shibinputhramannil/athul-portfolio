import json
import shutil
import tempfile
from io import StringIO
from pathlib import Path

from django.core import mail
from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse

from .models import (
    ContactMessage,
    Education,
    Experience,
    Language,
    Profile,
    Skill,
    Tool,
    Video,
)


class TempMediaMixin:
    """Point MEDIA_ROOT at a throwaway directory for the duration of a test class."""

    @classmethod
    def setUpClass(cls):
        cls._media_dir = tempfile.mkdtemp(prefix="portfolio-media-")
        cls._media_override = override_settings(MEDIA_ROOT=cls._media_dir, MEDIA_URL="/media/")
        cls._media_override.enable()
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        cls._media_override.disable()
        shutil.rmtree(cls._media_dir, ignore_errors=True)

    @classmethod
    def touch_media(cls, relative: str) -> None:
        path = Path(cls._media_dir) / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(b"x")


class HealthTests(TestCase):
    def test_health(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"ok": True})

    def test_cors_header_for_vite_dev_origin(self):
        response = self.client.get("/api/health/", HTTP_ORIGIN="http://localhost:5173")
        self.assertEqual(response["Access-Control-Allow-Origin"], "http://localhost:5173")


class VideoApiTests(TempMediaMixin, TestCase):
    EXPECTED_KEYS = {
        "id",
        "number",
        "title",
        "client",
        "kind",
        "role",
        "year",
        "durationSec",
        "poster",
        "preview",
        "full",
    }

    @classmethod
    def setUpTestData(cls):
        cls.touch_media("video-01/poster.jpg")
        cls.touch_media("video-01/preview.mp4")
        # video-01/full.mp4 deliberately missing on disk.
        Video.objects.create(
            slug="video-01",
            number="01",
            is_public=True,
            order=30,
            duration_sec=65.9,
            poster="video-01/poster.jpg",
            preview="video-01/preview.mp4",
            full="video-01/full.mp4",
        )
        Video.objects.create(slug="video-02", number="02", is_public=False, order=10, title="Secret")
        Video.objects.create(
            slug="video-03",
            number="03",
            is_public=True,
            order=20,
            title="Brand film",
            client="Acme",
            kind="client",
            role="Editor",
            year="2025",
        )
        # Same order value as video-01: tie broken by number.
        Video.objects.create(slug="video-04", number="04", is_public=True, order=30)

    def test_list_excludes_private_and_keeps_order(self):
        response = self.client.get("/api/videos/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)  # no pagination envelope
        self.assertEqual([v["id"] for v in data], ["video-03", "video-01", "video-04"])
        self.assertNotIn("video-02", response.content.decode())
        self.assertNotIn("Secret", response.content.decode())

    def test_video_shape_nulls_and_absolute_urls(self):
        data = {v["id"]: v for v in self.client.get("/api/videos/").json()}
        first = data["video-01"]
        self.assertEqual(set(first), self.EXPECTED_KEYS)
        self.assertEqual(first["number"], "01")
        self.assertEqual(first["durationSec"], 65.9)
        self.assertIsNone(first["title"])  # "" -> null
        self.assertIsNone(first["kind"])
        self.assertEqual(first["poster"], "http://testserver/media/video-01/poster.jpg")
        self.assertEqual(first["preview"], "http://testserver/media/video-01/preview.mp4")
        self.assertIsNone(first["full"])  # file missing on disk

        third = data["video-03"]
        self.assertEqual(third["title"], "Brand film")
        self.assertEqual(third["kind"], "client")
        self.assertIsNone(third["poster"])  # no file set
        self.assertIsNone(third["durationSec"])

    def test_detail_public(self):
        response = self.client.get("/api/videos/video-03/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], "video-03")

    def test_detail_private_is_404(self):
        response = self.client.get("/api/videos/video-02/")
        self.assertEqual(response.status_code, 404)
        self.assertNotIn("Secret", response.content.decode())

    def test_detail_missing_is_404(self):
        self.assertEqual(self.client.get("/api/videos/video-99/").status_code, 404)

    def test_read_only(self):
        self.assertEqual(self.client.post("/api/videos/", {}, content_type="application/json").status_code, 405)


class ProfileApiTests(TestCase):
    def test_404_without_profile(self):
        self.assertEqual(self.client.get("/api/profile/").status_code, 404)

    def test_profile_shape(self):
        profile = Profile.objects.create(
            name="Adhul", role="Video Editor", email="a@example.com", location="India", summary="Hi"
        )
        Experience.objects.create(profile=profile, order=1, company="B Co", role="Editor", period="2024", description="b")
        Experience.objects.create(profile=profile, order=0, company="A Co", role="Editor", period="2025", description="a")
        Skill.objects.create(profile=profile, order=1, name="Color")
        Skill.objects.create(profile=profile, order=0, name="Editing")
        Tool.objects.create(profile=profile, order=0, name="Premiere Pro")
        Education.objects.create(profile=profile, order=0, qualification="B.E.", institution="PJCE", period="2020")
        Language.objects.create(profile=profile, order=0, name="Tamil", level="Native")

        response = self.client.get("/api/profile/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "name": "Adhul",
                "role": "Video Editor",
                "email": "a@example.com",
                "location": "India",
                "summary": "Hi",
                "experience": [
                    {"company": "A Co", "role": "Editor", "period": "2025", "description": "a"},
                    {"company": "B Co", "role": "Editor", "period": "2024", "description": "b"},
                ],
                "skills": ["Editing", "Color"],
                "tools": ["Premiere Pro"],
                "education": [{"qualification": "B.E.", "institution": "PJCE", "period": "2020"}],
                "languages": [{"name": "Tamil", "level": "Native"}],
            },
        )

    def test_profile_is_singleton(self):
        Profile.objects.create(name="One")
        Profile(name="Two").save()
        self.assertEqual(Profile.objects.count(), 1)
        self.assertEqual(Profile.load().name, "Two")


class ContactApiTests(TestCase):
    url = "/api/contact/"
    valid = {
        "name": "Jane Client",
        "email": "jane@example.com",
        "project": "Brand film",
        "message": "Hello, I would like a 60s edit.",
    }

    def setUp(self):
        cache.clear()  # reset the throttle between tests

    def post(self, payload, **extra):
        return self.client.post(self.url, payload, content_type="application/json", **extra)

    def test_success_stores_message(self):
        response = self.post(self.valid)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), {"ok": True})
        msg = ContactMessage.objects.get()
        self.assertEqual(msg.name, "Jane Client")
        self.assertEqual(msg.email, "jane@example.com")
        self.assertEqual(msg.project, "Brand film")
        self.assertFalse(msg.handled)
        self.assertEqual(msg.ip, "127.0.0.1")
        self.assertEqual(len(mail.outbox), 0)  # CONTACT_NOTIFY_EMAIL unset

    def test_project_is_optional(self):
        payload = {k: v for k, v in self.valid.items() if k != "project"}
        self.assertEqual(self.post(payload).status_code, 201)
        self.assertEqual(ContactMessage.objects.get().project, "")

    @override_settings(CONTACT_NOTIFY_EMAIL="owner@example.com")
    def test_notification_email(self):
        self.assertEqual(self.post(self.valid).status_code, 201)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["owner@example.com"])
        self.assertEqual(mail.outbox[0].reply_to, ["jane@example.com"])
        self.assertIn("Hello, I would like", mail.outbox[0].body)

    @override_settings(
        CONTACT_NOTIFY_EMAIL="owner@example.com",
        MAILERS={"default": {"BACKEND": "portfolio.tests.ExplodingBackend"}},
    )
    def test_email_failure_is_silent(self):
        with self.assertLogs("portfolio.views", level="ERROR"):
            response = self.post(self.valid)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ContactMessage.objects.count(), 1)

    @override_settings(CONTACT_NOTIFY_EMAIL="owner@example.com")
    def test_honeypot_pretends_success_but_stores_nothing(self):
        response = self.post({**self.valid, "website": "http://spam.example"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), {"ok": True})
        self.assertEqual(ContactMessage.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 0)

    def test_validation_errors(self):
        response = self.post({"name": "", "email": "not-an-email", "message": "too short"})
        self.assertEqual(response.status_code, 400)
        errors = response.json()
        self.assertEqual(set(errors), {"name", "email", "message"})
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_missing_fields(self):
        response = self.post({})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(set(response.json()), {"name", "email", "message"})

    def test_length_limits(self):
        response = self.post({**self.valid, "name": "x" * 121, "message": "y" * 5001})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(set(response.json()), {"name", "message"})
        ok = self.post({**self.valid, "name": "x" * 120, "message": "y" * 5000})
        self.assertEqual(ok.status_code, 201)

    def test_throttled_after_five_per_hour(self):
        for _ in range(5):
            self.assertEqual(self.post(self.valid).status_code, 201)
        self.assertEqual(self.post(self.valid).status_code, 429)
        self.assertEqual(ContactMessage.objects.count(), 5)


class ExplodingBackend:
    """Mail backend that always fails, to prove notification errors are swallowed."""

    def __init__(self, *args, **kwargs):
        pass

    def send_messages(self, messages):
        raise ConnectionRefusedError("SMTP down")


class SeedCommandTests(TempMediaMixin, TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="portfolio-seed-"))
        self.addCleanup(shutil.rmtree, self.tmp, True)
        self.profile_path = self.tmp / "profile.json"
        self.videos_path = self.tmp / "videos.json"
        self.profile_path.write_text(
            json.dumps(
                {
                    "name": "Adhul",
                    "role": "Video Editor",
                    "email": "a@example.com",
                    "location": "India",
                    "summary": "Hi",
                    "experience": [{"company": "A", "role": "Editor", "period": "2025", "description": "d"}],
                    "skills": ["Editing", "Color"],
                    "tools": ["Premiere Pro"],
                    "education": [{"qualification": "B.E.", "institution": "PJCE", "period": "2020"}],
                    "languages": [{"name": "Tamil", "level": "Native"}],
                }
            ),
            encoding="utf-8",
        )
        self.videos_path.write_text(
            json.dumps(
                {
                    "showreel": None,
                    "videos": [
                        {"id": "video-01", "public": True, "durationSec": 10},
                        {"id": "video-02", "public": False, "durationSec": 20},
                        {"id": "video-03", "public": True, "durationSec": 30, "title": "Third", "kind": "practice"},
                        {"id": "video-04", "public": True, "durationSec": 40},
                    ],
                    "order": ["video-03", "video-01"],
                }
            ),
            encoding="utf-8",
        )
        self.touch_media("video-01/poster.jpg")

    def seed(self):
        call_command(
            "seed_portfolio",
            "--profile",
            str(self.profile_path),
            "--videos",
            str(self.videos_path),
            stdout=StringIO(),
            stderr=StringIO(),
        )

    def test_seed_is_idempotent_and_respects_privacy_and_order(self):
        self.seed()
        self.seed()
        self.assertEqual(Video.objects.count(), 4)
        self.assertEqual(Profile.objects.count(), 1)
        self.assertEqual(Skill.objects.count(), 2)  # related rows replaced, not duplicated

        v1 = Video.objects.get(slug="video-01")
        self.assertEqual(v1.number, "01")
        self.assertEqual(v1.poster.name, "video-01/poster.jpg")
        self.assertEqual(v1.full.name, "")  # not on disk -> left blank
        self.assertFalse(Video.objects.get(slug="video-02").is_public)

        data = self.client.get("/api/videos/").json()
        self.assertEqual([v["id"] for v in data], ["video-03", "video-01", "video-04"])
        self.assertEqual(data[0]["title"], "Third")
        self.assertEqual(data[1]["poster"], "http://testserver/media/video-01/poster.jpg")

        profile = self.client.get("/api/profile/").json()
        self.assertEqual(profile["skills"], ["Editing", "Color"])
        self.assertEqual(profile["languages"], [{"name": "Tamil", "level": "Native"}])

    def test_reseed_keeps_admin_titles_but_resets_visibility(self):
        self.seed()
        Video.objects.filter(slug="video-01").update(title="Edited in admin", is_public=False)
        self.seed()
        v1 = Video.objects.get(slug="video-01")
        self.assertEqual(v1.title, "Edited in admin")
        self.assertTrue(v1.is_public)
