from django.test import TestCase

from apps.campaigns.models import Campaign, CampaignCategory, CampaignType
from apps.organizations.models import Organization, OrganizationType

from .serializers import DisbursementSerializer


class DisbursementSerializerValidationTests(TestCase):
    def setUp(self):
        self.organization = Organization.objects.create(
            type=OrganizationType.HOSPITAL,
            name="Centre Médical de Test",
            country="CM",
        )
        self.campaign = Campaign.objects.create(
            type=CampaignType.MEDICAL,
            category=CampaignCategory.HEALTH,
            organization=self.organization,
            title="Campagne de test",
            description="Description de test",
            target_amount=10000,
        )

    def test_missing_required_fields_return_user_friendly_messages(self):
        serializer = DisbursementSerializer(data={})

        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["campaign"][0], "Veuillez sélectionner une campagne.")
        self.assertEqual(serializer.errors["amount"][0], "Le montant demandé est obligatoire.")
        self.assertEqual(serializer.errors["beneficiary_name"][0], "Le bénéficiaire est obligatoire.")
        self.assertEqual(serializer.errors["purpose"][0], "L’objet de la dépense est obligatoire.")

    def test_negative_amount_returns_user_friendly_message(self):
        serializer = DisbursementSerializer(data={
            "campaign": self.campaign.pk,
            "amount": -1,
            "beneficiary_name": "Hôpital Central",
            "purpose": "Achat de matériel",
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn("Le montant doit être supérieur à 0.", serializer.errors["amount"])
