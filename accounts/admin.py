from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, WorkerProfile, ClientProfile, WorkerSkill


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("KaamSewa", {"fields": ("role", "is_worker_approved", "phone")}),
    )
    list_display = ("username", "email", "role", "is_worker_approved", "is_staff", "is_active")
    list_filter = ("role", "is_worker_approved", "is_staff", "is_active")


@admin.register(WorkerSkill)
class WorkerSkillAdmin(admin.ModelAdmin):
    search_fields = ("name",)
    list_display = ("id", "name")


@admin.register(WorkerProfile)
class WorkerProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "hourly_rate", "availability_status", "rating_avg", "rating_count")
    search_fields = ("user__username",)


@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "city", "district")
    search_fields = ("user__username",)