from django.contrib import admin

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


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("number", "slug", "title", "is_public", "duration", "order")
    list_display_links = ("number", "slug")
    list_editable = ("is_public", "order")
    list_filter = ("is_public", "kind")
    search_fields = ("slug", "title", "client")
    readonly_fields = ("created_at", "updated_at")
    actions = ("make_public", "make_private")
    fieldsets = (
        (None, {"fields": ("slug", "number", "is_public", "order")}),
        ("Details", {"fields": ("title", "client", "kind", "role", "year", "duration_sec")}),
        ("Files", {"fields": ("poster", "preview", "full")}),
        ("Timestamps", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )

    @admin.display(description="Duration", ordering="duration_sec")
    def duration(self, obj):
        if obj.duration_sec is None:
            return "-"
        minutes, seconds = divmod(round(obj.duration_sec), 60)
        return f"{minutes}:{seconds:02d}"

    @admin.action(description="Mark selected videos as public")
    def make_public(self, request, queryset):
        updated = queryset.update(is_public=True)
        self.message_user(request, f"{updated} video(s) marked public.")

    @admin.action(description="Mark selected videos as private")
    def make_private(self, request, queryset):
        updated = queryset.update(is_public=False)
        self.message_user(request, f"{updated} video(s) marked private.")


class ExperienceInline(admin.StackedInline):
    model = Experience
    extra = 0
    fields = ("order", "company", "role", "period", "description")


class EducationInline(admin.TabularInline):
    model = Education
    extra = 0
    fields = ("order", "qualification", "institution", "period")


class SkillInline(admin.TabularInline):
    model = Skill
    extra = 0
    fields = ("order", "name")


class ToolInline(admin.TabularInline):
    model = Tool
    extra = 0
    fields = ("order", "name")


class LanguageInline(admin.TabularInline):
    model = Language
    extra = 0
    fields = ("order", "name", "level")


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "role", "email", "location")
    inlines = (ExperienceInline, SkillInline, ToolInline, EducationInline, LanguageInline)

    def has_add_permission(self, request):
        # Singleton: allow creating the profile only if it doesn't exist yet.
        return not Profile.objects.exists() and super().has_add_permission(request)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("created_at", "name", "email", "project", "handled")
    list_filter = ("handled",)
    list_editable = ("handled",)
    search_fields = ("name", "email", "project", "message")
    date_hierarchy = "created_at"
    ordering = ("-created_at",)
    readonly_fields = ("name", "email", "project", "message", "created_at", "ip")
    fields = ("name", "email", "project", "message", "created_at", "ip", "handled")

    def has_add_permission(self, request):
        # Messages only come in through the contact form.
        return False
