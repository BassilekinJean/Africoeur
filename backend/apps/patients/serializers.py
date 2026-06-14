from rest_framework import serializers

from .models import PatientProfile


class PatientPublicSerializer(serializers.ModelSerializer):
    """
    Sérialiseur public : ne renvoie JAMAIS le chemin de la photo originale ni
    de la vidéo pour les niveaux inférieurs. La décision d'affichage est prise
    côté serveur (impossible d'élever le niveau depuis le navigateur).
    """

    display_name = serializers.CharField(source="public_display_name", read_only=True)
    photo_path = serializers.SerializerMethodField()
    video_path = serializers.SerializerMethodField()

    class Meta:
        model = PatientProfile
        fields = [
            "display_name",
            "age",
            "is_minor",
            "general_situation",
            "display_level",
            "photo_path",
            "video_path",
        ]

    def get_photo_path(self, obj) -> str:
        return obj.public_photo_path()

    def get_video_path(self, obj) -> str:
        return obj.public_video_path()


class PatientPartnerSerializer(serializers.ModelSerializer):
    """Vue back-office (agent propriétaire / admin) — sans contacts privés."""

    class Meta:
        model = PatientProfile
        fields = [
            "id",
            "campaign",
            "first_name",
            "last_name_initial",
            "age",
            "is_minor",
            "general_situation",
            "display_level",
            "photo_path",
            "photo_blurred_path",
            "video_path",
            "consent_signed",
            "created_at",
        ]
        read_only_fields = ["id", "display_level"]
