from django.db import models

from apps.core.models import TimeStampedModel


class DisbursementStatus(models.TextChoices):
    PENDING = "pending", "En attente de validation admin"
    APPROVED = "approved", "Validée (instruction bancaire)"
    PAID = "paid", "Payée (chèque conditionné / virement)"
    REJECTED = "rejected", "Rejetée"


class DisbursementMethod(models.TextChoices):
    CONDITIONAL_CHECK = "conditional_check", "Chèque conditionné"
    DIRECT_TRANSFER = "direct_transfer", "Virement direct (hôpital / fournisseur)"


class DisbursementRequest(TimeStampedModel):
    """
    Demande de déblocage de fonds soumise par le service social / l'ONG.

     Versement au partenaire (hôpital,fournisseur) via chèque conditionné ou 
     virement, sur validation admin.
    Déblocage possible par tranches (cas ONG).
    """

    campaign = models.ForeignKey(
        "campaigns.Campaign", on_delete=models.PROTECT, related_name="disbursements"
    )
    requested_by = models.ForeignKey(
        "accounts.Profile", on_delete=models.SET_NULL, null=True, related_name="+"
    )

    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=8, default="XAF")
    method = models.CharField(
        max_length=24,
        choices=DisbursementMethod.choices,
        default=DisbursementMethod.DIRECT_TRANSFER,
    )

    beneficiary_name = models.CharField(
        "bénéficiaire (hôpital / fournisseur)", max_length=255
    )
    purpose = models.TextField("objet de la dépense")
    # Justificatifs (factures, bons de commande) — bucket privé.
    justification_paths = models.JSONField(default=list, blank=True)

    status = models.CharField(
        max_length=16,
        choices=DisbursementStatus.choices,
        default=DisbursementStatus.PENDING,
    )
    admin_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        "accounts.Profile", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    bank_reference = models.CharField(max_length=128, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Demande de déblocage"
        verbose_name_plural = "Demandes de déblocage"

    def __str__(self) -> str:
        return f"{self.amount} {self.currency} → {self.beneficiary_name} [{self.get_status_display()}]"
