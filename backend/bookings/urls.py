from django.urls import path
from .views import (
    CreateBookingView,
    MyBookingsView,
    AvailableBookingsForWorkerView,
    ClaimBookingView,
    SendNegotiationView,
    AcceptNegotiationView,
    UpdateBookingStatusView,
)

urlpatterns = [
    # Create
    path("create/", CreateBookingView.as_view(), name="booking-create"),

    # My bookings (role based)
    path("my/", MyBookingsView.as_view(), name="booking-my"),

    # Worker available jobs
    path("available/", AvailableBookingsForWorkerView.as_view(), name="booking-available"),

    # Worker claims booking
    path("<int:pk>/claim/", ClaimBookingView.as_view(), name="booking-claim"),

    # Negotiation
    path("<int:pk>/negotiate/", SendNegotiationView.as_view(), name="booking-negotiate"),

    # Client accepts negotiated price
    path("<int:pk>/accept-final/", AcceptNegotiationView.as_view(), name="booking-accept-final"),

    # Status update
    path("<int:pk>/status/", UpdateBookingStatusView.as_view(), name="booking-status"),
]