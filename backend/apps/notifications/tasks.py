from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

from .models import EmailLog


@shared_task(ignore_result=True)
def send_email(kind: str, recipient: str, subject: str, body: str) -> None:
    """Tâche générique d'envoi d'e-mail + journalisation."""
    if not recipient:
        return
    success, error = True, ""
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [recipient], fail_silently=False)
    except Exception as exc:  # pragma: no cover - dépend du SMTP
        success, error = False, str(exc)
    EmailLog.objects.create(
        kind=kind, recipient=recipient, subject=subject, success=success, error=error
    )
