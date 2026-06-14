from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(
        source="organization.name", read_only=True, default=None
    )
    organization_type = serializers.CharField(
        source="organization.type", read_only=True, default=None
    )

    class Meta:
        model = Profile
        fields = [
            "id",
            "supabase_user_id",
            "email",
            "full_name",
            "role",
            "organization",
            "organization_name",
            "organization_type",
            "locale",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "supabase_user_id", "email", "role", "organization"]
