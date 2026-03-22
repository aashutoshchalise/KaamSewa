from django.urls import path
from .views import PaymentDetailByBookingView, ConfirmPaymentView

urlpatterns = [
    path("booking/<int:booking_id>/", PaymentDetailByBookingView.as_view()),
    path("<int:payment_id>/confirm/", ConfirmPaymentView.as_view()),
]