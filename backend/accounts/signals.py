from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import CustomUser, ClientProfile, WorkerProfile


@receiver(post_save, sender=CustomUser)
def create_profiles(sender, instance: CustomUser, created, **kwargs):
    if not created:
        return

    # Always safe to have a client profile
    ClientProfile.objects.get_or_create(user=instance)

    # Only workers need WorkerProfile
    if instance.role == "WORKER":
        WorkerProfile.objects.get_or_create(user=instance)