from rest_framework import serializers

from apps.patients.serializers import PatientPublicSerializer

from .models import Campaign, FieldUpdate, FundUsageReport


class FieldUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldUpdate
        fields = ["id", "campaign", "title", "content", "media_paths", "created_at"]
        read_only_fields = ["id", "created_at"]


class FundUsageReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundUsageReport
        fields = [
            "id",
            "campaign",
            "title",
            "description",
            "amount_used",
            "attachment_paths",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class CampaignListSerializer(serializers.ModelSerializer):
    """Liste publique allégée."""

    organization_name = serializers.CharField(source="organization.name", read_only=True)
    organization_type = serializers.CharField(source="organization.type", read_only=True)
    progress_pct = serializers.FloatField(read_only=True)

    class Meta:
        model = Campaign
        fields = [
            "id",
            "type",
            "category",
            "title",
            "slug",
            "summary",
            "country",
            "target_amount",
            "collected_amount",
            "currency",
            "donor_count",
            "progress_pct",
            "cover_image_path",
            "status",
            "deadline",
            "organization_name",
            "organization_type",
            "published_at",
        ]


class CampaignDetailSerializer(CampaignListSerializer):
    """Détail public : ajoute description, vidéo et profil patient (selon niveau)."""

    patient = PatientPublicSerializer(read_only=True)
    field_updates = FieldUpdateSerializer(many=True, read_only=True)
    fund_usage_reports = FundUsageReportSerializer(many=True, read_only=True)

    class Meta(CampaignListSerializer.Meta):
        fields = CampaignListSerializer.Meta.fields + [
            "description",
            "video_path",
            "patient",
            "field_updates",
            "fund_usage_reports",
        ]


class CampaignWriteSerializer(serializers.ModelSerializer):
    """Création / mise à jour par un partenaire certifié."""

    class Meta:
        model = Campaign
        fields = [
            "id",
            "type",
            "category",
            "title",
            "summary",
            "description",
            "country",
            "target_amount",
            "currency",
            "cover_image_path",
            "video_path",
            "deadline",
            "budget_justification_path",
            "consent_form_path",
            "internal_notes",
            "status",
        ]
        read_only_fields = ["id", "status"]
