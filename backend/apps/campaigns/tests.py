from django.test import TestCase

from apps.campaigns.models import CampaignCategory, CampaignType
from apps.campaigns.serializers import CampaignWriteSerializer


class CampaignWriteSerializerTests(TestCase):
    def valid_data(self, **overrides):
        data = {
            "type": CampaignType.MEDICAL,
            "category": CampaignCategory.HEALTH,
            "title": "Test",
            "description": "Description du cas",
            "target_amount": 1000,
            "deadline": "2026-12-31",
        }
        data.update(overrides)
        return data

    def test_missing_deadline_returns_user_friendly_message(self):
        data = self.valid_data()
        data.pop("deadline")
        serializer = CampaignWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("deadline", serializer.errors)
        self.assertEqual(serializer.errors["deadline"][0], "La date limite est obligatoire.")

    def test_invalid_deadline_format_returns_friendly_message(self):
        data = self.valid_data(deadline="31/12/2026")
        serializer = CampaignWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("deadline", serializer.errors)
        self.assertEqual(serializer.errors["deadline"][0], "La date limite doit être au format YYYY-MM-DD.")

    def test_null_deadline_returns_required_message(self):
        serializer = CampaignWriteSerializer(data=self.valid_data(deadline=None))

        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["deadline"][0], "La date limite est obligatoire.")

    def test_iso_deadline_is_accepted(self):
        serializer = CampaignWriteSerializer(data=self.valid_data())

        self.assertTrue(serializer.is_valid(), serializer.errors)
