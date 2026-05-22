from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import UserProfile, UserRole

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    ldapLogin = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=128)


class UserResponseSerializer(serializers.Serializer):
    id = serializers.CharField()
    ldapLogin = serializers.CharField()
    fullName = serializers.CharField()
    role = serializers.ChoiceField(choices=UserRole.choices)
    districtId = serializers.CharField(allow_null=True)
    isActive = serializers.BooleanField()
    lastLoginAt = serializers.DateTimeField(allow_null=True)


def serialize_user(user: User) -> dict:
    profile = getattr(user, 'profile', None)
    if profile is None:
        role = UserRole.ADMIN if user.is_superuser else UserRole.DISTRICT_DAMAGE
        profile = UserProfile.objects.create(
            user=user,
            full_name=user.get_full_name() or user.username,
            role=role,
        )

    data = {
        'id': str(user.id),
        'ldapLogin': user.username,
        'fullName': profile.full_name or user.get_full_name() or user.username,
        'role': profile.role,
        'districtId': profile.district_id,
        'isActive': user.is_active,
        'lastLoginAt': user.last_login,
    }

    serializer = UserResponseSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    return serializer.data
