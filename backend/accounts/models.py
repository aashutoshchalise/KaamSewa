from django.contrib.auth.models import AbstractUser
from django.db import models


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

    def __str__(self):
        return f"{self.username} ({self.role})"


class ClientProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="client_profile")
    address_line = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=80, blank=True)
    district = models.CharField(max_length=80, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"ClientProfile: {self.user.username}"


class WorkerProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="worker_profile")
    bio = models.TextField(blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    availability_status = models.CharField(max_length=30, default="AVAILABLE")
    skills = models.ManyToManyField(WorkerSkill, blank=True, related_name="workers")

    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"WorkerProfile: {self.user.username}"