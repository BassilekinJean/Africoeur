from django.db import models

from apps.core.models import TimeStampedModel


class PaymentGateway(models.TextChoices):
    CINETPAY = "cinetpay", "CinetPay (Mobile Money Afrique francophone)"
    CAMPAY = "campay", "Campay (Orange / MTN Cameroun)"
    FLUTTERWAVE = "flutterwave", "Flutterwave (cartes diaspora)"


class DonationStatus(models.TextChoices):
    PENDING = "pending", "En attente"
    CONFIRMED = "confirmed", "Confirmé"
    FAILED = "failed", "Échoué"
    REFUNDED = "refunded", "Remboursé"


class Donation(TimeStampedModel):
    """
    Don ponctuel sur une cagnotte. Les fonds transitent par le compte séquestre
    de la plateforme ; le donateur ne verse jamais directement à la famille.
    """

    campaign = models.ForeignKey(
        "campaigns.Campaign", on_delete=models.CASCADE, related_name="donations"
    )

    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=8, default="XAF")
    # Don libre pour soutenir la plateforme (option lors du paiement).
    platform_support_amount = models.DecimalField(
        max_digits=14, decimal_places=2, default=0
    )

    donor_name = models.CharField(max_length=255, blank=True)
    donor_email = models.EmailField(blank=True)
    is_anonymous = models.BooleanField(default=False)
    message = models.CharField(max_length=500, blank=True)

    gateway = models.CharField(max_length=16, choices=PaymentGateway.choices)
    status = models.CharField(
        max_length=16, choices=DonationStatus.choices, default=DonationStatus.PENDING
    )
    transaction_ref = models.CharField(max_length=128, blank=True, db_index=True)
    gateway_payload = models.JSONField(default=dict, blank=True)

    # Commission plateforme calculée à la confirmation.
    commission_amount = models.DecimalField(
        max_digits=14, decimal_places=2, default=0
    )
    receipt_sent = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Don"
        verbose_name_plural = "Dons"
        indexes = [models.Index(fields=["status", "gateway"])]

    def __str__(self) -> str:
        who = "Anonyme" if self.is_anonymous else (self.donor_name or "Donateur")
        return f"{who} — {self.amount} {self.currency}"

    @property
    def public_donor_name(self) -> str:
        return "Donateur anonyme" if self.is_anonymous else (self.donor_name or "Donateur")
