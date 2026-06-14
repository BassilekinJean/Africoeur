from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task(ignore_result=True)
def send_donation_receipt(donation_id: str) -> None:
    """Envoie le reçu de don automatique par e-mail après confirmation."""
    from .models import Donation, DonationStatus

    try:
        donation = Donation.objects.select_related("campaign").get(id=donation_id)
    except Donation.DoesNotExist:
        return
    if donation.status != DonationStatus.CONFIRMED or not donation.donor_email:
        return

    subject = "Africœur — Reçu de votre don"
    body = (
        f"Bonjour,\n\n"
        f"Nous confirmons la réception de votre don de "
        f"{donation.amount} {donation.currency} pour l'appel « {donation.campaign.title} ».\n\n"
        f"Référence de transaction : {donation.transaction_ref}\n\n"
        f"Merci de votre générosité.\n— L'équipe Africœur"
    )
    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [donation.donor_email],
        fail_silently=True,
    )
    donation.receipt_sent = True
    donation.save(update_fields=["receipt_sent", "updated_at"])
