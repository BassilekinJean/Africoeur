import uuid

from django.db import models


class TimeStampedModel(models.Model):
    """Base commune : identifiant UUID + horodatage de création/mise à jour."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class Country(models.TextChoices):
    """Pays cibles prioritaires (extensible)."""

    CM = "CM", "Cameroun"
    CI = "CI", "Côte d'Ivoire"
    SN = "SN", "Sénégal"
    BF = "BF", "Burkina Faso"
    ML = "ML", "Mali"
    TG = "TG", "Togo"
    BJ = "BJ", "Bénin"
    CD = "CD", "RD Congo"
    NG = "NG", "Nigeria"
    OTHER = "OTHER", "Autre"
