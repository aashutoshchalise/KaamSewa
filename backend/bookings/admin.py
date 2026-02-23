from django.contrib import admin
from .models import Booking, BookingNegotiation, BookingEvent


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "worker", "service", "package", "status", "final_price", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("client__username", "worker__username", "address")
    readonly_fields = ("created_at", "updated_at")


@admin.register(BookingNegotiation)
class BookingNegotiationAdmin(admin.ModelAdmin):
    list_display = ("id", "booking", "proposed_price", "status", "proposed_by", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("booking__id", "proposed_by__username")
    readonly_fields = ("created_at",)


@admin.register(BookingEvent)
class BookingEventAdmin(admin.ModelAdmin):
    list_display = ("id", "booking", "event_type", "actor", "created_at")
    list_filter = ("event_type", "created_at")
    search_fields = ("booking__id", "actor__username")
    readonly_fields = ("created_at",)