from django.contrib import admin

from .models import Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "country", "certification_status", "plan", "created_at")
    list_filter = ("type", "certification_status", "plan", "country")
    search_fields = ("name", "registration_number", "contact_email")
