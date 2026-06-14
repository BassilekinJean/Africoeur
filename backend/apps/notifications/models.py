from django.db import models

from apps.core.models import TimeStampedModel


class EmailLog(TimeStampedModel):
    """Journal des notifications e-mail (le SMS est volontairement exclu)."""

    class Kind(models.TextChoices):
        DONATION_RECEIPT = "donation_receipt", "Reçu de don"
        CAMPAIGN_PROGRESS = "campaign_progress", "Progression cagnotte (tuteur)"
        DISBURSEMENT = "disbursement", "Déblocage des fonds"
        ACCOUNT = "account", "Compte / certification"

    kind = models.CharField(max_length=32, choices=Kind.choices)
    recipient = models.EmailField()
    subject = models.CharField(max_length=255)
    success = models.BooleanField(default=True)
    error = models.TextField(blank=True)

    class Meta:
        verbose_name = "Journal e-mail"
        verbose_name_plural = "Journaux e-mail"

    def __str__(self) -> str:
        return f"{self.kind} → {self.recipient}"
