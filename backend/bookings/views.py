from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from .models import Booking
from .serializers import (
    BookingListSerializer,
    BookingCreateSerializer,
    BookingStatusUpdateSerializer,
)


def role_of(user) -> str:
    return (getattr(user, "role", "") or "").upper().strip()


class CreateBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if role_of(request.user) != "CLIENT":
            return Response({"detail": "Only CLIENT can create bookings."}, status=403)

        serializer = BookingCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        return Response(BookingListSerializer(booking).data, status=status.HTTP_201_CREATED)


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


class AvailableBookingsForWorkerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if role_of(request.user) != "WORKER":
            return Response({"detail": "Only WORKER can view available jobs."}, status=403)

        qs = Booking.objects.filter(status=Booking.Status.PENDING, worker__isnull=True).order_by("-created_at")
        return Response(BookingListSerializer(qs, many=True).data)


class AcceptBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        if role_of(request.user) != "WORKER":
            return Response({"detail": "Only WORKER can accept bookings."}, status=403)

        with transaction.atomic():
            booking = Booking.objects.select_for_update().filter(pk=pk).first()
            if not booking:
                return Response({"detail": "Not found."}, status=404)

            if booking.status != Booking.Status.PENDING or booking.worker_id is not None:
                return Response({"detail": "Booking is not available."}, status=400)

            booking.worker = request.user
            booking.status = Booking.Status.ACCEPTED
            booking.save(update_fields=["worker", "status", "updated_at"])

        return Response(BookingListSerializer(booking).data)


class UpdateBookingStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk: int):
        booking = Booking.objects.filter(pk=pk).first()
        if not booking:
            return Response({"detail": "Not found."}, status=404)

        r = role_of(request.user)

        serializer = BookingStatusUpdateSerializer(instance=booking, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]

        if r == "WORKER":
            if booking.worker_id != request.user.id:
                return Response({"detail": "Not your booking."}, status=403)
            allowed = {Booking.Status.IN_PROGRESS, Booking.Status.COMPLETED, Booking.Status.CANCELED}
            if new_status not in allowed:
                return Response({"detail": "Invalid status."}, status=400)

        elif r == "CLIENT":
            if booking.client_id != request.user.id:
                return Response({"detail": "Not your booking."}, status=403)
            if new_status != Booking.Status.CANCELED:
                return Response({"detail": "Client can only cancel."}, status=403)
            if booking.status != Booking.Status.PENDING:
                return Response({"detail": "Only pending bookings can be canceled."}, status=400)

        elif r == "ADMIN":
            pass
        else:
            return Response({"detail": "Invalid role."}, status=403)

        booking.status = new_status
        booking.save(update_fields=["status", "updated_at"])
        return Response(BookingListSerializer(booking).data)