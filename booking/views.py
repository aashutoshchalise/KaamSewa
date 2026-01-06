from rest_framework import generics, permissions
from .models import Booking
from .serializers import BookingSerializer
from users.permissions import IsWorker


# =========================
# CREATE BOOKING (CLIENT)
# =========================
class BookingCreateView(generics.CreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# =========================
# LIST USER BOOKINGS
# =========================
class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)


# =========================
# ADMIN / WORKER VIEW ALL
# =========================
class AllBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAdminUser]

    queryset = Booking.objects.all()


# =========================
# Accept booking
# =========================

class AcceptBookingView(generics.UpdateAPIView):
    queryset = Booking.objects.all()
    permission_classes = [IsWorker]

    def perform_update(self, serializer):
        serializer.save(
            worker=self.request.user,
            status="ACCEPTED"
        )