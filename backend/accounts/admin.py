from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser,
    WorkerProfile,
    ClientProfile,
    WorkerSkill,
    SupportMessage,
    Notification,
    WorkerReview,
)


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser

    list_display = (
        "id",
        "username",
        "email",
        "phone",
        "role",
        "is_worker_approved",
        "khalti_number",
        "bank_account_number",
        "is_staff",
        "is_active",
    )

    list_filter = (
        "role",
        "is_worker_approved",
        "is_staff",
        "is_active",
    )

    search_fields = (
        "username",
        "email",
        "phone",
        "khalti_number",
        "bank_account_number",
    )

    ordering = ("id",)

    fieldsets = (
        ("Login Info", {
            "fields": ("username", "password")
        }),
        ("Personal Info", {
            "fields": ("first_name", "last_name", "email", "phone")
        }),
        ("Role Info", {
            "fields": ("role", "is_worker_approved")
        }),
        ("Payment Info", {
            "fields": ("khalti_number", "bank_account_number")
        }),
        ("Permissions", {
            "fields": (
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            )
        }),
        ("Important Dates", {
            "fields": ("last_login", "date_joined")
        }),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "username",
                "email",
                "phone",
                "role",
                "khalti_number",
                "bank_account_number",
                "password1",
                "password2",
                "is_worker_approved",
                "is_staff",
                "is_active",
            ),
        }),
    )



@admin.register(WorkerSkill)
class WorkerSkillAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)




@admin.register(WorkerProfile)
class WorkerProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "hourly_rate",
        "availability_status",
        "rating_avg",
        "rating_count",
        "total_earned",
        "available_balance",
    )
    list_filter = ("availability_status",)
    search_fields = ("user__username", "user__email", "user__phone")
    filter_horizontal = ("skills",)

@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "address_line",
        "city",
        "district",
    )
    search_fields = ("user__username", "user__email", "user__phone", "city", "district")

@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "subject", "status", "created_at", "updated_at")
    list_filter = ("status", "created_at")
    search_fields = ("client__username", "subject", "message", "admin_reply")
    fields = (
        "client",
        "subject",
        "message",
        "admin_reply",
        "status",
        "created_at",
        "updated_at",
    )
    readonly_fields = ("client", "subject", "message", "created_at", "updated_at")

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "title", "is_read", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("user__username", "title", "message")

@admin.register(WorkerReview)
class WorkerReviewAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "worker_profile",
        "client",
        "booking",
        "rating",
        "created_at",
    )
    list_filter = ("rating", "created_at")
    search_fields = (
        "worker_profile__user__username",
        "client__username",
        "comment",
    )