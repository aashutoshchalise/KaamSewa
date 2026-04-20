from decimal import Decimal
import requests

from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.http import HttpResponseRedirect
from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from accounts.models import WorkerProfile
from .models import Payment, WithdrawalRequest
from .serializers import PaymentSerializer, WithdrawalRequestSerializer


KHALTI_SECRET_KEY = settings.KHALTI_SECRET_KEY

KHALTI_INITIATE_URL = "https://dev.khalti.com/api/v2/epayment/initiate/"
KHALTI_LOOKUP_URL = "https://dev.khalti.com/api/v2/epayment/lookup/"

KHALTI_WEBSITE_URL = "http://192.168.1.84:8081"


def verify_khalti_payment_and_update(payment: Payment):
    headers = {
        "Authorization": f"Key {KHALTI_SECRET_KEY}",
        "Content-Type": "application/json",
    }

    response = requests.post(
        KHALTI_LOOKUP_URL,
        json={"pidx": payment.khalti_pidx},
        headers=headers,
        timeout=20,
    )
    data = response.json()
    print("KHALTI VERIFY RESPONSE:", data)

    if response.status_code >= 400:
        return False, data

    if data.get("status") != "Completed":
        return False, data

    with transaction.atomic():
        payment = Payment.objects.select_for_update().get(pk=payment.pk)

        if payment.status == Payment.Status.PAID:
            return True, {"detail": "Already verified"}

        payment.method = Payment.Method.KHALTI
        payment.status = Payment.Status.PAID
        payment.transaction_reference = data.get("transaction_id", "")
        payment.paid_at = timezone.now()
        payment.commission_status = Payment.CommissionStatus.SETTLED
        payment.save(
            update_fields=[
                "method",
                "status",
                "transaction_reference",
                "paid_at",
                "commission_status",
            ]
        )

        if not payment.worker_wallet_credited:
            worker_profile = WorkerProfile.objects.select_for_update().get(
                user=payment.worker
            )

            worker_profile.total_earned += payment.worker_earning

            # Settle any admin commission still owed from earlier cash jobs
            # before adding the remaining Khalti amount to withdrawable balance.
            pending_due = worker_profile.pending_admin_commission or Decimal("0.00")
            settle_amount = min(pending_due, payment.worker_earning)
            credit_to_wallet = payment.worker_earning - settle_amount

            worker_profile.pending_admin_commission = pending_due - settle_amount
            worker_profile.available_balance += credit_to_wallet

            worker_profile.save(
                update_fields=[
                    "total_earned",
                    "available_balance",
                    "pending_admin_commission",
                ]
            )

            payment.worker_wallet_credited = True
            payment.save(update_fields=["worker_wallet_credited"])

        return True, {
            "detail": "Payment verified",
        }


class InitiateKhaltiPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, payment_id: int):
        payment = Payment.objects.filter(pk=payment_id).first()

        if not payment:
            return Response({"detail": "Payment not found."}, status=404)

        if payment.client_id != request.user.id:
            return Response({"detail": "Not your payment."}, status=403)

        if payment.status != Payment.Status.PENDING:
            return Response({"detail": "Already processed."}, status=400)

        payment.method = Payment.Method.KHALTI
        payment.save(update_fields=["method"])

        callback_url = f"http://192.168.1.84:8001/api/payments/{payment.id}/khalti/callback/"

        payload = {
            "return_url": callback_url,
            "website_url": KHALTI_WEBSITE_URL,
            "amount": int(Decimal(payment.amount) * 100),
            "purchase_order_id": str(payment.id),
            "purchase_order_name": f"Booking #{payment.booking_id}",
        }

        headers = {
            "Authorization": f"Key {KHALTI_SECRET_KEY}",
            "Content-Type": "application/json",
        }

        response = requests.post(KHALTI_INITIATE_URL, json=payload, headers=headers)
        data = response.json()

        print("KHALTI INITIATE RESPONSE:", data)

        payment.khalti_pidx = data.get("pidx")
        payment.save(update_fields=["khalti_pidx"])

        return Response(data)


class KhaltiPaymentCallbackView(APIView):
    permission_classes = []

    def get(self, request, payment_id: int):
        payment = Payment.objects.filter(pk=payment_id).first()

        if not payment:
            return Response({"detail": "Payment not found."}, status=404)

        try:
            success, data = verify_khalti_payment_and_update(payment)
            print("CALLBACK VERIFY:", success, data)
        except Exception as e:
            print("CALLBACK ERROR:", str(e))

        return HttpResponseRedirect("http://192.168.1.84:8081/(client)/bookings")


class PaymentDetailByBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id: int):
        payment = Payment.objects.filter(booking_id=booking_id).first()

        if not payment:
            return Response({"detail": "Payment not found."}, status=404)

        if payment.status == Payment.Status.PENDING and payment.khalti_pidx:
            try:
                success, data = verify_khalti_payment_and_update(payment)
                print("AUTO VERIFY:", success, data)
            except Exception as e:
                print("AUTO VERIFY ERROR:", str(e))

            payment.refresh_from_db()

        return Response(PaymentSerializer(payment).data)


class ConfirmPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, payment_id: int):
        payment = Payment.objects.filter(pk=payment_id).first()

        if not payment:
            return Response({"detail": "Payment not found."}, status=404)

        if payment.client_id != request.user.id:
            return Response({"detail": "Not your payment."}, status=403)

        if payment.status == Payment.Status.PAID:
            return Response({"detail": "Payment already processed."}, status=400)

        with transaction.atomic():
            payment = Payment.objects.select_for_update().get(pk=payment.pk)

            if payment.status == Payment.Status.PAID:
                return Response({"detail": "Payment already processed."}, status=400)

            payment.method = Payment.Method.CASH
            payment.status = Payment.Status.PAID
            payment.transaction_reference = f"CASH_{payment.id}"
            payment.paid_at = timezone.now()
            payment.commission_status = Payment.CommissionStatus.PENDING_SETTLEMENT
            payment.save(
                update_fields=[
                    "method",
                    "status",
                    "transaction_reference",
                    "paid_at",
                    "commission_status",
                ]
            )

            if not payment.worker_wallet_credited:
                worker_profile = WorkerProfile.objects.select_for_update().get(
                    user=payment.worker
                )

                # Cash in hand:
                # - worker earns worker_earning
                # - available balance does NOT increase
                # - admin commission becomes a pending due to be settled later
                worker_profile.total_earned += payment.worker_earning
                worker_profile.pending_admin_commission += payment.commission_amount
                worker_profile.save(
                    update_fields=["total_earned", "pending_admin_commission"]
                )

                payment.worker_wallet_credited = True
                payment.save(update_fields=["worker_wallet_credited"])

        return Response(
            {
                "detail": "Cash confirmed. Commission marked as pending admin settlement."
            }
        )


class WorkerWalletSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", "") != "WORKER":
            return Response({"detail": "Only workers can access wallet."}, status=403)

        worker_profile = WorkerProfile.objects.filter(user=request.user).first()
        if not worker_profile:
            return Response({"detail": "Worker profile not found."}, status=404)

        khalti_earnings = (
            Payment.objects.filter(
                worker=request.user,
                method=Payment.Method.KHALTI,
                status=Payment.Status.PAID,
            ).aggregate(total=Sum("worker_earning"))["total"]
            or Decimal("0.00")
        )

        cash_earnings = (
            Payment.objects.filter(
                worker=request.user,
                method=Payment.Method.CASH,
                status=Payment.Status.PAID,
            ).aggregate(total=Sum("worker_earning"))["total"]
            or Decimal("0.00")
        )

        total_earned = khalti_earnings + cash_earnings

        pending_withdrawals_total = (
            WithdrawalRequest.objects.filter(
                worker=request.user,
                status=WithdrawalRequest.Status.PENDING,
            ).aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )

        pending_withdrawals_count = WithdrawalRequest.objects.filter(
            worker=request.user,
            status=WithdrawalRequest.Status.PENDING,
        ).count()

        available_balance = worker_profile.available_balance
        pending_admin_commission = worker_profile.pending_admin_commission

        if worker_profile.total_earned != total_earned:
            worker_profile.total_earned = total_earned
            worker_profile.save(update_fields=["total_earned"])

        return Response(
            {
                "total_earned": total_earned,
                "available_balance": available_balance,
                "pending_withdrawals_total": pending_withdrawals_total,
                "pending_withdrawals_count": pending_withdrawals_count,
                "khalti_earnings": khalti_earnings,
                "cash_earnings": cash_earnings,
                "pending_admin_commission": pending_admin_commission,
            },
            status=status.HTTP_200_OK,
        )


class CreateWithdrawalRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        worker_profile = WorkerProfile.objects.filter(user=request.user).first()
        if not worker_profile:
            return Response({"detail": "Worker profile not found."}, status=404)

        amount = Decimal(str(request.data.get("amount", 0)))

        if amount <= 0:
            return Response({"detail": "Invalid amount"}, status=400)

        if amount > worker_profile.available_balance:
            return Response({"detail": "Insufficient balance"}, status=400)

        with transaction.atomic():
            worker_profile = WorkerProfile.objects.select_for_update().get(
                user=request.user
            )

            if amount > worker_profile.available_balance:
                return Response({"detail": "Insufficient balance"}, status=400)

            WithdrawalRequest.objects.create(
                worker=request.user,
                amount=amount,
            )

            worker_profile.available_balance -= amount
            worker_profile.save(update_fields=["available_balance"])

        return Response({"detail": "Withdrawal requested"})


class MyWithdrawalsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = WithdrawalRequest.objects.filter(worker=request.user).order_by("-created_at")
        return Response(WithdrawalRequestSerializer(qs, many=True).data)