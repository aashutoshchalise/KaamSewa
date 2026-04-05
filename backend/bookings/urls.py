from django.urls import path
from .views import (
    CreateBookingView,
    MyBookingsView,
    AvailableBookingsForWorkerView,
    ClaimBookingView,
    StartJobView,
    CompleteJobView,
)

urlpatterns = [
    path("create/", CreateBookingView.as_view()),
    path("my/", MyBookingsView.as_view()),
    path("available/", AvailableBookingsForWorkerView.as_view()),
    path("<int:pk>/claim/", ClaimBookingView.as_view()),
    path("<int:pk>/start/", StartJobView.as_view()),
    path("<int:pk>/complete/", CompleteJobView.as_view()),
]