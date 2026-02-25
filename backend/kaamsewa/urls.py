from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),  
    path("api/services/", include("services.urls")),
    path("api/bookings/", include("bookings.urls")), 
    path("api/reviews/", include("reviews.urls")),
    path("api/payments/", include("payments.urls")),
]