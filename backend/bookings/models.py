from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator


class Booking(models.Model):
    """
    Core booking model.

    Flow:
    PENDING → NEGOTIATING → ACCEPTED → IN_PROGRESS → COMPLETED
                                 ↘
                                  CANCELED
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        NEGOTIATING = "NEGOTIATING", "Negotiating"
        ACCEPTED = "ACCEPTED", "Accepted"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELED = "CANCELED", "Canceled"

    # Who created the booking
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_bookings",
    )

    # Worker who claimed it (locked worker)
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="worker_bookings",
    )

    # Service selected
    service = models.ForeignKey(
        "services.Service",
        on_delete=models.PROTECT,
        related_name="bookings",
    )

    address = models.CharField(max_length=255)
    notes = models.TextField(blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)

    # Final agreed price after negotiation
    final_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Booking #{self.id} - {self.service.name} - {self.status}"


class BookingNegotiation(models.Model):
    """
    Stores negotiation messages and price offers.

    Only allowed when booking.status == NEGOTIATING
    """

    class Sender(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        WORKER = "WORKER", "Worker"

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name="negotiations",
    )

    sender_role = models.CharField(
        max_length=10,
        choices=Sender.choices,
    )

    proposed_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )

    message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Booking {self.booking.id} | {self.sender_role} → {self.proposed_price}"