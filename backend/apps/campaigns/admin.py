from django.contrib import admin

from .models import Campaign, FieldUpdate, FundUsageReport


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "type",
        "category",
        "organization",
        "status",
        "collected_amount",
        "target_amount",
        "created_at",
    )
    list_filter = ("type", "category", "status", "country")
    search_fields = ("title", "summary", "description")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("collected_amount", "donor_count")


@admin.register(FieldUpdate)
class FieldUpdateAdmin(admin.ModelAdmin):
    list_display = ("title", "campaign", "created_at")
    search_fields = ("title",)


@admin.register(FundUsageReport)
class FundUsageReportAdmin(admin.ModelAdmin):
    list_display = ("title", "campaign", "amount_used", "created_at")
