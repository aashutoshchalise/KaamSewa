from django.urls import path
from .views import ConfirmPaymentView

urlpatterns = [
    path("<int:payment_id>/confirm/", ConfirmPaymentView.as_view()),
]