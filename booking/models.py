from django.conf import settings
from django.db import models
from service_app.models import Service


class Booking(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("ACCEPTED", "Accepted"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookings"
    )

    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_jobs"
    )

    service = models.ForeignKey(Service, on_delete=models.CASCADE)

    scheduled_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.service.name} - {self.user}"