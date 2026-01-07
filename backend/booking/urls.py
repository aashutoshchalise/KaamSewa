from django.urls import path
from .views import BookingCreateView, MyBookingsView, AllBookingsView, AcceptBookingView

urlpatterns = [
    path("create/", BookingCreateView.as_view(), name="create-booking"),
    path("my/", MyBookingsView.as_view(), name="my-bookings"),
    path("<int:pk>/accept/", AcceptBookingView.as_view()),
    path("all/", AllBookingsView.as_view(), name="all-bookings"),
]