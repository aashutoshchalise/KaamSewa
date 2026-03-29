from django.db import models
from bookings.models import Booking
from django.contrib.auth import get_user_model

User = get_user_model()


class Payment(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    class Method(models.TextChoices):
        CASH = "CASH", "Cash"
        KHALTI = "KHALTI", "Khalti"

    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name="payment"
    )
    client = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="client_payments"
    )
    worker = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="worker_payments"
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    commission_amount = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    worker_earning = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )

    method = models.CharField(
        max_length=10,
        choices=Method.choices,
        default=Method.CASH,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    transaction_reference = models.CharField(
        max_length=100, blank=True, null=True
    )

    khalti_pidx = models.CharField(
        max_length=100, blank=True, null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.commission_amount or not self.worker_earning:
            total = float(self.amount)
            self.commission_amount = total * 0.2
            self.worker_earning = total * 0.8
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payment #{self.id} - {self.status}"


from django.conf import settings

class WithdrawalRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING"
        APPROVED = "APPROVED"
        REJECTED = "REJECTED"

    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="withdrawals"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.worker} - {self.amount} ({self.status})"