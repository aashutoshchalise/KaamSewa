from django.contrib import admin
from .models import ServiceCategory, Service, ServicePackage, ServicePackageItem


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "category",
        "base_price",
        "pricing_unit",
        "is_active",
        "created_at",
    )
    list_filter = ("category", "pricing_unit", "is_active")
    search_fields = ("name",)


@admin.register(ServicePackage)
class ServicePackageAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.register(ServicePackageItem)
class ServicePackageItemAdmin(admin.ModelAdmin):
    list_display = ("id", "package", "service", "quantity")
    list_filter = ("package",)
    search_fields = ("package__name", "service__name")