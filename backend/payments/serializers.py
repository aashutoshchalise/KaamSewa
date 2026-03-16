from rest_framework import serializers
from .models import Payment


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
            "status",
            "transaction_reference",
            "created_at",
        ]