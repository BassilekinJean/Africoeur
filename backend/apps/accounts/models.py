import uuid

from django.db import models

from apps.core.models import TimeStampedModel


class Role(models.TextChoices):
    """Rôles applicatifs — chaque espace est étanche (cf. cahier des charges)."""

    HOSPITAL_AGENT = "hospital_agent", "Assistant social — Hôpital"
    NGO_AGENT = "ngo_agent", "Agent — ONG"
    ADMIN = "admin", "Administrateur plateforme"
    DONOR = "donor", "Donateur / visiteur enregistré"


class Profile(TimeStampedModel):
    """
    Profil applicatif rattaché à un utilisateur Supabase Auth.

    Le mot de passe, le MFA TOTP et la session vivent dans Supabase (GoTrue).
    On ne stocke ici que l'identité métier (rôle, organisation de rattachement).
    """

    # UUID renvoyé par Supabase Auth (claim `sub` du JWT).
    supabase_user_id = models.UUIDField(unique=True, db_index=True)
    email = models.EmailField()
    full_name = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=32, choices=Role.choices, default=Role.DONOR)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="members",
    )
    is_active = models.BooleanField(default=True)
    locale = models.CharField(max_length=5, default="fr")

    class Meta:
        verbose_name = "Profil"
        verbose_name_plural = "Profils"

    def __str__(self) -> str:
        return f"{self.email} ({self.get_role_display()})"

    @property
    def is_admin(self) -> bool:
        return self.role == Role.ADMIN

    @property
    def is_partner(self) -> bool:
        return self.role in {Role.HOSPITAL_AGENT, Role.NGO_AGENT}
