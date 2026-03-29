from django.urls import path
from .views import (
    PaymentDetailByBookingView,
    ConfirmPaymentView,
    InitiateKhaltiPaymentView,
    VerifyKhaltiPaymentView,
    CreateWithdrawalRequestView,
    MyWithdrawalsView,
    WorkerWalletSummaryView,
)

urlpatterns = [
    path("booking/<int:booking_id>/", PaymentDetailByBookingView.as_view()),
    path("<int:payment_id>/confirm/", ConfirmPaymentView.as_view()),
    path("<int:payment_id>/khalti/initiate/", InitiateKhaltiPaymentView.as_view()),
    path("<int:payment_id>/khalti/verify/", VerifyKhaltiPaymentView.as_view()),
    path("withdraw/", CreateWithdrawalRequestView.as_view()),
    path("withdraw/my/", MyWithdrawalsView.as_view()),
    path("wallet/summary/", WorkerWalletSummaryView.as_view()),
]