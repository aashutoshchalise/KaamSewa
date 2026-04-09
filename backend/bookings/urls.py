from django.urls import path
from .views import (
    CreateBookingView,
    MyBookingsView,
    AvailableBookingsForWorkerView,
    ClaimBookingView,
    StartJobView,
    CompleteJobView,
    CancelBookingView,
)

urlpatterns = [
    path("create/", CreateBookingView.as_view()),
    path("my/", MyBookingsView.as_view()),
    path("available/", AvailableBookingsForWorkerView.as_view()),
    path("<int:pk>/claim/", ClaimBookingView.as_view()),
    path("<int:pk>/start/", StartJobView.as_view()),
    path("<int:pk>/complete/", CompleteJobView.as_view()),
    path("<int:pk>/cancel/", CancelBookingView.as_view(), name="booking-cancel"),
]