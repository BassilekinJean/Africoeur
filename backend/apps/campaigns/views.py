from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin, IsPartnerOrAdmin

from .models import Campaign, CampaignStatus, FieldUpdate, FundUsageReport
from .serializers import (
    CampaignDetailSerializer,
    CampaignListSerializer,
    CampaignWriteSerializer,
    FieldUpdateSerializer,
    FundUsageReportSerializer,
)

PUBLIC_STATUSES = [
    CampaignStatus.ACTIVE,
    CampaignStatus.CLOSED,
    CampaignStatus.FUNDED,
]


class CampaignViewSet(viewsets.ModelViewSet):
    """
    Espace public en lecture (appels validés) + back-office partenaire/admin
    pour la création, la modération et la clôture.
    """

    queryset = Campaign.objects.select_related("organization", "patient")
    lookup_field = "slug"
    filterset_fields = ["type", "category", "country", "status", "organization"]
    search_fields = ["title", "summary", "description"]
    ordering_fields = ["created_at", "collected_amount", "deadline", "donor_count"]

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        if self.action in {"approve", "reject"}:
            return [IsAdmin()]
        return [IsPartnerOrAdmin()]

    def get_serializer_class(self):
        if self.action == "list":
            return CampaignListSerializer
        if self.action == "retrieve":
            return CampaignDetailSerializer
        return CampaignWriteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Back-office : un partenaire ne voit que ses campagnes ; l'admin voit tout.
        if user and user.is_authenticated and self.action not in {"list", "retrieve"}:
            if getattr(user, "is_admin", False):
                return qs
            return qs.filter(organization_id=getattr(user, "organization_id", None))
        # Lecture publique : uniquement les statuts publics.
        if self.action == "retrieve":
            if user and user.is_authenticated and getattr(user, "is_admin", False):
                return qs
            if user and user.is_authenticated and getattr(user, "organization_id", None):
                return qs.filter(organization_id=getattr(user, "organization_id", None))
            return qs.filter(status__in=PUBLIC_STATUSES)
        if user and user.is_authenticated and getattr(user, "organization_id", None):
            return qs.filter(organization_id=getattr(user, "organization_id", None))
        return qs.filter(status__in=PUBLIC_STATUSES)

    def perform_create(self, serializer):
        user = self.request.user
        org_id = getattr(user, "organization_id", None)
        if not org_id and not getattr(user, "is_admin", False):
            raise ValidationError("Aucune organisation rattachée à ce compte.")
        serializer.save(
            organization_id=org_id, status=CampaignStatus.DRAFT
        )

    @action(detail=True, methods=["post"], permission_classes=[IsPartnerOrAdmin])
    def submit(self, request, slug=None):
        """Le partenaire soumet l'appel à la modération (décharge obligatoire)."""
        campaign = self.get_object()
        if not campaign.consent_form_path:
            raise ValidationError(
                "Le formulaire de décharge signé est obligatoire avant soumission."
            )
        campaign.status = CampaignStatus.PENDING_REVIEW
        campaign.save(update_fields=["status", "updated_at"])
        return Response(CampaignDetailSerializer(campaign).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def approve(self, request, slug=None):
        campaign = self.get_object()
        campaign.status = CampaignStatus.ACTIVE
        campaign.published_at = timezone.now()
        campaign.moderation_notes = request.data.get("notes", "")
        campaign.save(
            update_fields=["status", "published_at", "moderation_notes", "updated_at"]
        )
        return Response(CampaignDetailSerializer(campaign).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def reject(self, request, slug=None):
        campaign = self.get_object()
        campaign.status = CampaignStatus.REJECTED
        campaign.moderation_notes = request.data.get("notes", "")
        campaign.save(update_fields=["status", "moderation_notes", "updated_at"])
        return Response(CampaignDetailSerializer(campaign).data)

    @action(detail=True, methods=["post"], permission_classes=[IsPartnerOrAdmin])
    def close(self, request, slug=None):
        """Clôture anticipée avec motif obligatoire."""
        campaign = self.get_object()
        reason = request.data.get("reason", "").strip()
        if not reason:
            raise ValidationError("Le motif de clôture est obligatoire.")
        campaign.status = CampaignStatus.CLOSED
        campaign.closed_reason = reason
        campaign.save(update_fields=["status", "closed_reason", "updated_at"])
        return Response(CampaignDetailSerializer(campaign).data)


class _OwnedByCampaignViewSet(viewsets.ModelViewSet):
    """Base pour les ressources rattachées à une campagne (back-office)."""

    permission_classes = [IsPartnerOrAdmin]

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        return [IsPartnerOrAdmin()]

    def _check_ownership(self, campaign):
        user = self.request.user
        if getattr(user, "is_admin", False):
            return
        if campaign.organization_id != getattr(user, "organization_id", None):
            raise PermissionDenied("Cette campagne n'appartient pas à votre organisation.")


class FieldUpdateViewSet(_OwnedByCampaignViewSet):
    serializer_class = FieldUpdateSerializer
    queryset = FieldUpdate.objects.select_related("campaign")
    filterset_fields = ["campaign"]

    def perform_create(self, serializer):
        self._check_ownership(serializer.validated_data["campaign"])
        serializer.save(author_profile=self.request.user.profile)


class FundUsageReportViewSet(_OwnedByCampaignViewSet):
    serializer_class = FundUsageReportSerializer
    queryset = FundUsageReport.objects.select_related("campaign")
    filterset_fields = ["campaign"]

    def perform_create(self, serializer):
        self._check_ownership(serializer.validated_data["campaign"])
        serializer.save()
