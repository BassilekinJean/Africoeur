from django.db import models

from apps.core.models import TimeStampedModel


class DisplayLevel(models.IntegerChoices):
    """
    Niveau d'affichage du patient — décidé par l'admin lors de la modération,
    jamais élevé côté client (cf. protection des données du cahier des charges).
    """

    LEVEL_1 = 1, "Niveau 1 — Anonyme (prénom + initiale, âge, situation)"
    LEVEL_2 = 2, "Niveau 2 — Photo floutée (mineur / accord partiel)"
    LEVEL_3 = 3, "Niveau 3 — Photo nette + vidéo (décharge complète)"


class PatientProfile(TimeStampedModel):
    """
    Profil patient strictement minimal.

    AUCUNE donnée médicale confidentielle n'est stockée (pas de diagnostic,
    pas de n° de dossier). Les contacts du tuteur vivent dans `PatientContact`,
    table privée jamais exposée publiquement.
    """

    campaign = models.OneToOneField(
        "campaigns.Campaign", on_delete=models.CASCADE, related_name="patient"
    )

    first_name = models.CharField("prénom", max_length=80)
    last_name_initial = models.CharField("initiale du nom", max_length=2)
    age = models.PositiveSmallIntegerField()
    is_minor = models.BooleanField(default=False)
    general_situation = models.TextField(
        "situation générale",
        help_text="Ex. : « enfant de 7 ans, pathologie nécessitant une opération ».",
    )

    display_level = models.IntegerField(
        choices=DisplayLevel.choices, default=DisplayLevel.LEVEL_1
    )

    # Médias — l'original n'est jamais exposé pour les niveaux inférieurs.
    photo_path = models.CharField(max_length=512, blank=True)
    photo_blurred_path = models.CharField(max_length=512, blank=True)
    video_path = models.CharField(max_length=512, blank=True)

    consent_signed = models.BooleanField("décharge signée", default=False)

    class Meta:
        verbose_name = "Profil patient"
        verbose_name_plural = "Profils patients"

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name_initial}. ({self.age} ans)"

    @property
    def public_display_name(self) -> str:
        return f"{self.first_name} {self.last_name_initial}."

    def public_photo_path(self) -> str:
        """Renvoie le chemin de la photo réellement publiable selon le niveau."""
        if self.display_level == DisplayLevel.LEVEL_3 and self.consent_signed:
            return self.photo_path
        if self.display_level == DisplayLevel.LEVEL_2:
            return self.photo_blurred_path
        return ""

    def public_video_path(self) -> str:
        if self.display_level == DisplayLevel.LEVEL_3 and self.consent_signed:
            return self.video_path
        return ""


class PatientContact(TimeStampedModel):
    """
    Contacts du tuteur — stockés de façon privée, jamais affichés publiquement.
    Utilisés uniquement pour les notifications e-mail automatiques.
    """

    patient = models.OneToOneField(
        PatientProfile, on_delete=models.CASCADE, related_name="contact"
    )
    guardian_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=32, blank=True)

    class Meta:
        verbose_name = "Contact tuteur (privé)"
        verbose_name_plural = "Contacts tuteurs (privés)"
