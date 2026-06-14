from django.contrib import admin

from .models import DisbursementRequest


@admin.register(DisbursementRequest)
class DisbursementRequestAdmin(admin.ModelAdmin):
    list_display = (
        "beneficiary_name",
        "campaign",
        "amount",
        "method",
        "status",
        "created_at",
    )
    list_filter = ("status", "method")
    search_fields = ("beneficiary_name", "purpose", "bank_reference")
    readonly_fields = ("reviewed_at", "paid_at")
