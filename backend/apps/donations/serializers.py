from rest_framework import serializers

from apps.campaigns.models import Campaign, CampaignStatus

from .models import Donation


class DonationPublicSerializer(serializers.ModelSerializer):
    """Liste publique des donateurs (respecte l'anonymat)."""

    donor_name = serializers.CharField(source="public_donor_name", read_only=True)

    class Meta:
        model = Donation
        fields = ["id", "donor_name", "amount", "currency", "message", "created_at"]


class DonationCreateSerializer(serializers.ModelSerializer):
    """Création d'un don : initie la transaction auprès de la passerelle."""

    campaign_slug = serializers.SlugField(write_only=True)

    class Meta:
        model = Donation
        fields = [
            "id",
            "campaign_slug",
            "amount",
            "currency",
            "platform_support_amount",
            "donor_name",
            "donor_email",
            "is_anonymous",
            "message",
            "gateway",
        ]
        read_only_fields = ["id"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être positif.")
        return value

    def validate(self, attrs):
        slug = attrs.pop("campaign_slug")
        try:
            campaign = Campaign.objects.get(slug=slug)
        except Campaign.DoesNotExist as exc:
            raise serializers.ValidationError({"campaign_slug": "Appel introuvable."}) from exc
        if campaign.status not in {CampaignStatus.ACTIVE, CampaignStatus.FUNDED}:
            raise serializers.ValidationError(
                "Cet appel n'accepte plus de dons actuellement."
            )
        attrs["campaign"] = campaign
        return attrs
