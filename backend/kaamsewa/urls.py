from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),  # if you have this
    path("api/services/", include("services.urls")),
    path("api/bookings/", include("bookings.urls")),  # ✅ IMPORTANT
]