"""
Authentification DRF basée sur les JWT émis par Supabase Auth (GoTrue).

Supabase signe ses jetons en HS256 avec le secret partagé `SUPABASE_JWT_SECRET`.
On vérifie la signature + l'audience, puis on synchronise (get_or_create) un
`Profile` local. L'objet utilisateur exposé à DRF est un `SupabaseUser` léger
qui satisfait l'interface attendue (`is_authenticated`, etc.).
"""
from __future__ import annotations

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions

from .models import Profile, Role


class SupabaseUser:
    """Utilisateur applicatif issu d'un JWT Supabase (non persisté tel quel)."""

    is_authenticated = True
    is_anonymous = False

    def __init__(self, profile: Profile, claims: dict):
        self.profile = profile
        self.claims = claims
        self.id = profile.supabase_user_id
        self.pk = profile.pk
        self.email = profile.email

    @property
    def role(self) -> str:
        return self.profile.role

    @property
    def is_admin(self) -> bool:
        return self.profile.is_admin

    @property
    def is_staff(self) -> bool:
        return self.profile.is_admin

    @property
    def organization_id(self):
        return self.profile.organization_id

    def __str__(self) -> str:  # pragma: no cover
        return self.email


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).split()
        if not auth_header or auth_header[0].lower() != self.keyword.lower().encode():
            return None
        if len(auth_header) != 2:
            raise exceptions.AuthenticationFailed("En-tête Authorization invalide.")

        token = auth_header[1].decode()
        claims = self._decode(token)
        profile = self._sync_profile(claims)
        return SupabaseUser(profile, claims), token

    def _decode(self, token: str) -> dict:
        secret = settings.SUPABASE_JWT_SECRET
        if not secret:
            raise exceptions.AuthenticationFailed(
                "SUPABASE_JWT_SECRET non configuré côté serveur."
            )
        try:
            return jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                audience=settings.SUPABASE_JWT_AUD,
                options={"verify_aud": True},
            )
        except jwt.ExpiredSignatureError as exc:
            raise exceptions.AuthenticationFailed("Jeton expiré.") from exc
        except jwt.InvalidTokenError as exc:
            raise exceptions.AuthenticationFailed("Jeton invalide.") from exc

    def _sync_profile(self, claims: dict) -> Profile:
        sub = claims.get("sub")
        if not sub:
            raise exceptions.AuthenticationFailed("Claim `sub` absent du jeton.")

        email = claims.get("email", "")
        # Le rôle applicatif est porté par les métadonnées Supabase
        # (app_metadata.role), modifiable uniquement via service_role.
        app_metadata = claims.get("app_metadata", {}) or {}
        user_metadata = claims.get("user_metadata", {}) or {}
        requested_role = app_metadata.get("role")

        defaults = {
            "email": email,
            "full_name": user_metadata.get("full_name", ""),
        }
        if requested_role in Role.values:
            defaults["role"] = requested_role

        profile, created = Profile.objects.get_or_create(
            supabase_user_id=sub, defaults=defaults
        )
        if not created:
            changed = False
            if email and profile.email != email:
                profile.email = email
                changed = True
            # Le rôle ne peut être élevé que via app_metadata (service_role).
            if requested_role in Role.values and profile.role != requested_role:
                profile.role = requested_role
                changed = True
            if changed:
                profile.save(update_fields=["email", "role", "updated_at"])
        return profile
