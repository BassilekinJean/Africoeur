"""Jeu de données de démonstration (campagnes publiques, organisations, dons)."""
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.campaigns.models import (
    Campaign,
    CampaignCategory,
    CampaignStatus,
    CampaignType,
)
from apps.donations.models import Donation, DonationStatus, PaymentGateway
from apps.organizations.models import (
    CertificationStatus,
    Organization,
    OrganizationType,
)
from apps.patients.models import DisplayLevel, PatientProfile


class Command(BaseCommand):
    help = "Crée un jeu de données de démonstration pour la plateforme Africœur."

    def handle(self, *args, **options):
        hopital, _ = Organization.objects.get_or_create(
            name="Hôpital Central de Yaoundé — Service Social",
            defaults=dict(
                type=OrganizationType.HOSPITAL,
                country="CM",
                city="Yaoundé",
                description="Service social de l'Hôpital Central de Yaoundé.",
                certification_status=CertificationStatus.CERTIFIED,
                certified_at=timezone.now(),
            ),
        )
        ong, _ = Organization.objects.get_or_create(
            name="Solidarité Santé Afrique",
            defaults=dict(
                type=OrganizationType.NGO,
                country="CM",
                city="Douala",
                description="ONG dédiée à l'accès aux soins en zones rurales.",
                action_domains=["santé", "éducation"],
                intervention_zones=["CM", "TG"],
                certification_status=CertificationStatus.CERTIFIED,
                certified_at=timezone.now(),
            ),
        )

        demos = [
            dict(
                organization=hopital,
                type=CampaignType.MEDICAL,
                category=CampaignCategory.HEALTH,
                title="Opération du cœur pour Awa, 7 ans",
                summary="Une opération cardiaque urgente pour permettre à Awa de grandir en bonne santé.",
                description=(
                    "Awa, 7 ans, présente une pathologie nécessitant une intervention "
                    "chirurgicale cardiaque. Le service social de l'Hôpital Central "
                    "accompagne sa famille pour réunir le montant du devis hospitalier."
                ),
                target_amount=Decimal("4500000"),
                country="CM",
                patient=dict(
                    first_name="Awa",
                    last_name_initial="N",
                    age=7,
                    is_minor=True,
                    general_situation="Enfant de 7 ans, pathologie cardiaque nécessitant une opération.",
                    display_level=DisplayLevel.LEVEL_1,
                ),
            ),
            dict(
                organization=hopital,
                type=CampaignType.MEDICAL,
                category=CampaignCategory.EMERGENCY,
                title="Prise en charge des grands brûlés — Joseph",
                summary="Soins d'urgence et greffes pour Joseph après un accident domestique.",
                description=(
                    "Joseph a été victime de graves brûlures. La prise en charge "
                    "nécessite plusieurs interventions et un suivi prolongé."
                ),
                target_amount=Decimal("2800000"),
                country="CM",
                patient=dict(
                    first_name="Joseph",
                    last_name_initial="K",
                    age=29,
                    is_minor=False,
                    general_situation="Adulte, brûlures graves nécessitant des greffes successives.",
                    display_level=DisplayLevel.LEVEL_1,
                ),
            ),
            dict(
                organization=ong,
                type=CampaignType.NGO_PROJECT,
                category=CampaignCategory.EDUCATION,
                title="Une école pour le village de Bangou",
                summary="Construire trois salles de classe pour 120 enfants déscolarisés.",
                description=(
                    "Le projet vise à construire et équiper trois salles de classe "
                    "afin d'accueillir 120 enfants aujourd'hui privés d'école."
                ),
                target_amount=Decimal("8000000"),
                country="CM",
            ),
            dict(
                organization=ong,
                type=CampaignType.NGO_PROJECT,
                category=CampaignCategory.DEVELOPMENT,
                title="Accès à l'eau potable — forages solaires",
                summary="Installer 5 forages solaires pour 2 000 habitants.",
                description=(
                    "Installation de forages équipés de pompes solaires pour garantir "
                    "un accès durable à l'eau potable."
                ),
                target_amount=Decimal("6000000"),
                country="TG",
            ),
        ]

        for d in demos:
            patient_data = d.pop("patient", None)
            campaign, created = Campaign.objects.get_or_create(
                title=d["title"],
                defaults=dict(
                    **d,
                    status=CampaignStatus.ACTIVE,
                    published_at=timezone.now(),
                    deadline=date.today() + timedelta(days=45),
                    consent_form_path="legal-docs/demo-consent.pdf",
                ),
            )
            if created and patient_data:
                PatientProfile.objects.create(campaign=campaign, **patient_data)
            if created:
                Donation.objects.create(
                    campaign=campaign,
                    amount=Decimal("50000"),
                    donor_name="Diaspora CM",
                    gateway=PaymentGateway.FLUTTERWAVE,
                    status=DonationStatus.CONFIRMED,
                )
                Donation.objects.create(
                    campaign=campaign,
                    amount=Decimal("25000"),
                    is_anonymous=True,
                    gateway=PaymentGateway.CAMPAY,
                    status=DonationStatus.CONFIRMED,
                )

        self.stdout.write(self.style.SUCCESS("Données de démonstration créées."))
