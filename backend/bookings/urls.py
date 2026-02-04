from django.urls import path
from .views import (
    CreateBookingView,
    MyBookingsView,
    AvailableBookingsForWorkerView,
    AcceptBookingView,
    UpdateBookingStatusView,
)

urlpatterns = [
    path("create/", CreateBookingView.as_view(), name="booking-create"),
    path("my/", MyBookingsView.as_view(), name="booking-my"),
    path("available/", AvailableBookingsForWorkerView.as_view(), name="booking-available"),
    path("<int:pk>/accept/", AcceptBookingView.as_view(), name="booking-accept"),
    path("<int:pk>/status/", UpdateBookingStatusView.as_view(), name="booking-status"),
]