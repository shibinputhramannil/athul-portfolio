from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "Portfolio admin"
admin.site.site_title = "Portfolio admin"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("portfolio.urls")),
]

if settings.DEBUG:
    # Development only. In production serve media from a CDN / the static site
    # (point MEDIA_URL at it) -- see README "Production".
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
