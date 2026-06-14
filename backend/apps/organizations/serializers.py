from rest_framework import serializers

from .models import Organization


class OrganizationPublicSerializer(serializers.ModelSerializer):
    """Vue publique : pas de documents légaux ni de contacts privés détaillés."""

    class Meta:
        model = Organization
        fields = [
            "id",
            "type",
            "name",
            "country",
            "city",
            "intervention_zones",
            "action_domains",
            "description",
            "website",
            "logo_path",
            "is_certified",
            "created_at",
        ]


class OrganizationSerializer(serializers.ModelSerializer):
    """Vue back-office (partenaire propriétaire / admin)."""

    is_certified = serializers.BooleanField(read_only=True)
    is_premium = serializers.BooleanField(read_only=True)

    class Meta:
        model = Organization
        fields = "__all__"
        read_only_fields = [
            "certification_status",
            "certified_at",
            "plan",
            "premium_until",
        ]
