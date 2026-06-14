from django.contrib import admin

from .models import EmailLog


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ("kind", "recipient", "subject", "success", "created_at")
    list_filter = ("kind", "success")
    search_fields = ("recipient", "subject")
