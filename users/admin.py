from django.contrib import admin
from .models import WorkerProfile

@admin.register(WorkerProfile)
class WorkerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'skill_summary', 'hourly_rate', 'availability_status', 'rating')
    search_fields = ('user__username', 'skill_summary')
    list_filter = ('availability_status',)