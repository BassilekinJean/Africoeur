from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin, IsPartnerOrAdmin

from .models import DisbursementRequest, DisbursementStatus
from .serializers import DisbursementSerializer


class DisbursementRequestViewSet(viewsets.ModelViewSet):
    """
    Workflow de déblocage :
      1. Le partenaire dépose une demande + justificatifs.
      2. L'admin valide (instruction bancaire) ou rejette.
      3. L'admin marque comme payée (chèque conditionné / virement).
    """

    serializer_class = DisbursementSerializer
    queryset = DisbursementRequest.objects.select_related("campaign")
    permission_classes = [IsPartnerOrAdmin]
    filterset_fields = ["campaign", "status"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if getattr(user, "is_admin", False):
            return qs
        return qs.filter(campaign__organization_id=getattr(user, "organization_id", None))

    def perform_create(self, serializer):
        user = self.request.user
        campaign = serializer.validated_data["campaign"]
        if not getattr(user, "is_admin", False) and campaign.organization_id != getattr(
            user, "organization_id", None
        ):
            raise PermissionDenied("Campagne hors de votre organisation.")
        serializer.save(
            requested_by=user.profile, status=DisbursementStatus.PENDING
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def approve(self, request, pk=None):
        req = self.get_object()
        req.status = DisbursementStatus.APPROVED
        req.reviewed_by = request.user.profile
        req.reviewed_at = timezone.now()
        req.admin_notes = request.data.get("notes", "")
        req.save(
            update_fields=["status", "reviewed_by", "reviewed_at", "admin_notes", "updated_at"]
        )
        return Response(DisbursementSerializer(req).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def reject(self, request, pk=None):
        req = self.get_object()
        req.status = DisbursementStatus.REJECTED
        req.reviewed_by = request.user.profile
        req.reviewed_at = timezone.now()
        req.admin_notes = request.data.get("notes", "")
        req.save(
            update_fields=["status", "reviewed_by", "reviewed_at", "admin_notes", "updated_at"]
        )
        return Response(DisbursementSerializer(req).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def mark_paid(self, request, pk=None):
        req = self.get_object()
        if req.status != DisbursementStatus.APPROVED:
            raise ValidationError("La demande doit d'abord être validée.")
        req.status = DisbursementStatus.PAID
        req.bank_reference = request.data.get("bank_reference", "")
        req.paid_at = timezone.now()
        req.save(update_fields=["status", "bank_reference", "paid_at", "updated_at"])
        return Response(DisbursementSerializer(req).data)
