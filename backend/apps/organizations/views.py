from django.utils import timezone
from rest_framework import mixins, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
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
        if self.action == "me":
            return [IsAuthenticated()]
        return [IsAdmin()]

    def get_serializer_class(self):  # type: ignore[override]
        user = self.request.user
        if user and user.is_authenticated and getattr(user, "is_admin", False):
            return OrganizationSerializer
        return OrganizationPublicSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user and user.is_authenticated and getattr(user, "is_admin", False):
            return qs
        if user and user.is_authenticated:
            organization_id = getattr(user, "organization_id", None)
            if organization_id:
                return qs.filter(id=organization_id)
        return qs.filter(certification_status=CertificationStatus.CERTIFIED)

    @action(detail=False, methods=["get", "patch"])
    def me(self, request):
        profile = getattr(request.user, "profile", None)
        if not (request.user and request.user.is_authenticated and profile and profile.organization_id):
            return Response({"detail": "Aucune organisation rattachée."}, status=404)

        org = self.get_queryset().filter(id=profile.organization_id).first()
        if not org:
            return Response({"detail": "Organisation introuvable."}, status=404)

        if request.method == "GET":
            return Response(OrganizationSerializer(org).data)

        serializer = OrganizationSerializer(org, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def certify(self, request, pk=None):
        org = self.get_object()
        org.certification_status = CertificationStatus.CERTIFIED
        org.certified_at = timezone.now()
        org.save(update_fields=["certification_status", "certified_at", "updated_at"])
        return Response(OrganizationSerializer(org).data)
