from decimal import Decimal
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from payments.models import Payment
from accounts.models import Notification

from .models import Booking, BookingEvent
from .serializers import (
    BookingListSerializer,
    BookingCreateSerializer,
    BookingStatusUpdateSerializer,
    BookingEventSerializer,
)


def role_of(user) -> str:
    return (getattr(user, "role", "") or "").upper().strip()


def is_worker(user) -> bool:
    return role_of(user) == "WORKER"


def is_client(user) -> bool:
    return role_of(user) == "CLIENT"


def log_event(*, booking: Booking, event_type: str, actor):
    BookingEvent.objects.create(
        booking=booking,
        event_type=event_type,
        actor=actor if actor.is_authenticated else None,
    )


def get_booking_amount(booking: Booking) -> Decimal:
    if booking.final_price:
        return booking.final_price

    if booking.service:
        return booking.service.base_price

    return Decimal("0.00")


# =========================
# CREATE BOOKING
# =========================
class CreateBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not is_client(request.user):
            return Response({"detail": "Only CLIENT"}, status=403)

        serializer = BookingCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()

        log_event(
            booking=booking,
            event_type="BOOKING_CREATED",
            actor=request.user,
        )

        Notification.objects.create(
            user=booking.client,
            title="Booking Created",
            message=f"You booked {booking.service.name}",
        )

        return Response(BookingListSerializer(booking).data)


# =========================
# MY BOOKINGS
# =========================
class MyBookingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = role_of(request.user)

        if role == "CLIENT":
            qs = Booking.objects.filter(client=request.user)
        elif role == "WORKER":
            qs = Booking.objects.filter(worker=request.user)
        else:
            qs = Booking.objects.all()

        return Response(BookingListSerializer(qs, many=True).data)


# =========================
# AVAILABLE BOOKINGS
# =========================
class AvailableBookingsForWorkerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_worker(request.user):
            return Response({"detail": "Only WORKER"}, status=403)

        qs = Booking.objects.filter(worker__isnull=True, status="PENDING")
        return Response(BookingListSerializer(qs, many=True).data)


# =========================
# CLAIM BOOKING
# =========================
class ClaimBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not is_worker(request.user):
            return Response({"detail": "Only WORKER"}, status=403)

        with transaction.atomic():
            booking = Booking.objects.select_for_update().get(pk=pk)

            if booking.worker:
                return Response({"detail": "Already taken"}, status=400)

            booking.worker = request.user
            booking.status = "ACCEPTED"
            booking.save()

            Notification.objects.create(
                user=booking.client,
                title="Booking Accepted",
                message="Worker accepted your booking",
            )

        return Response(BookingListSerializer(booking).data)


# =========================
# START JOB
# =========================
class StartJobView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        booking = Booking.objects.get(pk=pk)

        if booking.worker != request.user:
            return Response({"detail": "Not yours"}, status=403)

        booking.status = "IN_PROGRESS"
        booking.save()

        Notification.objects.create(
            user=booking.client,
            title="Service Started",
            message="Your job has started",
        )

        return Response(BookingListSerializer(booking).data)


# =========================
# COMPLETE JOB
# =========================
class CompleteJobView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        booking = Booking.objects.get(pk=pk)

        if booking.worker != request.user:
            return Response({"detail": "Not yours"}, status=403)

        booking.status = "COMPLETED"
        booking.save()

        Notification.objects.create(
            user=booking.client,
            title="Completed",
            message="Your service is completed",
        )

        return Response(BookingListSerializer(booking).data)