from django.contrib import admin

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("email", "full_name", "role", "organization", "is_active", "created_at")
    list_filter = ("role", "is_active")
    search_fields = ("email", "full_name", "supabase_user_id")
    autocomplete_fields = ("organization",)
