"""Jeu de données de démonstration (campagnes publiques, organisations, dons, comptes utilisateurs)."""
from datetime import date, timedelta
from decimal import Decimal
import json
import urllib.error
import urllib.request
import uuid

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import Profile, Role
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
    help = "Crée un jeu de données de démonstration pour la plateforme Africœur (organisations, comptes Supabase, campagnes, dons)."

    def _create_supabase_demo_user(
        self, email: str, password: str, role: str, full_name: str, organization: Organization
    ) -> Profile:
        supabase_url = getattr(settings, "SUPABASE_URL", "").rstrip("/")
        service_key = getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "")

        supabase_user_id = None

        if (
            supabase_url
            and service_key
            and "YOUR_PROJECT" not in supabase_url
            and "YOUR_SERVICE_ROLE_KEY" not in service_key
        ):
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {service_key}",
                "apikey": service_key,
            }

            url = f"{supabase_url}/auth/v1/admin/users"
            payload = json.dumps(
                {
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "app_metadata": {"role": role},
                    "user_metadata": {"full_name": full_name},
                }
            ).encode("utf-8")

            req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
            try:
                with urllib.request.urlopen(req) as resp:
                    res_data = json.loads(resp.read().decode("utf-8"))
                    supabase_user_id = res_data.get("id")
                    self.stdout.write(
                        self.style.SUCCESS(f"→ Utilisateur Supabase Auth créé : {email}")
                    )
            except urllib.error.HTTPError as e:
                body = e.read().decode("utf-8")
                if e.code == 422 or "already" in body.lower():
                    list_url = f"{supabase_url}/auth/v1/admin/users"
                    list_req = urllib.request.Request(list_url, headers=headers, method="GET")
                    try:
                        with urllib.request.urlopen(list_req) as list_resp:
                            users_data = json.loads(list_resp.read().decode("utf-8"))
                            users = users_data.get("users", [])
                            for u in users:
                                if u.get("email") == email:
                                    supabase_user_id = u.get("id")
                                    break
                            if supabase_user_id:
                                update_url = f"{supabase_url}/auth/v1/admin/users/{supabase_user_id}"
                                up_payload = json.dumps({"app_metadata": {"role": role}}).encode("utf-8")
                                up_req = urllib.request.Request(
                                    update_url, data=up_payload, headers=headers, method="PUT"
                                )
                                try:
                                    urllib.request.urlopen(up_req)
                                except Exception:
                                    pass
                                self.stdout.write(
                                    self.style.SUCCESS(f"→ Utilisateur Supabase Auth existant récupéré : {email}")
                                )
                    except Exception as list_err:
                        self.stdout.write(
                            self.style.WARNING(f"⚠ Impossible de lister les utilisateurs Supabase : {list_err}")
                        )
                else:
                    self.stdout.write(
                        self.style.WARNING(f"⚠ Supabase Auth API a renvoyé HTTP {e.code} pour {email}: {body}")
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"⚠ Impossible de contacter Supabase Auth pour {email}: {e}")
                )

        if not supabase_user_id:
            profile = Profile.objects.filter(email=email).first()
            if profile:
                supabase_user_id = str(profile.supabase_user_id)
            else:
                supabase_user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, email))
            self.stdout.write(
                self.style.WARNING(f"→ Profil local configuré (Supabase offline/non configuré) : {email}")
            )

        profile = Profile.objects.filter(email=email).first() or Profile.objects.filter(
            supabase_user_id=supabase_user_id
        ).first()

        if profile:
            profile.supabase_user_id = supabase_user_id
            profile.email = email
            profile.full_name = full_name
            profile.role = role
            profile.organization = organization
            profile.is_active = True
            profile.save()
        else:
            profile = Profile.objects.create(
                supabase_user_id=supabase_user_id,
                email=email,
                full_name=full_name,
                role=role,
                organization=organization,
                is_active=True,
            )

        return profile

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

        users_demo = [
            dict(
                email="hopital.demo@africoeur.org",
                password="Password123!",
                role=Role.HOSPITAL_AGENT,
                full_name="Agent Hôpital Central",
                organization=hopital,
            ),
            dict(
                email="ong.demo@africoeur.org",
                password="Password123!",
                role=Role.NGO_AGENT,
                full_name="Agent Solidarité Santé",
                organization=ong,
            ),
            dict(
                email="admin.demo@africoeur.org",
                password="Password123!",
                role=Role.ADMIN,
                full_name="Administrateur Africœur",
                organization=None,
            ),
        ]

        for u in users_demo:
            self._create_supabase_demo_user(**u)

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

        self.stdout.write(
            self.style.SUCCESS(
                "\nDonnées de démonstration créées avec succès !\n"
                "Comptes de démonstration d'organisation disponibles :\n"
                "  - Hôpital Central (Assistant social) : hopital.demo@africoeur.org / Password123!\n"
                "  - ONG Solidarité Santé (Agent ONG)    : ong.demo@africoeur.org / Password123!\n"
            )
        )

