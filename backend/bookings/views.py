from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking, BookingNegotiation, BookingEvent
from .serializers import (
    BookingListSerializer,
    BookingCreateSerializer,
    BookingStatusUpdateSerializer,
    BookingNegotiationSerializer,
    BookingEventSerializer,
)


def role_of(user) -> str:
    return (getattr(user, "role", "") or "").upper().strip()

def is_worker(user) -> bool:
    return role_of(user) == "WORKER"


def is_client(user) -> bool:
    return role_of(user) == "CLIENT"


def is_admin(user) -> bool:
    return role_of(user) == "ADMIN"


def log_event(*, booking: Booking, event_type: str, actor, metadata: dict | None = None):
    BookingEvent.objects.create(
        booking=booking,
        event_type=event_type,
        actor=actor if actor and getattr(actor, "is_authenticated", False) else None,
        metadata=metadata or {},
    )


# =========================
# CREATE BOOKING (CLIENT)
# =========================
class CreateBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if role_of(request.user) != "CLIENT":
            return Response({"detail": "Only CLIENT can create bookings."}, status=403)

        serializer = BookingCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()

        log_event(
            booking=booking,
            event_type=BookingEvent.Type.BOOKING_CREATED,
            actor=request.user,
            metadata={
                "service_id": booking.service_id,
                "package_id": booking.package_id,
            },
        )

        return Response(BookingListSerializer(booking).data, status=status.HTTP_201_CREATED)


# =========================
# MY BOOKINGS (role aware)
# =========================
class MyBookingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        r = role_of(request.user)

        if r == "CLIENT":
            qs = Booking.objects.filter(client=request.user).order_by("-created_at")
        elif r == "WORKER":
            qs = Booking.objects.filter(worker=request.user).order_by("-created_at")
        elif r == "ADMIN":
            qs = Booking.objects.all().order_by("-created_at")
        else:
            return Response({"detail": "Invalid role."}, status=403)

        return Response(BookingListSerializer(qs, many=True).data)


# =========================
# AVAILABLE BOOKINGS (WORKER)
# =========================
class AvailableBookingsForWorkerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if role_of(request.user) != "WORKER":
            return Response({"detail": "Only WORKER can view available jobs."}, status=403)

        qs = Booking.objects.filter(
            status=Booking.Status.PENDING,
            worker__isnull=True,
        ).order_by("-created_at")

        return Response(BookingListSerializer(qs, many=True).data)


# =========================
# CLAIM BOOKING (WORKER LOCKS IT)
# =========================
class ClaimBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        if role_of(request.user) != "WORKER":
            return Response({"detail": "Only WORKER can claim booking."}, status=403)

        with transaction.atomic():
            booking = Booking.objects.select_for_update().filter(pk=pk).first()
            if not booking:
                return Response({"detail": "Not found."}, status=404)

            if booking.status != Booking.Status.PENDING:
                return Response({"detail": "Booking cannot be claimed."}, status=400)

            if booking.worker_id is not None:
                return Response({"detail": "Already claimed."}, status=400)

            booking.worker = request.user
            booking.status = Booking.Status.CLAIMED
            booking.save(update_fields=["worker", "status", "updated_at"])

            log_event(
                booking=booking,
                event_type=BookingEvent.Type.BOOKING_CLAIMED,
                actor=request.user,
                metadata={},
            )

        return Response(BookingListSerializer(booking).data)


# =========================
# NEGOTIATION CREATE (CLIENT or CLAIMED WORKER)
# =========================
class CreateNegotiationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        booking = Booking.objects.filter(pk=pk).first()
        if not booking:
            return Response({"detail": "Booking not found."}, status=404)

        r = role_of(request.user)
        if r not in ["CLIENT", "WORKER"]:
            return Response({"detail": "Invalid role."}, status=403)

        if booking.status in [Booking.Status.CANCELED, Booking.Status.REJECTED, Booking.Status.COMPLETED]:
            return Response({"detail": "Booking is closed."}, status=400)

        # WORKER must claim before negotiating
        if r == "WORKER":
            if booking.worker_id != request.user.id:
                return Response({"detail": "You must claim this booking first."}, status=403)
            if booking.status not in [Booking.Status.CLAIMED, Booking.Status.NEGOTIATING]:
                return Response({"detail": "Booking not negotiable in current status."}, status=400)

        # CLIENT can negotiate only on own booking
        if r == "CLIENT" and booking.client_id != request.user.id:
            return Response({"detail": "Not your booking."}, status=403)

        serializer = BookingNegotiationSerializer(
            data=request.data,
            context={"request": request, "booking": booking},
        )
        serializer.is_valid(raise_exception=True)
        negotiation = serializer.save()

        # flip booking into negotiating if not already
        if booking.status != Booking.Status.NEGOTIATING:
            booking.status = Booking.Status.NEGOTIATING
            booking.save(update_fields=["status", "updated_at"])

        log_event(
            booking=booking,
            event_type=BookingEvent.Type.NEGOTIATION_PROPOSED,
            actor=request.user,
            metadata={
                "negotiation_id": negotiation.id,
                "proposed_price": str(negotiation.proposed_price),
                "message": negotiation.message,
            },
        )

        return Response(BookingNegotiationSerializer(negotiation).data, status=status.HTTP_201_CREATED)


# =========================
# NEGOTIATION ACCEPT
# (either party can accept an OPEN proposal on their booking)
# =========================
class AcceptNegotiationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, negotiation_id: int):
        negotiation = BookingNegotiation.objects.select_related("booking").filter(pk=negotiation_id).first()
        if not negotiation:
            return Response({"detail": "Not found."}, status=404)

        booking = negotiation.booking
        r = role_of(request.user)

        if booking.status in [Booking.Status.CANCELED, Booking.Status.REJECTED, Booking.Status.COMPLETED]:
            return Response({"detail": "Booking is closed."}, status=400)

        # Must be involved
        if r == "CLIENT":
            if booking.client_id != request.user.id:
                return Response({"detail": "Not your booking."}, status=403)
        elif r == "WORKER":
            if booking.worker_id != request.user.id:
                return Response({"detail": "Not your booking."}, status=403)
        else:
            return Response({"detail": "Invalid role."}, status=403)

        if negotiation.status != BookingNegotiation.Status.OPEN:
            return Response({"detail": "Negotiation is not open."}, status=400)

        # Accept it + finalize booking
        with transaction.atomic():
            negotiation.status = BookingNegotiation.Status.ACCEPTED
            negotiation.save(update_fields=["status"])

            booking.final_price = negotiation.proposed_price
            booking.status = Booking.Status.ACCEPTED
            booking.save(update_fields=["final_price", "status", "updated_at"])

            log_event(
                booking=booking,
                event_type=BookingEvent.Type.NEGOTIATION_ACCEPTED,
                actor=request.user,
                metadata={
                    "negotiation_id": negotiation.id,
                    "final_price": str(booking.final_price),
                },
            )

        return Response(BookingListSerializer(booking).data)

class StartJobView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        if not is_worker(request.user):
            return Response({"detail": "Only WORKER can start jobs."}, status=403)

        with transaction.atomic():
            booking = Booking.objects.select_for_update().filter(pk=pk).first()
            if not booking:
                return Response({"detail": "Not found."}, status=404)

            if booking.worker_id != request.user.id:
                return Response({"detail": "Not your booking."}, status=403)

            if booking.status != Booking.Status.ACCEPTED:
                return Response(
                    {"detail": f"Cannot start job from status {booking.status}."},
                    status=400,
                )

            booking.status = Booking.Status.IN_PROGRESS
            booking.save(update_fields=["status", "updated_at"])

        return Response(BookingListSerializer(booking).data, status=200)


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
                return Response(
                    {"detail": f"Cannot complete job from status {booking.status}."},
                    status=400,
                )

            booking.status = Booking.Status.COMPLETED
            booking.save(update_fields=["status", "updated_at"])

        return Response(BookingListSerializer(booking).data, status=200)


# =========================
# UPDATE STATUS (role rules)
# =========================
class UpdateBookingStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk: int):
        booking = Booking.objects.filter(pk=pk).first()
        if not booking:
            return Response({"detail": "Not found."}, status=404)

        r = role_of(request.user)

        serializer = BookingStatusUpdateSerializer(
            instance=booking,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data.get("status")

        # ADMIN can do anything
        if r == "ADMIN":

            if not booking.can_transition(new_status):
                return Response(
                    {"detail": f"Invalid transition from {booking.status} to {new_status}"},
                    status=400,
                )

            booking.status = new_status
            booking.save(update_fields=["status", "updated_at"])
            return Response(BookingListSerializer(booking).data)

        # CLIENT rules
        if r == "CLIENT":
            if booking.client_id != request.user.id:
                return Response({"detail": "Not your booking."}, status=403)

            if new_status != Booking.Status.CANCELED:
                return Response({"detail": "Client can only cancel."}, status=403)

            # Client can cancel only before job starts
            if booking.status in [Booking.Status.IN_PROGRESS, Booking.Status.COMPLETED]:
                return Response({"detail": "Too late to cancel."}, status=400)

            booking.status = Booking.Status.CANCELED
            booking.save(update_fields=["status", "updated_at"])
            return Response(BookingListSerializer(booking).data)

            

        # WORKER should NOT patch status here
        if r == "WORKER":
            return Response(
                {"detail": "Workers must use /start/ and /complete/ endpoints."},
                status=403,
            )

        return Response({"detail": "Invalid role."}, status=403)

# =========================
# BOOKING EVENT HISTORY (timeline)
# =========================
class BookingEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk: int):
        booking = Booking.objects.filter(pk=pk).first()
        if not booking:
            return Response({"detail": "Not found."}, status=404)

        r = role_of(request.user)

        # only involved people or admin
        if r == "CLIENT" and booking.client_id != request.user.id:
            return Response({"detail": "Not your booking."}, status=403)
        if r == "WORKER" and booking.worker_id != request.user.id:
            return Response({"detail": "Not your booking."}, status=403)
        if r not in ["CLIENT", "WORKER", "ADMIN"]:
            return Response({"detail": "Invalid role."}, status=403)

        qs = BookingEvent.objects.filter(booking=booking).order_by("created_at")
        return Response(BookingEventSerializer(qs, many=True).data)