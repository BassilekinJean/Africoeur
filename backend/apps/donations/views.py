from decimal import Decimal

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.campaigns.models import CampaignType

from .gateways import get_gateway
from .models import Donation, DonationStatus
from .serializers import DonationCreateSerializer, DonationPublicSerializer
from .tasks import send_donation_receipt


class DonationViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    Création publique d'un don (initie le paiement) + liste publique des
    donateurs d'une campagne (anonymat respecté).
    """

    permission_classes = [AllowAny]
    queryset = Donation.objects.filter(status=DonationStatus.CONFIRMED)
    filterset_fields = ["campaign"]

    def get_serializer_class(self):
        if self.action == "create":
            return DonationCreateSerializer
        return DonationPublicSerializer

    def get_queryset(self):
        return super().get_queryset().select_related("campaign")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        donation = serializer.save(status=DonationStatus.PENDING)

        gateway = get_gateway(donation.gateway)
        result = gateway.initiate(donation)
        donation.transaction_ref = result.transaction_ref
        donation.gateway_payload = result.raw
        donation.save(update_fields=["transaction_ref", "gateway_payload", "updated_at"])

        return Response(
            {
                "donation_id": str(donation.id),
                "transaction_ref": result.transaction_ref,
                "payment_url": result.payment_url,
                "status": donation.status,
            },
            status=status.HTTP_201_CREATED,
        )


def _confirm_donation(donation: Donation) -> None:
    if donation.status == DonationStatus.CONFIRMED:
        return
    rate = (
        settings.PLATFORM_DEFAULT_COMMISSION_MEDICAL
        if donation.campaign.type == CampaignType.MEDICAL
        else settings.PLATFORM_DEFAULT_COMMISSION_NGO
    )
    donation.commission_amount = (donation.amount * Decimal(str(rate))).quantize(
        Decimal("0.01")
    )
    donation.status = DonationStatus.CONFIRMED
    donation.save(update_fields=["status", "commission_amount", "updated_at"])
    # Reçu de don automatique par e-mail (asynchrone via Celery).
    if donation.donor_email:
        send_donation_receipt.delay(str(donation.id))


@api_view(["POST"])
@permission_classes([AllowAny])
def payment_webhook(request, gateway: str):
    """
    Endpoint webhook appelé par la passerelle après paiement.

    NB : en production, vérifier la signature/HMAC de la passerelle avant de
    confirmer. Ici, on délègue la vérification à l'implémentation `verify()`.
    """
    gw = get_gateway(gateway)
    transaction_ref, confirmed = gw.verify(request.data)
    if not transaction_ref:
        return Response({"detail": "transaction_ref manquant."}, status=400)

    donation = get_object_or_404(Donation, transaction_ref=transaction_ref)
    if confirmed:
        _confirm_donation(donation)
    else:
        donation.status = DonationStatus.FAILED
        donation.save(update_fields=["status", "updated_at"])

    return Response({"status": donation.status})
