from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "service",
        "worker",
        "status",
        "scheduled_date",
        "created_at",
    )

    list_filter = ("status", "service")
    search_fields = ("user__username", "worker__username")