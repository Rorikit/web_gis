from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserProfile, UserRole

User = get_user_model()


@receiver(post_save, sender=User)
def create_or_update_profile(sender, instance, created, **kwargs):
    if created:
        role = UserRole.ADMIN if instance.is_superuser else UserRole.DISTRICT_DAMAGE
        UserProfile.objects.create(
            user=instance,
            full_name=instance.get_full_name() or instance.username,
            role=role,
        )
        return

    profile = getattr(instance, 'profile', None)
    if profile is None:
        role = UserRole.ADMIN if instance.is_superuser else UserRole.DISTRICT_DAMAGE
        UserProfile.objects.create(
            user=instance,
            full_name=instance.get_full_name() or instance.username,
            role=role,
        )
