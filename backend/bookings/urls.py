from django.urls import path
from .views import (
    CreateBookingView,
    MyBookingsView,
    AvailableBookingsForWorkerView,
    ClaimBookingView,
    CreateNegotiationView,
    AcceptNegotiationView,
    UpdateBookingStatusView,
    BookingEventsView,
    StartJobView,
    CompleteJobView,
)

urlpatterns = [
    # =========================
    # Booking creation & listing
    # =========================
    path("create/", CreateBookingView.as_view(), name="booking-create"),
    path("my/", MyBookingsView.as_view(), name="booking-my"),
    path("available/", AvailableBookingsForWorkerView.as_view(), name="booking-available"),

    # =========================
    # Worker claims booking (locks it)
    # =========================
    path("<int:pk>/claim/", ClaimBookingView.as_view(), name="booking-claim"),

    # =========================
    # Negotiation
    # =========================
    path("<int:pk>/negotiate/", CreateNegotiationView.as_view(), name="booking-negotiate"),
    path(
        "negotiation/<int:negotiation_id>/accept/",
        AcceptNegotiationView.as_view(),
        name="negotiation-accept",
    ),

    # =========================
    # Worker lifecycle
    # =========================
    path("<int:pk>/start/", StartJobView.as_view(), name="booking-start"),
    path("<int:pk>/complete/", CompleteJobView.as_view(), name="booking-complete"),

    # =========================
    # Status update (admin/client cancel)
    # =========================
    path("<int:pk>/status/", UpdateBookingStatusView.as_view(), name="booking-status"),

    # =========================
    # Timeline / Event history
    # =========================
    path("<int:pk>/events/", BookingEventsView.as_view(), name="booking-events"),
]