from typing import Any

from rest_framework import serializers

from apps.accounts.models import UserRole
from .models import AreaState, AuditEvent, Damage, DamageType, GisPoint, NetworkType, OrderKind, Photo, RequestArchive


class GisPointWriteSerializer(serializers.Serializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()


class DamageWriteSerializer(serializers.Serializer):
    districtId = serializers.CharField(required=False)
    address = serializers.CharField(required=False, allow_blank=True)
    networkType = serializers.ChoiceField(choices=NetworkType.choices, required=False)
    detectedAt = serializers.DateField(required=False)
    fixedAt = serializers.DateField(required=False, allow_null=True)
    orderNumber = serializers.CharField(required=False, allow_blank=True)
    orderOpenedAt = serializers.DateField(required=False, allow_null=True)
    orderValidUntil = serializers.DateField(required=False, allow_null=True)
    heatSource = serializers.CharField(required=False, allow_blank=True)
    damageType = serializers.ChoiceField(choices=DamageType.choices, required=False)
    disconnectedAddresses = serializers.CharField(required=False, allow_blank=True)
    damageDescription = serializers.CharField(required=False, allow_blank=True)
    orderKind = serializers.ChoiceField(choices=OrderKind.choices, required=False, allow_null=True)
    greenZoneArea = serializers.IntegerField(required=False)
    improvementMain = serializers.IntegerField(required=False)
    improvementInnerRoad = serializers.IntegerField(required=False)
    improvementSidewalk = serializers.IntegerField(required=False)
    improvementBlindArea = serializers.IntegerField(required=False)
    curbCount = serializers.IntegerField(required=False)
    areaState = serializers.ChoiceField(choices=AreaState.choices, required=False)
    contractorType = serializers.CharField(required=False, allow_blank=True, max_length=512)
    contractNumber = serializers.CharField(required=False, allow_blank=True)
    contractorRequestDate = serializers.DateField(required=False, allow_null=True)
    note = serializers.CharField(required=False, allow_blank=True)
    orderClosedAt = serializers.DateField(required=False, allow_null=True)
    archived = serializers.BooleanField(required=False)


class DamageOpenOrderSerializer(serializers.Serializer):
    orderNumber = serializers.CharField(required=False, allow_blank=True, max_length=64)
    orderOpenedAt = serializers.DateField(required=False, allow_null=True)
    orderValidUntil = serializers.DateField(required=False, allow_null=True)


class OrderWriteSerializer(serializers.Serializer):
    orderNumber = serializers.CharField(required=False, allow_blank=True, max_length=64)
    address = serializers.CharField(required=False, allow_blank=True)
    orderKind = serializers.ChoiceField(choices=OrderKind.choices, required=False, allow_null=True)
    openedAt = serializers.DateField(required=False, allow_null=True)
    validUntil = serializers.DateField(required=False, allow_null=True)
    closedAt = serializers.DateField(required=False, allow_null=True)
    areaState = serializers.ChoiceField(choices=AreaState.choices, required=False)
    contractorType = serializers.CharField(required=False, allow_blank=True, max_length=512)
    contractNumber = serializers.CharField(required=False, allow_blank=True)
    contractorRequestDate = serializers.DateField(required=False, allow_null=True)
    note = serializers.CharField(required=False, allow_blank=True)
    greenZoneArea = serializers.IntegerField(required=False)
    curbCount = serializers.IntegerField(required=False)
    improvementMain = serializers.IntegerField(required=False)
    improvementInnerRoad = serializers.IntegerField(required=False)
    improvementSidewalk = serializers.IntegerField(required=False)
    improvementBlindArea = serializers.IntegerField(required=False)


class UserWriteSerializer(serializers.Serializer):
    ldapLogin = serializers.CharField(required=False, max_length=150)
    fullName = serializers.CharField(required=False, allow_blank=True, max_length=255)
    role = serializers.ChoiceField(choices=UserRole.choices, required=False)
    districtId = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    isActive = serializers.BooleanField(required=False)
    # Передан ключ — пароль меняется (в т.ч. на пустой); ключа нет — пароль не трогаем.
    password = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False, max_length=128)


class UserCreateSerializer(serializers.Serializer):
    ldapLogin = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=128, allow_blank=True, trim_whitespace=False)
    fullName = serializers.CharField(required=False, allow_blank=True, max_length=255, default='')
    role = serializers.ChoiceField(choices=UserRole.choices)
    districtId = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    isActive = serializers.BooleanField(required=False, default=True)


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
        'url': photo.file.url,
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
        'disconnectedAddresses': item.disconnected_addresses,
        'damageDescription': item.damage_description,
        'orderKind': item.order_kind,
        'greenZoneArea': item.green_zone_area,
        'improvementMain': item.improvement_main,
        'improvementInnerRoad': item.improvement_inner_road,
        'improvementSidewalk': item.improvement_sidewalk,
        'improvementBlindArea': item.improvement_blind_area,
        'curbCount': item.curb_count,
        'areaState': item.area_state,
        'contractorType': item.contractor_type,
        'contractNumber': item.contract_number,
        'contractorRequestDate': item.contractor_request_date,
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
        'greenZoneArea': item.green_zone_area,
        'improvementMain': item.improvement_main,
        'improvementInnerRoad': item.improvement_inner_road,
        'improvementSidewalk': item.improvement_sidewalk,
        'improvementBlindArea': item.improvement_blind_area,
        'curbCount': item.curb_count,
        'areaState': item.area_state,
        'contractorType': item.contractor_type,
        'contractNumber': item.contract_number,
        'contractorRequestDate': item.contractor_request_date,
        'note': item.note,
        'gisPoint': serialize_gis_point(point, item.address),
        'photos': [serialize_photo(photo) for photo in item.photos.all()],
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


class RequestArchiveWriteSerializer(serializers.Serializer):
    requestDate = serializers.DateField(required=False, allow_null=True)
    contractor = serializers.CharField(required=False, allow_blank=True, max_length=512)
    addresses = serializers.CharField(required=False, allow_blank=True)


def serialize_request_archive(item: RequestArchive) -> dict[str, Any]:
    return {
        'id': item.id,
        'districtId': item.district_id,
        'requestDate': item.request_date,
        'contractor': item.contractor,
        'addresses': item.addresses,
        'fileName': item.file_name,
        'fileUrl': item.file.url if item.file else '',
        'createdAt': item.created_at,
    }
