import uuid

from django.conf import settings
from django.db import models

from apps.accounts.models import District


def generate_damage_id() -> str:
    return f'd-{uuid.uuid4().hex[:8]}'


def generate_gis_id() -> str:
    return f'gp-{uuid.uuid4().hex[:8]}'


def generate_photo_id() -> str:
    return f'p-{uuid.uuid4().hex[:8]}'


def generate_audit_id() -> str:
    return f'a-{uuid.uuid4().hex[:8]}'


class NetworkType(models.TextChoices):
    OT = 'ОТ', 'ОТ'
    GVS = 'ГВС', 'ГВС'


class DamageType(models.TextChoices):
    CURRENT = 'Текущее', 'Текущее'
    HYDRAULIC = 'Гидравлическое', 'Гидравлическое'


class OrderKind(models.TextChoices):
    CURRENT = 'Текущий', 'Текущий'
    GUARANTEE = 'Гарантийный', 'Гарантийный'


class AreaState(models.TextChoices):
    IN_PROGRESS = 'В РАБОТЕ', 'В РАБОТЕ'
    READY_TO_CLOSE = 'ГОТОВ К ЗАКРЫТИЮ', 'ГОТОВ К ЗАКРЫТИЮ'


class ContractorType(models.TextChoices):
    CONTRACTOR = 'Подрядчик', 'Подрядчик'
    URTS = 'УРТС', 'УРТС'
    SECTION = 'Участок', 'Участок'


class Damage(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=generate_damage_id, editable=False)
    district = models.ForeignKey(District, on_delete=models.PROTECT, related_name='damages')
    address = models.CharField(max_length=512)
    network_type = models.CharField(max_length=8, choices=NetworkType.choices)
    detected_at = models.DateField()
    fixed_at = models.DateField(null=True, blank=True)
    order_number = models.CharField(max_length=64, blank=True, default='')
    order_opened_at = models.DateField(null=True, blank=True)
    order_valid_until = models.DateField(null=True, blank=True)
    heat_source = models.CharField(max_length=512)
    damage_type = models.CharField(max_length=32, choices=DamageType.choices)
    disconnected_addresses = models.TextField(blank=True, default='')
    damage_description = models.TextField()
    order_kind = models.CharField(max_length=32, choices=OrderKind.choices, null=True, blank=True)
    green_zone_area = models.IntegerField(default=0)
    asphalt_area = models.IntegerField(default=0)
    improvement_main = models.BooleanField(default=False)
    improvement_inner_road = models.BooleanField(default=False)
    improvement_sidewalk = models.BooleanField(default=False)
    improvement_blind_area = models.BooleanField(default=False)
    curb_count = models.IntegerField(default=0)
    area_state = models.CharField(max_length=32, choices=AreaState.choices)
    contractor_type = models.CharField(max_length=32, choices=ContractorType.choices)
    contract_number = models.CharField(max_length=128, blank=True)
    contractor_request_date = models.DateField(null=True, blank=True)
    planned_finish_date = models.DateField(null=True, blank=True)
    note = models.TextField(blank=True)
    order_closed_at = models.DateField(null=True, blank=True)
    archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.id} {self.address}'


class GisPoint(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=generate_gis_id, editable=False)
    damage = models.OneToOneField(Damage, on_delete=models.CASCADE, related_name='gis_point')
    address = models.CharField(max_length=512)
    latitude = models.FloatField()
    longitude = models.FloatField()
    gis_object_id = models.CharField(max_length=128)
    map_url = models.URLField(max_length=1024, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


class Photo(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=generate_photo_id, editable=False)
    damage = models.ForeignKey(Damage, on_delete=models.CASCADE, related_name='photos')
    file = models.FileField(upload_to='damage_photos/%Y/%m/')
    file_name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']


class AuditEvent(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=generate_audit_id, editable=False)
    entity_type = models.CharField(max_length=64)
    entity_id = models.CharField(max_length=64)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    user_name = models.CharField(max_length=255)
    field_name = models.CharField(max_length=128)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['entity_type', 'entity_id'])]

    def __str__(self) -> str:
        return f'{self.entity_type}:{self.entity_id} {self.field_name}'
