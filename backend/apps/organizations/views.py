from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin

from .models import CertificationStatus, Organization
from .serializers import OrganizationPublicSerializer, OrganizationSerializer


class OrganizationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    Lecture publique des organisations certifiées ; gestion réservée à l'admin
    et aux membres de l'organisation.
    """

    queryset = Organization.objects.all()
    filterset_fields = ["type", "country", "certification_status"]
    search_fields = ["name", "description"]

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        return [IsAdmin()]

    def get_serializer_class(self):
        user = self.request.user
        if user and user.is_authenticated and getattr(user, "is_admin", False):
            return OrganizationSerializer
        return OrganizationPublicSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user and user.is_authenticated and getattr(user, "is_admin", False):
            return qs
        return qs.filter(certification_status=CertificationStatus.CERTIFIED)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def certify(self, request, pk=None):
        org = self.get_object()
        org.certification_status = CertificationStatus.CERTIFIED
        org.certified_at = timezone.now()
        org.save(update_fields=["certification_status", "certified_at", "updated_at"])
        return Response(OrganizationSerializer(org).data)
