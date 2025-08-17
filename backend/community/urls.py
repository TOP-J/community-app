from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    # Local apps
    path("api/", include("accounts.urls")),
    path("api/", include("core.urls")),
    # Djoser user endpoints (add these)
    path("api/users/", include("djoser.urls")),
    path(
        "api/users/", include("djoser.urls.authtoken")
    ),  # Only if using TokenAuthentication
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
