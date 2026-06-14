from django.contrib import admin

from .models import PatientContact, PatientProfile


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ("public_display_name", "age", "display_level", "consent_signed")
    list_filter = ("display_level", "consent_signed", "is_minor")


@admin.register(PatientContact)
class PatientContactAdmin(admin.ModelAdmin):
    list_display = ("guardian_name", "email", "phone")
    search_fields = ("guardian_name", "email")
