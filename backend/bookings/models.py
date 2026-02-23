from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CLAIMED = "CLAIMED", "Claimed"
        NEGOTIATING = "NEGOTIATING", "Negotiating"
        ACCEPTED = "ACCEPTED", "Accepted"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELED = "CANCELED", "Canceled"
        REJECTED = "REJECTED", "Rejected"

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_bookings",
    )

    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="worker_bookings",
    )

    service = models.ForeignKey(
        "services.Service",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="bookings",
    )

    package = models.ForeignKey(
        "services.ServicePackage",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="package_bookings",
    )

    address = models.CharField(max_length=255)
    notes = models.TextField(blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)

    final_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Final agreed price after negotiation",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["client", "created_at"]),
            models.Index(fields=["worker", "created_at"]),
        ]

    def __str__(self):
        subject = (
            self.service.name
            if self.service_id
            else (self.package.name if self.package_id else "N/A")
        )
        return f"Booking #{self.id} - {subject} - {self.status}"

    def can_transition(self, new_status: str) -> bool:
        allowed_transitions = {
            self.Status.PENDING: [
                self.Status.CLAIMED,
                self.Status.CANCELED,
            ],
            self.Status.CLAIMED: [
                self.Status.NEGOTIATING,
                self.Status.CANCELED,
            ],
            self.Status.NEGOTIATING: [
                self.Status.ACCEPTED,
                self.Status.CANCELED,
            ],
            self.Status.ACCEPTED: [
                self.Status.IN_PROGRESS,
                self.Status.CANCELED,
            ],
            self.Status.IN_PROGRESS: [
                self.Status.COMPLETED,
            ],
            self.Status.COMPLETED: [],
            self.Status.CANCELED: [],
            self.Status.REJECTED: [],
        }

        return new_status in allowed_transitions.get(self.status, [])


class BookingNegotiation(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name="negotiations",
    )

    proposed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="booking_negotiations",
    )

    proposed_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )

    message = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["booking", "created_at"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return (
            f"Negotiation#{self.id} "
            f"Booking#{self.booking_id} "
            f"{self.proposed_price} "
            f"{self.status}"
        )


class BookingEvent(models.Model):
    class Type(models.TextChoices):
        BOOKING_CREATED = "BOOKING_CREATED", "Booking Created"
        BOOKING_CANCELED = "BOOKING_CANCELED", "Booking Canceled"
        BOOKING_CLAIMED = "BOOKING_CLAIMED", "Booking Claimed"
        NEGOTIATION_PROPOSED = "NEGOTIATION_PROPOSED", "Negotiation Proposed"
        NEGOTIATION_ACCEPTED = "NEGOTIATION_ACCEPTED", "Negotiation Accepted"
        NEGOTIATION_REJECTED = "NEGOTIATION_REJECTED", "Negotiation Rejected"
        STATUS_CHANGED = "STATUS_CHANGED", "Status Changed"
        JOB_STARTED = "JOB_STARTED", "Job Started"
        JOB_COMPLETED = "JOB_COMPLETED", "Job Completed"
        LOCATION_UPDATE = "LOCATION_UPDATE", "Location Update"

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name="events",
    )

    event_type = models.CharField(
        max_length=40,
        choices=Type.choices,
    )

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="booking_events",
    )

    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["booking", "created_at"]),
            models.Index(fields=["event_type", "created_at"]),
        ]

    def __str__(self):
        return f"Event#{self.id} {self.event_type} Booking#{self.booking_id}"