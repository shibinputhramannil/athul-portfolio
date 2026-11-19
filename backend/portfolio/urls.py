from django.urls import path

from . import views

app_name = "portfolio"

urlpatterns = [
    path("health/", views.HealthView.as_view(), name="health"),
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("videos/", views.VideoListView.as_view(), name="video-list"),
    path("videos/<slug:slug>/", views.VideoDetailView.as_view(), name="video-detail"),
    path("contact/", views.ContactView.as_view(), name="contact"),
]
