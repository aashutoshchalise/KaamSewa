from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework import status

from accounts.models import WorkerProfile
from .models import Payment
from .serializers import PaymentSerializer

from .models import WithdrawalRequest
from .serializers import WithdrawalRequestSerializer
from accounts.models import WorkerProfile
from decimal import Decimal

import requests


KHALTI_SECRET_KEY = "4551fee3f61e4fd293bb998d56933343"
KHALTI_INITIATE_URL = "https://dev.khalti.com/api/v2/epayment/initiate/"
KHALTI_LOOKUP_URL = "https://dev.khalti.com/api/v2/epayment/lookup/"
KHALTI_RETURN_URL = "exp://192.168.1.75:8081/--/(client)/payment-success"
KHALTI_WEBSITE_URL = "http://192.168.1.75:8081"


class PaymentDetailByBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id: int):
        payment = Payment.objects.select_related("booking").filter(booking_id=booking_id).first()

        if not payment:
            return Response({"detail": "Payment not found."}, status=404)

        if payment.client_id != request.user.id and payment.worker_id != request.user.id:
            return Response({"detail": "Not your payment."}, status=403)

        return Response(PaymentSerializer(payment).data, status=200)


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

        payload = {
            "return_url": f"kaamsewa://payment-success?payment_id={payment.id}",
            "website_url": "http://localhost:8001",
            "amount": int(float(payment.amount) * 100),
            "purchase_order_id": str(payment.id),
            "purchase_order_name": f"Booking #{payment.id}",
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
            [item.amount for item in pending_withdrawals], Decimal("0.00")
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



class VerifyKhaltiPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, payment_id: int):
        payment = Payment.objects.filter(pk=payment_id).first()

        if not payment:
            return Response({"detail": "Payment not found."}, status=404)

        if payment.client_id != request.user.id:
            return Response({"detail": "Not your payment."}, status=403)

        if not payment.khalti_pidx:
            return Response({"detail": "No Khalti session."}, status=400)

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
        except Exception as e:
            return Response({"detail": str(e)}, status=500)

        if response.status_code >= 400:
            return Response({"detail": data}, status=response.status_code)

        if data.get("status") != "Completed":
            return Response(
                {
                    "detail": "Payment not completed",
                    "khalti_response": data,
                },
                status=400,
            )

        with transaction.atomic():
            payment.status = Payment.Status.PAID
            payment.transaction_reference = data.get("transaction_id") or ""
            payment.save(update_fields=["status", "transaction_reference"])

            worker_profile = WorkerProfile.objects.select_for_update().get(
                user=payment.worker
            )
            worker_profile.total_earned += payment.worker_earning
            worker_profile.available_balance += payment.worker_earning
            worker_profile.save(update_fields=["total_earned", "available_balance"])

        return Response(
            {
                "detail": "Payment verified",
                "transaction_reference": payment.transaction_reference,
            },
            status=200,
        )


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
            payment.status = Payment.Status.PAID
            payment.transaction_reference = "MOCK_TXN_" + str(payment.id)
            payment.save(update_fields=["status", "transaction_reference"])

            worker_profile = WorkerProfile.objects.select_for_update().get(
                user=payment.worker
            )
            worker_profile.total_earned += payment.worker_earning
            worker_profile.available_balance += payment.worker_earning
            worker_profile.save(update_fields=["total_earned", "available_balance"])

        return Response({"detail": "Payment confirmed and wallet updated."}, status=200)


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
        worker_profile.save()

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