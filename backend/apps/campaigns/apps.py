from django.apps import AppConfig


class CampaignsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.campaigns"
    verbose_name = "Appels à l'aide & projets"

    def ready(self):
        from . import signals  # noqa: F401
