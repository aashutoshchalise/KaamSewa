from rest_framework import serializers
from .models import Booking


class BookingListSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)
    service_price = serializers.DecimalField(source="service.base_price", max_digits=10, decimal_places=2, read_only=True)
    service_pricing_unit = serializers.CharField(source="service.pricing_unit", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "client",
            "worker",
            "service",
            "service_name",
            "service_price",
            "service_pricing_unit",
            "address",
            "notes",
            "scheduled_at",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "client", "worker", "status", "created_at", "updated_at"]


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["service", "address", "notes", "scheduled_at"]

    def create(self, validated_data):
        request = self.context["request"]
        return Booking.objects.create(
            client=request.user,
            status=Booking.Status.PENDING,
            **validated_data,
        )


class BookingStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["status"]

    def validate_status(self, value):
        allowed = {c[0] for c in Booking.Status.choices}
        if value not in allowed:
            raise serializers.ValidationError("Invalid status.")
        return value