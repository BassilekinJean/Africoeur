"""Signaux : maintien des totaux dénormalisés (montant collecté, nb donateurs)."""
from decimal import Decimal

from django.db.models import Count, Sum
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.donations.models import Donation, DonationStatus

from .models import Campaign, CampaignStatus


def _recompute_totals(campaign: Campaign) -> None:
    agg = campaign.donations.filter(status=DonationStatus.CONFIRMED).aggregate(
        total=Sum("amount"), count=Count("id")
    )
    campaign.collected_amount = agg["total"] or Decimal("0")
    campaign.donor_count = agg["count"] or 0
    update_fields = ["collected_amount", "donor_count", "updated_at"]

    # Passage automatique en "objectif atteint".
    if (
        campaign.status == CampaignStatus.ACTIVE
        and campaign.target_amount
        and campaign.collected_amount >= campaign.target_amount
    ):
        campaign.status = CampaignStatus.FUNDED
        update_fields.append("status")

    campaign.save(update_fields=update_fields)


@receiver(post_save, sender=Donation)
def donation_saved(sender, instance: Donation, **kwargs):
    if instance.campaign_id:
        _recompute_totals(instance.campaign)


@receiver(post_delete, sender=Donation)
def donation_deleted(sender, instance: Donation, **kwargs):
    if instance.campaign_id:
        try:
            _recompute_totals(instance.campaign)
        except Campaign.DoesNotExist:  # pragma: no cover
            pass
