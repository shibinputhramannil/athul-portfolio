from django.db import models


def video_upload_to(instance: "Video", filename: str) -> str:
    """Store files as <slug>/<filename>, matching public/media/<id>/... ."""
    return f"{instance.slug}/{filename}"


class Video(models.Model):
    class Kind(models.TextChoices):
        CLIENT = "client", "Client"
        PRACTICE = "practice", "Practice"

    slug = models.SlugField(
        max_length=64, unique=True, help_text='Stable id used by the site, e.g. "video-01".'
    )
    number = models.CharField(max_length=8, blank=True, help_text='Display number, e.g. "01".')
    title = models.CharField(max_length=200, blank=True)
    client = models.CharField(max_length=200, blank=True)
    role = models.CharField(max_length=200, blank=True)
    year = models.CharField(max_length=16, blank=True)
    kind = models.CharField(max_length=16, choices=Kind.choices, blank=True)
    duration_sec = models.FloatField(null=True, blank=True)
    is_public = models.BooleanField(
        default=False,
        help_text="Only public videos are returned by the API. Private videos never leave the admin.",
    )
    order = models.PositiveIntegerField(default=0, help_text="Display order (lower first).")
    poster = models.FileField(upload_to=video_upload_to, blank=True, max_length=255)
    preview = models.FileField(upload_to=video_upload_to, blank=True, max_length=255)
    full = models.FileField(upload_to=video_upload_to, blank=True, max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "number"]

    def __str__(self) -> str:
        label = self.title or self.slug
        return f"{self.number} {label}".strip()


class Profile(models.Model):
    """Singleton: there is only ever one row (pk=1)."""

    name = models.CharField(max_length=120)
    role = models.CharField(max_length=120, blank=True)
    email = models.EmailField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    summary = models.TextField(blank=True)

    class Meta:
        verbose_name = "profile"
        verbose_name_plural = "profile"

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls) -> "Profile | None":
        return cls.objects.filter(pk=1).first()


class Experience(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="experience")
    company = models.CharField(max_length=200)
    role = models.CharField(max_length=200, blank=True)
    period = models.CharField(max_length=60, blank=True)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name_plural = "experience"

    def __str__(self) -> str:
        return f"{self.role} at {self.company}"


class Education(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="education")
    qualification = models.CharField(max_length=200)
    institution = models.CharField(max_length=200, blank=True)
    period = models.CharField(max_length=60, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name_plural = "education"

    def __str__(self) -> str:
        return self.qualification


class Skill(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="skills")
    name = models.CharField(max_length=120)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return self.name


class Tool(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="tools")
    name = models.CharField(max_length=120)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return self.name


class Language(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="languages")
    name = models.CharField(max_length=60)
    level = models.CharField(max_length=120, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return self.name


class ContactMessage(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField()
    project = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    handled = models.BooleanField(default=False)
    ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} <{self.email}>"
