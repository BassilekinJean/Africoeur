from decimal import Decimal

from rest_framework import serializers

from apps.campaigns.models import Campaign

from .models import DisbursementRequest


class DisbursementSerializer(serializers.ModelSerializer):
    campaign = serializers.PrimaryKeyRelatedField(
        queryset=Campaign.objects.all(),
        error_messages={
            "required": "Veuillez sélectionner une campagne.",
            "does_not_exist": "La campagne sélectionnée est introuvable.",
        },
    )
    campaign_title = serializers.CharField(source="campaign.title", read_only=True)
    amount = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        min_value=Decimal("0.01"),
        error_messages={
            "required": "Le montant demandé est obligatoire.",
            "invalid": "Le montant demandé est invalide.",
            "min_value": "Le montant doit être supérieur à 0.",
        },
    )
    beneficiary_name = serializers.CharField(
        error_messages={"required": "Le bénéficiaire est obligatoire."}
    )
    purpose = serializers.CharField(
        error_messages={"required": "L’objet de la dépense est obligatoire."}
    )

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
