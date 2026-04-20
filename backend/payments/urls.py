from django.urls import path
from .views import (
    PaymentDetailByBookingView,
    ConfirmPaymentView,
    InitiateKhaltiPaymentView,
    KhaltiPaymentCallbackView,
    WorkerWalletSummaryView,
    CreateWithdrawalRequestView,
    MyWithdrawalsView,
)

urlpatterns = [
    path("booking/<int:booking_id>/", PaymentDetailByBookingView.as_view()),
    path("<int:payment_id>/confirm/", ConfirmPaymentView.as_view()),
    path("<int:payment_id>/khalti/initiate/", InitiateKhaltiPaymentView.as_view()),
    path("<int:payment_id>/khalti/callback/", KhaltiPaymentCallbackView.as_view()),
    path("wallet/summary/", WorkerWalletSummaryView.as_view()),
    path("withdraw/", CreateWithdrawalRequestView.as_view()),
    path("withdraw/my/", MyWithdrawalsView.as_view()),
]