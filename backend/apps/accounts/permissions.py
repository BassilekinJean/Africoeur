from rest_framework import permissions

from .models import Role


class IsAdmin(permissions.BasePermission):
    message = "Réservé aux administrateurs de la plateforme."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "is_admin", False))


class IsHospitalAgent(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) == Role.HOSPITAL_AGENT
        )


class IsNGOAgent(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) == Role.NGO_AGENT
        )


class IsPartnerOrAdmin(permissions.BasePermission):
    """Agent hôpital, agent ONG ou admin (back-offices certifiés)."""

    message = "Accès réservé aux partenaires certifiés et aux administrateurs."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return getattr(user, "role", None) in {
            Role.HOSPITAL_AGENT,
            Role.NGO_AGENT,
            Role.ADMIN,
        }
