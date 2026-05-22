from django.conf import settings
from django.db import models


class District(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class UserRole(models.TextChoices):
    DISTRICT_DAMAGE = 'district_damage', 'Район: повреждения'
    DISTRICT_ORDER = 'district_order', 'Район: ордера'
    OOPPPR = 'oopppr', 'ООППР'
    FULL_ACCESS = 'full_access', 'Полный доступ'
    ADMIN = 'admin', 'Администратор'


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=32, choices=UserRole.choices, default=UserRole.DISTRICT_DAMAGE)
    district = models.ForeignKey(District, null=True, blank=True, on_delete=models.SET_NULL, related_name='users')

    class Meta:
        ordering = ['user__username']

    def __str__(self) -> str:
        return f'{self.user.username} ({self.role})'
