from django.db import models
from django.contrib.auth.models import AbstractUser

# ----------------------------
# Custom User with roles
# ----------------------------
class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('worker', 'Worker'),
        ('client', 'Client'),
    )
    role = models.CharField(
     max_length=10,
    choices=ROLE_CHOICES,
    default="CLIENT"
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')

    def __str__(self):
        return f"{self.username} ({self.role})"

# ----------------------------
# Worker Profile
# ----------------------------
class WorkerProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='worker_profile')
    skill_summary = models.TextField()
    hourly_rate = models.FloatField()
    availability_status = models.CharField(max_length=50, default='Available')
    rating = models.FloatField(default=0)

    def __str__(self):
        return f"{self.user.username} Profile"

# ----------------------------
# Client Profile
# ----------------------------
class ClientProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='client_profile')
    phone_number = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"