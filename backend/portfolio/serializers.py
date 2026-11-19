from rest_framework import serializers

from .models import Education, Experience, Language, Profile, Video

# ---------------------------------------------------------------------------
# Videos
# ---------------------------------------------------------------------------

# Text fields where "" is sent to the client as null.
_NULLABLE_TEXT = ("number", "title", "client", "kind", "role", "year")


def _absolute_file_url(request, field_file) -> str | None:
    """Absolute URL for a FileField value, or None if unset or missing on disk."""
    if not field_file or not field_file.name:
        return None
    try:
        if not field_file.storage.exists(field_file.name):
            return None
        url = field_file.url
    except (OSError, ValueError):
        return None
    return request.build_absolute_uri(url) if request is not None else url


class VideoSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="slug")
    durationSec = serializers.FloatField(source="duration_sec", allow_null=True)
    poster = serializers.SerializerMethodField()
    preview = serializers.SerializerMethodField()
    full = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = [
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
        ]

    def _file(self, obj, name):
        return _absolute_file_url(self.context.get("request"), getattr(obj, name))

    def get_poster(self, obj):
        return self._file(obj, "poster")

    def get_preview(self, obj):
        return self._file(obj, "preview")

    def get_full(self, obj):
        return self._file(obj, "full")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for key in _NULLABLE_TEXT:
            if data.get(key) == "":
                data[key] = None
        return data


# ---------------------------------------------------------------------------
# Profile (same shape as src/content/profile.json)
# ---------------------------------------------------------------------------


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = ["company", "role", "period", "description"]


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ["qualification", "institution", "period"]


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ["name", "level"]


class ProfileSerializer(serializers.ModelSerializer):
    experience = ExperienceSerializer(many=True, read_only=True)
    skills = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    tools = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    education = EducationSerializer(many=True, read_only=True)
    languages = LanguageSerializer(many=True, read_only=True)

    class Meta:
        model = Profile
        fields = [
            "name",
            "role",
            "email",
            "location",
            "summary",
            "experience",
            "skills",
            "tools",
            "education",
            "languages",
        ]


# ---------------------------------------------------------------------------
# Contact form
# ---------------------------------------------------------------------------


class ContactSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=1, max_length=120)
    email = serializers.EmailField(max_length=254)
    message = serializers.CharField(min_length=10, max_length=5000)
    project = serializers.CharField(required=False, allow_blank=True, max_length=200, default="")
    # Honeypot: real visitors never see or fill this field.
    website = serializers.CharField(required=False, allow_blank=True, default="")
