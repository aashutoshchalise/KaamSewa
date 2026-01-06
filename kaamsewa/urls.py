from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # Phase 1 routes
    path("api/", include("accounts.urls")),
    path("api/services/", include("services.urls")),

    # TEMP: disable old apps until we migrate their logic
    # path("users/", include("users.urls")),
    # path("services/", include("service_app.urls")),
    # path("booking/", include("booking.urls")),
]