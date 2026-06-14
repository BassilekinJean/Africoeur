from decimal import Decimal

from django.db import models
from django.utils.text import slugify

from apps.core.models import Country, TimeStampedModel


class CampaignType(models.TextChoices):
    MEDICAL = "medical", "Appel médical (Hôpital)"
    NGO_PROJECT = "ngo_project", "Projet ONG"


class CampaignCategory(models.TextChoices):
    HEALTH = "health", "Santé"
    EMERGENCY = "emergency", "Urgence"
    EDUCATION = "education", "Éducation"
    DEVELOPMENT = "development", "Développement"
    SOCIAL = "social", "Social"


class CampaignStatus(models.TextChoices):
    DRAFT = "draft", "Brouillon"
    PENDING_REVIEW = "pending_review", "En attente de modération"
    ACTIVE = "active", "En cours"
    CLOSED = "closed", "Clôturée"
    FUNDED = "funded", "Objectif atteint"
    REJECTED = "rejected", "Rejetée"


class Campaign(TimeStampedModel):
    """
    Appel à l'aide validé : cas médical (hôpital) ou caisse de projet (ONG).

    Aucun accès famille : la cagnotte est administrée par l'organisation.
    Le déblocage des fonds passe par le workflow `disbursements`.
    """

    type = models.CharField(max_length=16, choices=CampaignType.choices)
    category = models.CharField(max_length=16, choices=CampaignCategory.choices)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="campaigns",
    )

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    summary = models.CharField("résumé", max_length=300, blank=True)
    description = models.TextField()
    country = models.CharField(max_length=8, choices=Country.choices, default=Country.CM)

    target_amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=8, default="XAF")
    # Totaux dénormalisés, maintenus par signaux sur les dons confirmés.
    collected_amount = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal("0")
    )
    donor_count = models.PositiveIntegerField(default=0)

    # Médias publics (chemins dans le bucket Supabase public-media).
    cover_image_path = models.CharField(max_length=512, blank=True)
    video_path = models.CharField(max_length=512, blank=True)

    status = models.CharField(
        max_length=16, choices=CampaignStatus.choices, default=CampaignStatus.DRAFT
    )
    deadline = models.DateField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    closed_reason = models.TextField(blank=True)

    # Justificatif budgétaire (devis médical) — accès admin uniquement.
    budget_justification_path = models.CharField(max_length=512, blank=True)
    # Formulaire de décharge signé (droit à l'image) — obligatoire avant activation.
    consent_form_path = models.CharField(max_length=512, blank=True)

    # Notes internes de l'assistant social / agent ONG.
    internal_notes = models.TextField(blank=True)
    moderation_notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Appel à l'aide"
        verbose_name_plural = "Appels à l'aide"
        indexes = [
            models.Index(fields=["status", "type"]),
            models.Index(fields=["category", "country"]),
        ]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:240] or "appel"
            slug = base
            i = 1
            while Campaign.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                i += 1
                slug = f"{base}-{i}"
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def progress_pct(self) -> float:
        if not self.target_amount:
            return 0.0
        return min(100.0, float(self.collected_amount) / float(self.target_amount) * 100)

    @property
    def is_public(self) -> bool:
        return self.status in {
            CampaignStatus.ACTIVE,
            CampaignStatus.CLOSED,
            CampaignStatus.FUNDED,
        }


class FieldUpdate(TimeStampedModel):
    """Mise à jour de terrain / rapport d'avancement (surtout ONG)."""

    campaign = models.ForeignKey(
        Campaign, on_delete=models.CASCADE, related_name="field_updates"
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    media_paths = models.JSONField(default=list, blank=True)
    author_profile = models.ForeignKey(
        "accounts.Profile", on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        verbose_name = "Mise à jour de terrain"
        verbose_name_plural = "Mises à jour de terrain"


class FundUsageReport(TimeStampedModel):
    """Rapport public d'utilisation des fonds après déblocage."""

    campaign = models.ForeignKey(
        Campaign, on_delete=models.CASCADE, related_name="fund_usage_reports"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    amount_used = models.DecimalField(max_digits=14, decimal_places=2)
    attachment_paths = models.JSONField(default=list, blank=True)

    class Meta:
        verbose_name = "Rapport d'utilisation des fonds"
        verbose_name_plural = "Rapports d'utilisation des fonds"
