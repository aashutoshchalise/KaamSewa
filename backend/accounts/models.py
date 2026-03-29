from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Avg, Count


class WorkerSkill(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class CustomUser(AbstractUser):
    
    ROLE_CHOICES = (
        ("ADMIN", "Admin"),
        ("WORKER", "Worker"),
        ("CLIENT", "Client"),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="CLIENT")
    is_worker_approved = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, blank=True, null=True)
    khalti_number = models.CharField(max_length=20, blank=True, null=True)
    bank_account_number = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class ClientProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_profile",
    )
    address_line = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=80, blank=True)
    district = models.CharField(max_length=80, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"ClientProfile: {self.user.username}"


class WorkerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="worker_profile",
    )
    bio = models.TextField(blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    availability_status = models.CharField(max_length=30, default="AVAILABLE")
    skills = models.ManyToManyField(WorkerSkill, blank=True, related_name="workers")

    # Cached rating (kept in sync by WorkerReview save/delete)
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    
    total_earned = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    available_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"WorkerProfile: {self.user.username}"

    def recompute_rating(self):
        """
        Recalculate cached rating fields from WorkerReview table.
        """
        agg = self.reviews.aggregate(avg=Avg("rating"), cnt=Count("id"))
        avg = agg["avg"] or 0
        cnt = agg["cnt"] or 0
        self.rating_avg = round(float(avg), 2)
        self.rating_count = cnt
        self.save(update_fields=["rating_avg", "rating_count"])

    


class WorkerReview(models.Model):
    """
    Rating system:
    - One client can leave at most one review per booking for a worker.
    - You can later extend with moderation, replies, etc.
    """

    worker_profile = models.ForeignKey(
        WorkerProfile,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="given_worker_reviews",
    )

    # Link to booking for integrity (recommended)
    booking = models.OneToOneField(
        "bookings.Booking",
        on_delete=models.CASCADE,
        related_name="worker_review",
    )

    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["worker_profile", "created_at"]),
            models.Index(fields=["client", "created_at"]),
        ]

    def __str__(self):
        return f"Review({self.rating}) by {self.client_id} for {self.worker_profile_id}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # keep cached ratings synced
        self.worker_profile.recompute_rating()

    def delete(self, *args, **kwargs):
        wp = self.worker_profile
        super().delete(*args, **kwargs)
        wp.recompute_rating()