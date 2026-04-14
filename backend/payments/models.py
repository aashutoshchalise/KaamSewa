from decimal import Decimal
from django.conf import settings
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

    class CommissionStatus(models.TextChoices):
        NOT_APPLICABLE = "NOT_APPLICABLE", "Not Applicable"
        PENDING_SETTLEMENT = "PENDING_SETTLEMENT", "Pending Settlement"
        SETTLED = "SETTLED", "Settled"

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
        blank=True,
        null=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    commission_status = models.CharField(
        max_length=30,
        choices=CommissionStatus.choices,
        default=CommissionStatus.NOT_APPLICABLE,
    )

    worker_wallet_credited = models.BooleanField(default=False)

    transaction_reference = models.CharField(
        max_length=100, blank=True, null=True
    )

    khalti_pidx = models.CharField(
        max_length=100, blank=True, null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.commission_amount is None or self.worker_earning is None:
            total = Decimal(str(self.amount))
            self.commission_amount = (total * Decimal("0.20")).quantize(Decimal("0.01"))
            self.worker_earning = (total - self.commission_amount).quantize(Decimal("0.01"))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payment #{self.id} - {self.status}"


class WithdrawalRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

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