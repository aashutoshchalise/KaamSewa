from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from .models import Booking, BookingNegotiation
from .serializers import (
    BookingListSerializer,
    BookingCreateSerializer,
    BookingStatusUpdateSerializer,
)


def role_of(user) -> str:
    return (getattr(user, "role", "") or "").upper().strip()


# =========================================
# CREATE BOOKING (CLIENT)
# =========================================
class CreateBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if role_of(request.user) != "CLIENT":
            return Response({"detail": "Only CLIENT can create bookings."}, status=403)

        serializer = BookingCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()

        return Response(
            BookingListSerializer(booking).data,
            status=status.HTTP_201_CREATED,
        )


# =========================================
# MY BOOKINGS
# =========================================
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


# =========================================
# AVAILABLE BOOKINGS (WORKER)
# =========================================
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


# =========================================
# CLAIM BOOKING (WORKER LOCKS IT)
# =========================================
class ClaimBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        if role_of(request.user) != "WORKER":
            return Response({"detail": "Only WORKER can claim bookings."}, status=403)

        with transaction.atomic():
            booking = Booking.objects.select_for_update().filter(pk=pk).first()
            if not booking:
                return Response({"detail": "Not found."}, status=404)

            if booking.status != Booking.Status.PENDING:
                return Response({"detail": "Booking not available."}, status=400)

            booking.worker = request.user
            booking.status = Booking.Status.CLAIMED
            booking.save(update_fields=["worker", "status", "updated_at"])

        return Response(BookingListSerializer(booking).data)


# =========================================
# SEND NEGOTIATION (CLIENT OR WORKER)
# =========================================
class SendNegotiationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        booking = Booking.objects.filter(pk=pk).first()
        if not booking:
            return Response({"detail": "Not found."}, status=404)

        if booking.status != Booking.Status.CLAIMED:
            return Response({"detail": "Negotiation not allowed."}, status=400)

        if request.user not in [booking.client, booking.worker]:
            return Response({"detail": "Not allowed."}, status=403)

        proposed_price = request.data.get("proposed_price")
        message = request.data.get("message", "")

        if not proposed_price:
            return Response({"detail": "proposed_price required."}, status=400)

        negotiation = BookingNegotiation.objects.create(
            booking=booking,
            sender=request.user,
            proposed_price=proposed_price,
            message=message,
        )

        return Response({
            "id": negotiation.id,
            "proposed_price": negotiation.proposed_price,
            "message": negotiation.message,
            "sender": negotiation.sender.id,
            "created_at": negotiation.created_at,
        })


# =========================================
# CLIENT ACCEPTS FINAL PRICE
# =========================================
class AcceptNegotiationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        booking = Booking.objects.filter(pk=pk).first()
        if not booking:
            return Response({"detail": "Not found."}, status=404)

        if booking.status != Booking.Status.CLAIMED:
            return Response({"detail": "Cannot accept."}, status=400)

        if request.user != booking.client:
            return Response({"detail": "Only client can accept final price."}, status=403)

        last_offer = booking.negotiations.order_by("-created_at").first()
        if not last_offer:
            return Response({"detail": "No negotiation found."}, status=400)

        booking.negotiated_price = last_offer.proposed_price
        booking.status = Booking.Status.ACCEPTED
        booking.save(update_fields=["negotiated_price", "status", "updated_at"])

        return Response(BookingListSerializer(booking).data)


# =========================================
# UPDATE STATUS (STRICT STATE MACHINE)
# =========================================
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
        new_status = serializer.validated_data["status"]

        # WORKER transitions
        if r == "WORKER":
            if booking.worker_id != request.user.id:
                return Response({"detail": "Not your booking."}, status=403)

            allowed = {
                Booking.Status.IN_PROGRESS,
                Booking.Status.COMPLETED,
                Booking.Status.CANCELED,
            }

            if booking.status != Booking.Status.ACCEPTED and new_status == Booking.Status.IN_PROGRESS:
                return Response({"detail": "Must be ACCEPTED first."}, status=400)

            if new_status not in allowed:
                return Response({"detail": "Invalid status."}, status=400)

        # CLIENT cancel
        elif r == "CLIENT":
            if booking.client_id != request.user.id:
                return Response({"detail": "Not your booking."}, status=403)

            if new_status != Booking.Status.CANCELED:
                return Response({"detail": "Client can only cancel."}, status=403)

            if booking.status not in [Booking.Status.PENDING, Booking.Status.CLAIMED]:
                return Response({"detail": "Cannot cancel at this stage."}, status=400)

        # ADMIN override
        elif r == "ADMIN":
            pass

        else:
            return Response({"detail": "Invalid role."}, status=403)

        booking.status = new_status
        booking.save(update_fields=["status", "updated_at"])

        return Response(BookingListSerializer(booking).data)