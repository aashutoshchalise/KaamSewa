from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction
from decimal import Decimal

from .models import Payment
from accounts.models import WorkerProfile


class ConfirmPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, payment_id: int):
        payment = Payment.objects.select_related("booking").filter(pk=payment_id).first()

        if not payment:
            return Response({"detail": "Payment not found."}, status=404)

        # Only client who owns booking can confirm payment
        if payment.client_id != request.user.id:
            return Response({"detail": "Not your payment."}, status=403)

        if payment.status != Payment.Status.PENDING:
            return Response({"detail": "Payment already processed."}, status=400)

        with transaction.atomic():

            payment.status = Payment.Status.PAID
            payment.transaction_reference = "MOCK_TXN_" + str(payment.id)
            payment.save(update_fields=["status", "transaction_reference"])

            # Update worker wallet
            worker_profile = WorkerProfile.objects.select_for_update().get(
                user=payment.worker
            )

            worker_profile.total_earned += payment.worker_earning
            worker_profile.available_balance += payment.worker_earning
            worker_profile.save(update_fields=["total_earned", "available_balance"])

        return Response({"detail": "Payment confirmed and wallet updated."}, status=200)