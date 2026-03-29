from decimal import Decimal

from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from bookings.models import Booking
from accounts.models import WorkerProfile
from .models import Review
from .serializers import ReviewCreateSerializer, ReviewSerializer


def role_of(user) -> str:
    return (getattr(user, "role", "") or "").upper().strip()

class PaymentDetailByBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id: int):
        payment = Payment.objects.filter(booking_id=booking_id).first()

        if not payment:
            return Response({"detail": "Payment not found."}, status=404)

        return Response(PaymentSerializer(payment).data, status=200)


class CreateReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id: int):
        # Only CLIENT can review
        if role_of(request.user) != "CLIENT":
            return Response({"detail": "Only CLIENT can review."}, status=403)

        booking = Booking.objects.select_related("client", "worker").filter(pk=booking_id).first()
        if not booking:
            return Response({"detail": "Booking not found."}, status=404)

        # Only booking owner client can review
        if booking.client_id != request.user.id:
            return Response({"detail": "Not your booking."}, status=403)

        # Must be completed
        if booking.status != Booking.Status.COMPLETED:
            return Response({"detail": "Can only review completed jobs."}, status=400)

        # Must have worker
        if not booking.worker_id:
            return Response({"detail": "Booking has no worker."}, status=400)

        # Only one review per booking
        if hasattr(booking, "review"):
            return Response({"detail": "Already reviewed."}, status=400)

        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            review = Review.objects.create(
                booking=booking,
                worker=booking.worker,
                client=request.user,
                rating=serializer.validated_data["rating"],
                comment=serializer.validated_data.get("comment", ""),
            )

            # Update WorkerProfile aggregates safely
            wp, _ = WorkerProfile.objects.select_for_update().get_or_create(user=booking.worker)

            old_count = int(wp.rating_count or 0)
            old_avg = Decimal(str(wp.rating_avg or 0))

            new_count = old_count + 1
            new_avg = ((old_avg * old_count) + Decimal(review.rating)) / Decimal(new_count)

            wp.rating_count = new_count
            wp.rating_avg = new_avg.quantize(Decimal("0.01"))
            wp.save(update_fields=["rating_count", "rating_avg"])

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)