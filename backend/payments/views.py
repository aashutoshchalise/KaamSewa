from decimal import Decimal
from django.db import transaction
from django.shortcuts import redirect
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from accounts.models import WorkerProfile
from .models import Payment, WithdrawalRequest
from .serializers import PaymentSerializer, WithdrawalRequestSerializer

import requests

from django.conf import settings

KHALTI_SECRET_KEY = settings.KHALTI_SECRET_KEY

KHALTI_INITIATE_URL = "https://dev.khalti.com/api/v2/epayment/initiate/"
KHALTI_LOOKUP_URL = "https://dev.khalti.com/api/v2/epayment/lookup/"


KHALTI_RETURN_URL = "http://192.168.1.84:8081"
KHALTI_WEBSITE_URL = "http://192.168.1.84:8081"

class InitiateKhaltiPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, payment_id: int):
        payment = Payment.objects.filter(pk=payment_id).first()

        if not payment:
            return Response({"detail": "Payment not found."}, status=404)

        if payment.client_id != request.user.id:
            return Response({"detail": "Not your payment."}, status=403)

        if payment.status != Payment.Status.PENDING:
            return Response({"detail": "Payment already processed."}, status=400)

        payment.method = Payment.Method.KHALTI
        payment.save(update_fields=["method"])

        payload = {
            "return_url": f"{KHALTI_RETURN_URL}?payment_id={payment.id}",
            "website_url": KHALTI_WEBSITE_URL,
            "amount": int(Decimal(payment.amount) * 100),
            "purchase_order_id": str(payment.id),
            "purchase_order_name": f"Booking #{payment.booking_id}",
        }

        headers = {
            "Authorization": f"Key {KHALTI_SECRET_KEY}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(
                KHALTI_INITIATE_URL,
                json=payload,
                headers=headers,
                timeout=20,
            )
            data = response.json()
            print("KHALTI INITIATE RESPONSE:", data)
        except Exception as e:
            return Response({"detail": str(e)}, status=500)

        if response.status_code >= 400:
            return Response({"detail": data}, status=response.status_code)

        if "pidx" not in data:
            return Response({"detail": data}, status=400)

        payment.khalti_pidx = data["pidx"]
        payment.save(update_fields=["khalti_pidx"])

        return Response(
            {
                "payment_url": data["payment_url"],
                "pidx": data["pidx"],
            },
            status=200,
        )

class PaymentDetailByBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id: int):
        payment = (
            Payment.objects.select_related("booking")
            .filter(booking_id=booking_id)
            .first()
        )

        if not payment:
            return Response({"detail": "Payment not found."}, status=404)

        if payment.client_id != request.user.id and payment.worker_id != request.user.id:
            return Response({"detail": "Not your payment."}, status=403)

        return Response(PaymentSerializer(payment).data, status=200)


from django.utils import timezone

class VerifyKhaltiPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, payment_id: int):
        payment = Payment.objects.filter(pk=payment_id).first()

        if not payment:
            return Response({"detail": "Payment not found."}, status=404)

        if payment.client_id != request.user.id:
            return Response({"detail": "Not your payment."}, status=403)

        if payment.status == Payment.Status.PAID:
            return Response(
                {
                    "detail": "Payment already verified",
                    "transaction_reference": payment.transaction_reference,
                },
                status=200,
            )

        if not payment.khalti_pidx:
            return Response({"detail": "No Khalti session found."}, status=400)

        headers = {
            "Authorization": f"Key {KHALTI_SECRET_KEY}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(
                KHALTI_LOOKUP_URL,
                json={"pidx": payment.khalti_pidx},
                headers=headers,
                timeout=20,
            )
            data = response.json()
            print("KHALTI VERIFY RESPONSE:", data)
        except Exception as e:
            return Response({"detail": str(e)}, status=500)

        if response.status_code >= 400:
            return Response({"detail": data}, status=response.status_code)

        if data.get("status") != "Completed":
            return Response(
                {
                    "detail": "Payment not completed yet.",
                    "khalti_response": data,
                },
                status=400,
            )

        with transaction.atomic():
            payment = Payment.objects.select_for_update().get(pk=payment.pk)

            if payment.status == Payment.Status.PAID:
                return Response(
                    {
                        "detail": "Payment already verified",
                        "transaction_reference": payment.transaction_reference,
                    },
                    status=200,
                )

            payment.method = Payment.Method.KHALTI
            payment.status = Payment.Status.PAID
            payment.transaction_reference = (
                data.get("transaction_id")
                or data.get("idx")
                or payment.transaction_reference
                or ""
            )
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
                worker_profile.available_balance += payment.worker_earning
                worker_profile.save(update_fields=["total_earned", "available_balance"])

                payment.worker_wallet_credited = True
                payment.save(update_fields=["worker_wallet_credited"])

        return Response(
            {
                "detail": "Khalti payment verified successfully.",
                "transaction_reference": payment.transaction_reference,
            },
            status=200,
        )


from django.utils import timezone

class ConfirmPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, payment_id: int):
        payment = Payment.objects.select_related("booking").filter(pk=payment_id).first()

        if not payment:
            return Response({"detail": "Payment not found."}, status=404)

        if payment.client_id != request.user.id:
            return Response({"detail": "Not your payment."}, status=403)

        if payment.status != Payment.Status.PENDING:
            return Response({"detail": "Payment already processed."}, status=400)

        with transaction.atomic():
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

            worker_profile = WorkerProfile.objects.select_for_update().get(
                user=payment.worker
            )

            worker_profile.total_earned += payment.worker_earning
            worker_profile.save(update_fields=["total_earned"])

        return Response(
            {
                "detail": "Cash payment confirmed. Worker wallet not credited because payment was made directly in cash."
            },
            status=200,
        )


class WorkerWalletSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", "") != "WORKER":
            return Response({"detail": "Only workers can access wallet."}, status=403)

        worker_profile = WorkerProfile.objects.filter(user=request.user).first()
        if not worker_profile:
            return Response({"detail": "Worker profile not found."}, status=404)

        pending_withdrawals = (
            WithdrawalRequest.objects.filter(
                worker=request.user,
                status=WithdrawalRequest.Status.PENDING,
            )
            .order_by("-created_at")
        )

        total_pending_withdrawals = sum(
            [item.amount for item in pending_withdrawals],
            Decimal("0.00"),
        )

        return Response(
            {
                "total_earned": worker_profile.total_earned,
                "available_balance": worker_profile.available_balance,
                "pending_withdrawals_total": total_pending_withdrawals,
                "pending_withdrawals_count": pending_withdrawals.count(),
            },
            status=status.HTTP_200_OK,
        )


class CreateWithdrawalRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        worker_profile = WorkerProfile.objects.get(user=request.user)

        amount = Decimal(request.data.get("amount", 0))

        if amount <= 0:
            return Response({"detail": "Invalid amount"}, status=400)

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


class UpdateWithdrawalStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, withdrawal_id: int):
        if getattr(request.user, "role", "") != "ADMIN":
            return Response({"detail": "Only admin can update withdrawals."}, status=403)

        withdrawal = WithdrawalRequest.objects.filter(id=withdrawal_id).first()
        if not withdrawal:
            return Response({"detail": "Withdrawal not found."}, status=404)

        new_status = request.data.get("status")

        if new_status not in [
            WithdrawalRequest.Status.APPROVED,
            WithdrawalRequest.Status.REJECTED,
        ]:
            return Response({"detail": "Invalid status."}, status=400)

        if withdrawal.status != WithdrawalRequest.Status.PENDING:
            return Response({"detail": "Withdrawal already processed."}, status=400)

        with transaction.atomic():
            withdrawal.status = new_status
            withdrawal.save(update_fields=["status"])

            if new_status == WithdrawalRequest.Status.REJECTED:
                worker_profile = WorkerProfile.objects.select_for_update().get(
                    user=withdrawal.worker
                )
                worker_profile.available_balance += withdrawal.amount
                worker_profile.save(update_fields=["available_balance"])

        return Response({"detail": f"Withdrawal {new_status.lower()}."}, status=200)