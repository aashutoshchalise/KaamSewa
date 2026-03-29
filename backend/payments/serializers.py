from rest_framework import serializers
from .models import Payment, WithdrawalRequest


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "booking",
            "client",
            "worker",
            "amount",
            "commission_amount",
            "worker_earning",
            "method",
            "status",
            "transaction_reference",
            "khalti_pidx",
            "created_at",
        ]


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = WithdrawalRequest
        fields = [
            "id",
            "worker",
            "amount",
            "status",
            "created_at",
        ]