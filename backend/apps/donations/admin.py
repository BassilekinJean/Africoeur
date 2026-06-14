from django.contrib import admin

from .models import Donation


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = (
        "__str__",
        "campaign",
        "amount",
        "gateway",
        "status",
        "commission_amount",
        "created_at",
    )
    list_filter = ("status", "gateway", "is_anonymous")
    search_fields = ("donor_name", "donor_email", "transaction_ref")
    readonly_fields = ("commission_amount", "gateway_payload")
