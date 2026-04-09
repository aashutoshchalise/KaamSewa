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



class AvailableBookingsForWorkerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_worker(request.user):
            return Response({"detail": "Only WORKER"}, status=403)

        qs = Booking.objects.filter(worker__isnull=True, status="PENDING")
        return Response(BookingListSerializer(qs, many=True).data)


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


class CompleteJobView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        if not is_worker(request.user):
            return Response({"detail": "Only WORKER can complete jobs."}, status=403)

        with transaction.atomic():
            booking = Booking.objects.select_for_update().filter(pk=pk).first()
            if not booking:
                return Response({"detail": "Not found."}, status=404)

            if booking.worker_id != request.user.id:
                return Response({"detail": "Not your booking."}, status=403)

            if booking.status != Booking.Status.IN_PROGRESS:
                return Response({"detail": "Cannot complete job."}, status=400)

            booking.status = Booking.Status.COMPLETED

            if booking.final_price is None:
                booking.final_price = get_booking_amount(booking)

            booking.save(update_fields=["status", "final_price", "updated_at"])

            payment = Payment.objects.filter(booking=booking).first()

            if not payment:
                total_amount = Decimal(
                    str(booking.final_price if booking.final_price is not None else get_booking_amount(booking))
                ).quantize(Decimal("0.01"))

                commission_rate = Decimal("0.20")
                commission_amount = (total_amount * commission_rate).quantize(Decimal("0.01"))
                worker_earning = (total_amount - commission_amount).quantize(Decimal("0.01"))

                Payment.objects.create(
                    booking=booking,
                    client=booking.client,
                    worker=booking.worker,
                    amount=total_amount,
                    commission_amount=commission_amount,
                    worker_earning=worker_earning,
                    method=Payment.Method.CASH,
                    status=Payment.Status.PENDING,
                    khalti_pidx=None,
                    transaction_reference="",
                )

            Notification.objects.create(
                user=booking.client,
                title="Service Completed",
                message="Your service has been completed.",
            )

        return Response(BookingListSerializer(booking).data, status=200)


class CancelBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        booking = Booking.objects.filter(pk=pk).first()
        if not booking:
            return Response({"detail": "Booking not found."}, status=404)

        if role_of(request.user) != "CLIENT":
            return Response({"detail": "Only CLIENT can cancel bookings."}, status=403)

        if booking.client_id != request.user.id:
            return Response({"detail": "Not your booking."}, status=403)

        if booking.status in [
            Booking.Status.IN_PROGRESS,
            Booking.Status.COMPLETED,
            Booking.Status.CANCELED,
        ]:
            return Response(
                {"detail": "This booking cannot be canceled now."},
                status=400,
            )

        booking.status = Booking.Status.CANCELED
        booking.save(update_fields=["status", "updated_at"])

        try:
            Notification.objects.create(
                user=booking.client,
                title="Booking Canceled",
                message="Your booking has been canceled successfully.",
            )
        except Exception:
            pass

        if booking.worker_id:
            try:
                Notification.objects.create(
                    user=booking.worker,
                    title="Booking Canceled",
                    message="A booking assigned to you has been canceled by the client.",
                )
            except Exception:
                pass

        return Response({"detail": "Booking canceled successfully."}, status=200)