from rest_framework import serializers

from .models import DisbursementRequest


class DisbursementSerializer(serializers.ModelSerializer):
    campaign_title = serializers.CharField(source="campaign.title", read_only=True)

    class Meta:
        model = DisbursementRequest
        fields = [
            "id",
            "campaign",
            "campaign_title",
            "amount",
            "currency",
            "method",
            "beneficiary_name",
            "purpose",
            "justification_paths",
            "status",
            "admin_notes",
            "bank_reference",
            "reviewed_at",
            "paid_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "admin_notes",
            "bank_reference",
            "reviewed_at",
            "paid_at",
        ]
