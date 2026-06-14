from django.db import models

from apps.core.models import TimeStampedModel


class OrganizationType(models.TextChoices):
    HOSPITAL = "hospital", "Service Social — Hôpital / Clinique"
    NGO = "ngo", "ONG / Association"


class CertificationStatus(models.TextChoices):
    PENDING = "pending", "En attente de vérification"
    CERTIFIED = "certified", "Certifiée"
    SUSPENDED = "suspended", "Suspendue"
    REJECTED = "rejected", "Rejetée"


class HospitalPlan(models.TextChoices):
    FREE = "free", "Free"
    PREMIUM = "premium", "Premium"


class Organization(TimeStampedModel):
    """
    Organisation partenaire certifiée : hôpital/clinique ou ONG.

    Les deux types partagent la table mais alimentent des espaces étanches
    (cf. cahier des charges : « Espaces Hôpital & ONG séparés »).
    """

    type = models.CharField(max_length=16, choices=OrganizationType.choices)
    name = models.CharField(max_length=255)
    legal_status = models.CharField("statut légal", max_length=255, blank=True)
    registration_number = models.CharField("n° RCCM / agrément", max_length=128, blank=True)
    country = models.CharField(max_length=8, default="CM")
    city = models.CharField(max_length=128, blank=True)
    intervention_zones = models.JSONField("zones d'intervention", default=list, blank=True)
    action_domains = models.JSONField("domaines d'action", default=list, blank=True)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=32, blank=True)
    logo_path = models.CharField(max_length=512, blank=True)

    certification_status = models.CharField(
        max_length=16,
        choices=CertificationStatus.choices,
        default=CertificationStatus.PENDING,
    )
    certified_at = models.DateTimeField(null=True, blank=True)
    # Documents officiels téléversés (bucket privé legal-docs).
    legal_documents = models.JSONField(default=list, blank=True)

    # Plan Free/Premium — pertinent uniquement pour les hôpitaux.
    plan = models.CharField(
        max_length=16, choices=HospitalPlan.choices, default=HospitalPlan.FREE
    )
    premium_until = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Organisation"
        verbose_name_plural = "Organisations"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} [{self.get_type_display()}]"

    @property
    def is_certified(self) -> bool:
        return self.certification_status == CertificationStatus.CERTIFIED

    @property
    def is_premium(self) -> bool:
        return self.type == OrganizationType.HOSPITAL and self.plan == HospitalPlan.PREMIUM
