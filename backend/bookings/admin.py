from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "worker", "service", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("client__username", "worker__username", "service__name", "address")
    readonly_fields = ("created_at", "updated_at")