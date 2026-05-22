from __future__ import annotations

from datetime import date, timedelta

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import District
from .models import AreaState, AuditEvent, ContractorType, Damage, DamageType, NetworkType, OrderKind


DAMAGE_FIELD_MAP = {
    'districtId': 'district_id',
    'address': 'address',
    'networkType': 'network_type',
    'detectedAt': 'detected_at',
    'fixedAt': 'fixed_at',
    'orderNumber': 'order_number',
    'orderOpenedAt': 'order_opened_at',
    'orderValidUntil': 'order_valid_until',
    'heatSource': 'heat_source',
    'damageType': 'damage_type',
    'disconnectedConsumers': 'disconnected_consumers',
    'damageDescription': 'damage_description',
    'orderKind': 'order_kind',
    'greenZoneArea': 'green_zone_area',
    'asphaltArea': 'asphalt_area',
    'improvementMain': 'improvement_main',
    'improvementInnerRoad': 'improvement_inner_road',
    'improvementSidewalk': 'improvement_sidewalk',
    'improvementBlindArea': 'improvement_blind_area',
    'curbCount': 'curb_count',
    'areaState': 'area_state',
    'contractorType': 'contractor_type',
    'contractNumber': 'contract_number',
    'contractorRequestDate': 'contractor_request_date',
    'plannedFinishDate': 'planned_finish_date',
    'note': 'note',
    'orderClosedAt': 'order_closed_at',
    'archived': 'archived',
}

ORDER_FIELD_MAP = {
    'address': 'address',
    'orderKind': 'order_kind',
    'areaState': 'area_state',
    'contractorName': 'contractor_name',
    'contractNumber': 'contract_number',
    'plannedFinishDate': 'planned_finish_date',
    'note': 'note',
}


def default_damage_payload(user) -> dict:
    today = timezone.localdate()
    default_district = getattr(getattr(user, 'profile', None), 'district_id', None)
    if not default_district:
        district = District.objects.order_by('id').first()
        default_district = district.id if district else None

    return {
        'districtId': default_district,
        'address': 'Новый адрес',
        'networkType': NetworkType.OT,
        'detectedAt': today,
        'fixedAt': None,
        'orderNumber': f'ORD-{today.year}-{today.month:02d}-{today.day:02d}',
        'orderOpenedAt': today,
        'orderValidUntil': today + timedelta(days=30),
        'heatSource': '',
        'damageType': DamageType.CURRENT,
        'disconnectedConsumers': 0,
        'damageDescription': '',
        'orderKind': OrderKind.CURRENT,
        'greenZoneArea': 0,
        'asphaltArea': 0,
        'improvementMain': False,
        'improvementInnerRoad': False,
        'improvementSidewalk': False,
        'improvementBlindArea': False,
        'curbCount': 0,
        'areaState': AreaState.IN_PROGRESS,
        'contractorType': ContractorType.CONTRACTOR,
        'contractNumber': '',
        'contractorRequestDate': None,
        'plannedFinishDate': today + timedelta(days=14),
        'note': '',
        'orderClosedAt': None,
        'archived': False,
    }


def _stringify(value) -> str:
    if value is None:
        return ''
    if isinstance(value, (date,)):
        return value.isoformat()
    return str(value)


@transaction.atomic
def apply_damage_changes(damage: Damage, payload: dict, user, *, entity_type: str = 'damage') -> Damage:
    changes: list[tuple[str, object, object]] = []

    for payload_key, model_key in DAMAGE_FIELD_MAP.items():
        if payload_key not in payload:
            continue

        new_value = payload[payload_key]
        old_value = getattr(damage, model_key)
        if old_value != new_value:
            setattr(damage, model_key, new_value)
            changes.append((model_key, old_value, new_value))

    damage.save()

    for field_name, old_value, new_value in changes:
        create_audit_event(
            entity_type=entity_type,
            entity_id=damage.id,
            user=user,
            field_name=field_name,
            old_value=_stringify(old_value),
            new_value=_stringify(new_value),
        )

    return damage


@transaction.atomic
def apply_order_changes(damage: Damage, payload: dict, user) -> Damage:
    changes: list[tuple[str, object, object]] = []

    for payload_key, model_key in ORDER_FIELD_MAP.items():
        if payload_key not in payload:
            continue

        new_value = payload[payload_key]
        old_value = getattr(damage, model_key)
        if old_value != new_value:
            setattr(damage, model_key, new_value)
            changes.append((model_key, old_value, new_value))

    damage.save()

    for field_name, old_value, new_value in changes:
        create_audit_event(
            entity_type='order',
            entity_id=damage.id,
            user=user,
            field_name=field_name,
            old_value=_stringify(old_value),
            new_value=_stringify(new_value),
        )

    return damage


def create_audit_event(*, entity_type: str, entity_id: str, user, field_name: str, old_value: str, new_value: str) -> AuditEvent:
    full_name = ''
    if user and user.is_authenticated:
        profile = getattr(user, 'profile', None)
        full_name = getattr(profile, 'full_name', '') or user.username

    return AuditEvent.objects.create(
        entity_type=entity_type,
        entity_id=entity_id,
        user=user if getattr(user, 'is_authenticated', False) else None,
        user_name=full_name,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
    )
