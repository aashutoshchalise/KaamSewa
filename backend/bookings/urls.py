from django.urls import path
from .views import (
    CreateBookingView,
    MyBookingsView,
    AvailableBookingsForWorkerView,
    ClaimBookingView,
    StartJobView,
    CompleteJobView,
    CancelBookingView,
    BookingMessagesView,
    SendBookingMessageView,
    BookingDetailView,
    create_negotiation,
)

urlpatterns = [
    path("create/", CreateBookingView.as_view(), name="booking-create"),
    path("my/", MyBookingsView.as_view(), name="my-bookings"),
    path("available/", AvailableBookingsForWorkerView.as_view(), name="available-bookings"),
    path("<int:pk>/claim/", ClaimBookingView.as_view(), name="booking-claim"),
    path("<int:pk>/start/", StartJobView.as_view(), name="booking-start"),
    path("<int:pk>/complete/", CompleteJobView.as_view(), name="booking-complete"),
    path("<int:pk>/cancel/", CancelBookingView.as_view(), name="booking-cancel"),
    path("<int:booking_id>/negotiate/", create_negotiation, name="booking-negotiate"),
    path("<int:pk>/messages/", BookingMessagesView.as_view(), name="booking-messages"),
    path("<int:pk>/messages/send/", SendBookingMessageView.as_view(), name="booking-send-message"),
    path("<int:pk>/", BookingDetailView.as_view(), name="booking-detail"),
]