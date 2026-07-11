from typing import Any

from rest_framework import serializers

from apps.accounts.models import UserRole
from .models import AreaState, AuditEvent, ContractorType, Damage, DamageType, GisPoint, NetworkType, OrderKind, Photo


class GisPointWriteSerializer(serializers.Serializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()


class DamageWriteSerializer(serializers.Serializer):
    districtId = serializers.CharField(required=False)
    address = serializers.CharField(required=False)
    networkType = serializers.ChoiceField(choices=NetworkType.choices, required=False)
    detectedAt = serializers.DateField(required=False)
    fixedAt = serializers.DateField(required=False, allow_null=True)
    orderNumber = serializers.CharField(required=False)
    orderOpenedAt = serializers.DateField(required=False)
    orderValidUntil = serializers.DateField(required=False)
    heatSource = serializers.CharField(required=False)
    damageType = serializers.ChoiceField(choices=DamageType.choices, required=False)
    disconnectedConsumers = serializers.IntegerField(required=False)
    damageDescription = serializers.CharField(required=False)
    orderKind = serializers.ChoiceField(choices=OrderKind.choices, required=False)
    greenZoneArea = serializers.IntegerField(required=False)
    asphaltArea = serializers.IntegerField(required=False)
    improvementMain = serializers.BooleanField(required=False)
    improvementInnerRoad = serializers.BooleanField(required=False)
    improvementSidewalk = serializers.BooleanField(required=False)
    improvementBlindArea = serializers.BooleanField(required=False)
    curbCount = serializers.IntegerField(required=False)
    areaState = serializers.ChoiceField(choices=AreaState.choices, required=False)
    contractorType = serializers.ChoiceField(choices=ContractorType.choices, required=False)
    contractNumber = serializers.CharField(required=False, allow_blank=True)
    contractorRequestDate = serializers.DateField(required=False, allow_null=True)
    plannedFinishDate = serializers.DateField(required=False, allow_null=True)
    note = serializers.CharField(required=False, allow_blank=True)
    orderClosedAt = serializers.DateField(required=False, allow_null=True)
    archived = serializers.BooleanField(required=False)


class OrderWriteSerializer(serializers.Serializer):
    address = serializers.CharField(required=False)
    orderKind = serializers.ChoiceField(choices=OrderKind.choices, required=False)
    areaState = serializers.ChoiceField(choices=AreaState.choices, required=False)
    contractorName = serializers.CharField(required=False, allow_blank=True)
    contractNumber = serializers.CharField(required=False, allow_blank=True)
    plannedFinishDate = serializers.DateField(required=False, allow_null=True)
    note = serializers.CharField(required=False, allow_blank=True)


class UserWriteSerializer(serializers.Serializer):
    ldapLogin = serializers.CharField(required=False, max_length=150)
    fullName = serializers.CharField(required=False, allow_blank=True, max_length=255)
    role = serializers.ChoiceField(choices=UserRole.choices, required=False)
    districtId = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    isActive = serializers.BooleanField(required=False)


def serialize_gis_point(point: GisPoint | None, address: str = '') -> dict[str, Any] | None:
    if point is None:
        return None
    return {
        'id': point.id,
        'address': address or point.address,
        'latitude': point.latitude,
        'longitude': point.longitude,
        'gisObjectId': point.gis_object_id,
        'mapUrl': point.map_url,
    }


def serialize_photo(photo: Photo) -> dict[str, Any]:
    return {
        'id': photo.id,
        'url': photo.url,
        'fileName': photo.file_name,
        'uploadedAt': photo.uploaded_at,
    }


def serialize_damage(item: Damage) -> dict[str, Any]:
    point = getattr(item, 'gis_point', None)
    return {
        'id': item.id,
        'districtId': item.district_id,
        'address': item.address,
        'networkType': item.network_type,
        'detectedAt': item.detected_at,
        'fixedAt': item.fixed_at,
        'orderNumber': item.order_number,
        'orderOpenedAt': item.order_opened_at,
        'orderValidUntil': item.order_valid_until,
        'heatSource': item.heat_source,
        'damageType': item.damage_type,
        'disconnectedConsumers': item.disconnected_consumers,
        'damageDescription': item.damage_description,
        'orderKind': item.order_kind,
        'greenZoneArea': item.green_zone_area,
        'asphaltArea': item.asphalt_area,
        'improvementMain': item.improvement_main,
        'improvementInnerRoad': item.improvement_inner_road,
        'improvementSidewalk': item.improvement_sidewalk,
        'improvementBlindArea': item.improvement_blind_area,
        'curbCount': item.curb_count,
        'areaState': item.area_state,
        'contractorType': item.contractor_type,
        'contractNumber': item.contract_number,
        'contractorRequestDate': item.contractor_request_date,
        'plannedFinishDate': item.planned_finish_date,
        'note': item.note,
        'orderClosedAt': item.order_closed_at,
        'gisPoint': serialize_gis_point(point, item.address),
        'photos': [serialize_photo(photo) for photo in item.photos.all()],
        'createdAt': item.created_at,
        'updatedAt': item.updated_at,
        'archived': item.archived,
    }


def serialize_order(item: Damage) -> dict[str, Any]:
    point = getattr(item, 'gis_point', None)
    return {
        'id': item.id,
        'districtId': item.district_id,
        'orderNumber': item.order_number,
        'address': item.address,
        'orderKind': item.order_kind,
        'openedAt': item.order_opened_at,
        'validUntil': item.order_valid_until,
        'closedAt': item.order_closed_at,
        'areaState': item.area_state,
        'contractorType': item.contractor_type,
        'contractorName': item.contractor_name or item.contractor_type,
        'contractNumber': item.contract_number,
        'plannedFinishDate': item.planned_finish_date,
        'note': item.note,
        'gisPoint': serialize_gis_point(point, item.address),
        'archived': item.archived,
        'createdAt': item.created_at,
        'updatedAt': item.updated_at,
    }


def serialize_audit_event(item: AuditEvent) -> dict[str, Any]:
    return {
        'id': item.id,
        'entityType': item.entity_type,
        'entityId': item.entity_id,
        'userId': str(item.user_id) if item.user_id else '',
        'userName': item.user_name,
        'fieldName': item.field_name,
        'oldValue': item.old_value,
        'newValue': item.new_value,
        'createdAt': item.created_at,
    }
