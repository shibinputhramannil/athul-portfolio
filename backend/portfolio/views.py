import ipaddress
import logging

from django.conf import settings
from django.core.mail import EmailMessage
from django.http import Http404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import ContactMessage, Profile, Video
from .serializers import ContactSerializer, ProfileSerializer, VideoSerializer

logger = logging.getLogger(__name__)


class HealthView(APIView):
    def get(self, request):
        return Response({"ok": True})


class ProfileView(generics.RetrieveAPIView):
    serializer_class = ProfileSerializer

    def get_object(self):
        profile = (
            Profile.objects.prefetch_related(
                "experience", "skills", "tools", "education", "languages"
            )
            .filter(pk=1)
            .first()
        )
        if profile is None:
            raise Http404("No profile has been created yet.")
        return profile


class PublicVideoMixin:
    serializer_class = VideoSerializer

    def get_queryset(self):
        # PRIVACY: private videos must never appear in any response.
        return Video.objects.filter(is_public=True).order_by("order", "number")


class VideoListView(PublicVideoMixin, generics.ListAPIView):
    pagination_class = None


class VideoDetailView(PublicVideoMixin, generics.RetrieveAPIView):
    lookup_field = "slug"


def _client_ip(request, throttle) -> str | None:
    ident = throttle.get_ident(request) or ""
    try:
        return str(ipaddress.ip_address(ident.strip()))
    except ValueError:
        return None


def _notify(contact: ContactMessage) -> None:
    """Email CONTACT_NOTIFY_EMAIL about a new message. Never raises."""
    recipient = settings.CONTACT_NOTIFY_EMAIL
    if not recipient:
        return
    name = " ".join(contact.name.split())  # no newlines in the subject header
    body = (
        f"Name: {contact.name}\n"
        f"Email: {contact.email}\n"
        f"Project: {contact.project or '-'}\n"
        f"Received: {contact.created_at:%Y-%m-%d %H:%M %Z}\n\n"
        f"{contact.message}\n"
    )
    try:
        EmailMessage(
            subject=f"Portfolio contact from {name}",
            body=body,
            to=[recipient],
            reply_to=[contact.email],
        ).send()
    except Exception:
        logger.exception("Could not send contact notification email")


class ContactView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"

    def post(self, request):
        data = request.data
        # Honeypot: pretend success for bots and store nothing.
        if hasattr(data, "get") and str(data.get("website") or "").strip():
            return Response({"ok": True}, status=status.HTTP_201_CREATED)

        serializer = ContactSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data

        contact = ContactMessage.objects.create(
            name=values["name"],
            email=values["email"],
            project=values.get("project", ""),
            message=values["message"],
            ip=_client_ip(request, ScopedRateThrottle()),
        )
        _notify(contact)
        return Response({"ok": True}, status=status.HTTP_201_CREATED)
