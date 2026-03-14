from rest_framework import serializers
from .models import Booking, BookingNegotiation, BookingEvent


class BookingListSerializer(serializers.ModelSerializer):
    service_name = serializers.SerializerMethodField()
    service_price = serializers.SerializerMethodField()
    service_pricing_unit = serializers.SerializerMethodField()
    package_name = serializers.CharField(source="package.name", read_only=True)

    # latest negotiation info
    negotiation_id = serializers.SerializerMethodField()
    negotiated_price = serializers.SerializerMethodField()
    negotiation_message = serializers.SerializerMethodField()
    negotiation_status = serializers.SerializerMethodField()
    negotiation_proposed_by = serializers.SerializerMethodField()
    negotiation_proposed_by_username = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id",
            "client",
            "worker",
            "service",
            "package",
            "service_name",
            "package_name",
            "service_price",
            "service_pricing_unit",
            "address",
            "notes",
            "scheduled_at",
            "final_price",
            "status",
            "negotiation_id",
            "negotiated_price",
            "negotiation_message",
            "negotiation_status",
            "negotiation_proposed_by",
            "negotiation_proposed_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "client",
            "worker",
            "status",
            "created_at",
            "updated_at",
        ]

    def _latest_negotiation(self, obj):
        return (
            obj.negotiations.order_by("-created_at").first()
            if hasattr(obj, "negotiations")
            else BookingNegotiation.objects.filter(booking=obj).order_by("-created_at").first()
        )

    def get_service_name(self, obj):
        if obj.service_id:
            return obj.service.name
        return None

    def get_service_price(self, obj):
        if obj.service_id:
            return str(obj.service.base_price)
        return None

    def get_service_pricing_unit(self, obj):
        if obj.service_id:
            return obj.service.pricing_unit
        return None

    def get_negotiation_id(self, obj):
        negotiation = self._latest_negotiation(obj)
        return negotiation.id if negotiation else None

    def get_negotiated_price(self, obj):
        negotiation = self._latest_negotiation(obj)
        return str(negotiation.proposed_price) if negotiation else None

    def get_negotiation_message(self, obj):
        negotiation = self._latest_negotiation(obj)
        return negotiation.message if negotiation else None

    def get_negotiation_status(self, obj):
        negotiation = self._latest_negotiation(obj)
        return negotiation.status if negotiation else None

    def get_negotiation_proposed_by(self, obj):
        negotiation = self._latest_negotiation(obj)
        return negotiation.proposed_by_id if negotiation else None

    def get_negotiation_proposed_by_username(self, obj):
        negotiation = self._latest_negotiation(obj)
        return negotiation.proposed_by.username if negotiation and negotiation.proposed_by else None


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["service", "package", "address", "notes", "scheduled_at"]

    def validate(self, attrs):
        service = attrs.get("service")
        package = attrs.get("package")
        if not service and not package:
            raise serializers.ValidationError("Either 'service' or 'package' is required.")
        if service and package:
            raise serializers.ValidationError("Provide only one: 'service' OR 'package', not both.")
        return attrs

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


class BookingNegotiationSerializer(serializers.ModelSerializer):
    proposed_by_username = serializers.CharField(source="proposed_by.username", read_only=True)

    class Meta:
        model = BookingNegotiation
        fields = [
            "id",
            "booking",
            "proposed_price",
            "message",
            "status",
            "proposed_by",
            "proposed_by_username",
            "created_at",
        ]
        read_only_fields = ["id", "booking", "status", "proposed_by", "created_at"]

    def create(self, validated_data):
        request = self.context["request"]
        booking = self.context["booking"]
        return BookingNegotiation.objects.create(
            booking=booking,
            proposed_by=request.user,
            proposed_price=validated_data["proposed_price"],
            message=validated_data.get("message", ""),
            status=BookingNegotiation.Status.OPEN,
        )


class BookingEventSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        model = BookingEvent
        fields = [
            "id",
            "booking",
            "event_type",
            "actor",
            "actor_username",
            "metadata",
            "created_at",
        ]
        read_only_fields = ["id", "booking", "event_type", "actor", "metadata", "created_at"]