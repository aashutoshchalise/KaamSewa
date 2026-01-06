from django.contrib import admin
from .models import Service

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "base_price", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name",)