from decimal import Decimal
from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

from payments.models import Payment
from accounts.models import Notification

from .models import Booking, BookingEvent, BookingNegotiation, BookingMessage
from .serializers import (
    BookingListSerializer,
    BookingCreateSerializer,
    BookingStatusUpdateSerializer,
    BookingEventSerializer,
    BookingMessageSerializer,
    BookingNegotiationSerializer,
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


def get_booking_subject(booking: Booking) -> str:
    if booking.service_id:
        return booking.service.name
    if booking.package_id:
        return booking.package.name
    return "service"


def get_booking_amount(booking: Booking) -> Decimal:
    if booking.final_price:
        return booking.final_price
    if booking.service:
        return booking.service.base_price
    if booking.package:
        return Decimal(str(booking.package.total_base_price))
    return Decimal("0.00")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_negotiation(request, booking_id):
    booking = Booking.objects.filter(id=booking_id).first()
    if not booking:
        return Response({"detail": "Booking not found."}, status=404)

    if request.user not in [booking.client, booking.worker] and role_of(request.user) != "ADMIN":
        return Response({"detail": "Not allowed."}, status=403)

    proposed_price = request.data.get("proposed_price")
    message = request.data.get("message", "")

    if not proposed_price:
        return Response({"detail": "Proposed price is required."}, status=400)

    negotiation = BookingNegotiation.objects.create(
        booking=booking,
        proposed_by=request.user,
        proposed_price=proposed_price,
        message=message,
        status=BookingNegotiation.Status.OPEN,
    )

    booking.final_price = proposed_price
    if booking.status in [Booking.Status.PENDING, Booking.Status.CLAIMED]:
        booking.status = Booking.Status.NEGOTIATING
    booking.save(update_fields=["final_price", "status", "updated_at"])

    log_event(
        booking=booking,
        event_type=BookingEvent.Type.NEGOTIATION_PROPOSED,
        actor=request.user,
    )

    serializer = BookingNegotiationSerializer(negotiation)
    return Response(serializer.data, status=201)


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
            event_type=BookingEvent.Type.BOOKING_CREATED,
            actor=request.user,
        )

        Notification.objects.create(
            user=booking.client,
            title="Booking Created",
            message=f"You booked {get_booking_subject(booking)}",
        )

        return Response(BookingListSerializer(booking).data)


class MyBookingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = role_of(request.user)

        if role == "CLIENT":
            qs = Booking.objects.filter(client=request.user).order_by("-created_at")
        elif role == "WORKER":
            qs = Booking.objects.filter(worker=request.user).order_by("-created_at")
        else:
            qs = Booking.objects.all().order_by("-created_at")

        return Response(BookingListSerializer(qs, many=True).data)


class AvailableBookingsForWorkerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_worker(request.user):
            return Response({"detail": "Only WORKER"}, status=403)

        qs = Booking.objects.filter(
            worker__isnull=True,
            status__in=[Booking.Status.PENDING, Booking.Status.NEGOTIATING],
        ).order_by("-created_at")

        return Response(BookingListSerializer(qs, many=True).data)


class ClaimBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not is_worker(request.user):
            return Response({"detail": "Only WORKER"}, status=403)

        with transaction.atomic():
            booking = Booking.objects.select_for_update().filter(pk=pk).first()
            if not booking:
                return Response({"detail": "Booking not found."}, status=404)

            if booking.worker:
                return Response({"detail": "Already taken"}, status=400)

            booking.worker = request.user
            booking.status = Booking.Status.ACCEPTED
            booking.save(update_fields=["worker", "status", "updated_at"])

            log_event(
                booking=booking,
                event_type=BookingEvent.Type.BOOKING_CLAIMED,
                actor=request.user,
            )

            Notification.objects.create(
                user=booking.client,
                title="Booking Accepted",
                message="Worker accepted your booking",
            )

        return Response(BookingListSerializer(booking).data)


class StartJobView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        booking = Booking.objects.filter(pk=pk).first()
        if not booking:
            return Response({"detail": "Booking not found."}, status=404)

        if booking.worker != request.user:
            return Response({"detail": "Not yours"}, status=403)

        booking.status = Booking.Status.IN_PROGRESS
        booking.save(update_fields=["status", "updated_at"])

        log_event(
            booking=booking,
            event_type=BookingEvent.Type.JOB_STARTED,
            actor=request.user,
        )

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

            log_event(
                booking=booking,
                event_type=BookingEvent.Type.JOB_COMPLETED,
                actor=request.user,
            )

            payment = Payment.objects.filter(booking=booking).first()

            if not payment:
                total_amount = Decimal(str(get_booking_amount(booking))).quantize(Decimal("0.01"))
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

        log_event(
            booking=booking,
            event_type=BookingEvent.Type.BOOKING_CANCELED,
            actor=request.user,
        )

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


class BookingMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        booking = Booking.objects.filter(pk=pk).first()
        if not booking:
            return Response({"detail": "Booking not found."}, status=404)

        if request.user not in [booking.client, booking.worker] and role_of(request.user) != "ADMIN":
            return Response({"detail": "Not allowed."}, status=403)

        messages = booking.messages.all().order_by("created_at")
        serializer = BookingMessageSerializer(messages, many=True, context={"request": request})
        return Response(serializer.data, status=200)


class SendBookingMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        booking = Booking.objects.filter(pk=pk).first()
        if not booking:
            return Response({"detail": "Booking not found."}, status=404)

        if request.user not in [booking.client, booking.worker] and role_of(request.user) != "ADMIN":
            return Response({"detail": "Not allowed."}, status=403)

        message = request.data.get("message", "").strip()
        proposed_price = request.data.get("proposed_price", None)

        if not message and not proposed_price:
            return Response(
                {"detail": "Message or proposed price is required."},
                status=400,
            )

        booking_message = BookingMessage.objects.create(
            booking=booking,
            sender=request.user,
            message=message,
            proposed_price=proposed_price if proposed_price else None,
        )

        if proposed_price:
            booking.final_price = proposed_price
            if booking.status in [Booking.Status.PENDING, Booking.Status.CLAIMED]:
                booking.status = Booking.Status.NEGOTIATING
            booking.save(update_fields=["final_price", "status", "updated_at"])

            BookingNegotiation.objects.create(
                booking=booking,
                proposed_by=request.user,
                proposed_price=proposed_price,
                message=message,
                status=BookingNegotiation.Status.OPEN,
            )

            log_event(
                booking=booking,
                event_type=BookingEvent.Type.NEGOTIATION_PROPOSED,
                actor=request.user,
            )

        serializer = BookingMessageSerializer(booking_message, context={"request": request})
        return Response(serializer.data, status=201)

class BookingDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk: int):
        booking = Booking.objects.filter(pk=pk).first()
        if not booking:
            return Response({"detail": "Booking not found."}, status=404)

        if role_of(request.user) == "ADMIN":
            return Response(BookingListSerializer(booking).data, status=200)

        if booking.client_id == request.user.id or booking.worker_id == request.user.id:
            return Response(BookingListSerializer(booking).data, status=200)

        # also allow workers to open still-unclaimed available jobs
        if is_worker(request.user) and booking.worker_id is None:
            return Response(BookingListSerializer(booking).data, status=200)

        return Response({"detail": "Not allowed."}, status=403)