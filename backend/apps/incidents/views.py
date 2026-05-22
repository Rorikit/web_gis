from datetime import datetime

from django.contrib.auth import get_user_model
from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import District, UserRole
from apps.accounts.permissions import can_access_district, get_user_role, has_any_permission, has_permission
from apps.accounts.serializers import serialize_user

from .models import AuditEvent, Damage, GisPoint
from .serializers import DamageWriteSerializer, GisPointWriteSerializer, OrderWriteSerializer, UserWriteSerializer, serialize_audit_event, serialize_damage, serialize_order
from .services import apply_damage_changes, apply_order_changes, create_audit_event, default_damage_payload

User = get_user_model()


def parse_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.lower() in {'1', 'true', 'yes', 'y', 'on'}


def base_damage_queryset() -> QuerySet[Damage]:
    return Damage.objects.select_related('district').select_related('gis_point').prefetch_related('photos')


def filter_by_district_access(queryset: QuerySet[Damage], user) -> QuerySet[Damage]:
    role = get_user_role(user)
    if role in {UserRole.ADMIN, UserRole.FULL_ACCESS, UserRole.OOPPPR}:
        return queryset

    profile = getattr(user, 'profile', None)
    district_id = getattr(profile, 'district_id', None)
    if not district_id:
        return queryset.none()

    return queryset.filter(district_id=district_id)


def require_permission(request, permission_name: str) -> Response | None:
    if not has_permission(request.user, permission_name):
        return Response({'detail': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    return None


def require_any_permission(request, permission_names: tuple[str, ...]) -> Response | None:
    if not has_any_permission(request.user, permission_names):
        return Response({'detail': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    return None


def get_damage_or_404(damage_id: str) -> Damage:
    return get_object_or_404(base_damage_queryset(), pk=damage_id)


def resolve_district_id(raw_district_id: str | None, user) -> str | None:
    if raw_district_id:
        return raw_district_id

    profile = getattr(user, 'profile', None)
    if getattr(profile, 'district_id', None):
        return profile.district_id

    first_district = District.objects.order_by('id').first()
    return first_district.id if first_district else None


class DamageListCreateView(APIView):
    def get(self, request):
        denied = require_permission(request, 'damage.read')
        if denied:
            return denied

        archived = parse_bool(request.query_params.get('archived'), default=False)
        queryset = base_damage_queryset().filter(archived=archived)
        queryset = filter_by_district_access(queryset, request.user)

        return Response([serialize_damage(item) for item in queryset], status=status.HTTP_200_OK)

    def post(self, request):
        denied = require_permission(request, 'damage.create')
        if denied:
            return denied

        serializer = DamageWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        payload = default_damage_payload(request.user)
        payload.update(serializer.validated_data)

        district_id = resolve_district_id(payload.get('districtId'), request.user)
        if not district_id:
            return Response({'detail': 'Не задан район'}, status=status.HTTP_400_BAD_REQUEST)

        district = District.objects.filter(id=district_id).first()
        if district is None:
            return Response({'detail': 'Район не найден'}, status=status.HTTP_400_BAD_REQUEST)

        if not can_access_district(request.user, district.id):
            return Response({'detail': 'Недостаточно прав для района'}, status=status.HTTP_403_FORBIDDEN)

        payload['districtId'] = district.id

        model_payload = {
            'district_id': payload['districtId'],
            'address': payload['address'],
            'network_type': payload['networkType'],
            'detected_at': payload['detectedAt'],
            'fixed_at': payload['fixedAt'],
            'order_number': payload['orderNumber'],
            'order_opened_at': payload['orderOpenedAt'],
            'order_valid_until': payload['orderValidUntil'],
            'heat_source': payload['heatSource'],
            'damage_type': payload['damageType'],
            'disconnected_consumers': payload['disconnectedConsumers'],
            'damage_description': payload['damageDescription'],
            'order_kind': payload['orderKind'],
            'green_zone_area': payload['greenZoneArea'],
            'asphalt_area': payload['asphaltArea'],
            'improvement_main': payload['improvementMain'],
            'improvement_inner_road': payload['improvementInnerRoad'],
            'improvement_sidewalk': payload['improvementSidewalk'],
            'improvement_blind_area': payload['improvementBlindArea'],
            'curb_count': payload['curbCount'],
            'area_state': payload['areaState'],
            'contractor_type': payload['contractorType'],
            'contract_number': payload['contractNumber'],
            'contractor_request_date': payload['contractorRequestDate'],
            'planned_finish_date': payload['plannedFinishDate'],
            'note': payload['note'],
            'order_closed_at': payload['orderClosedAt'],
            'archived': payload['archived'],
        }

        damage = Damage.objects.create(**model_payload)
        create_audit_event(
            entity_type='damage',
            entity_id=damage.id,
            user=request.user,
            field_name='__created__',
            old_value='',
            new_value='created',
        )
        damage = get_damage_or_404(damage.id)
        return Response(serialize_damage(damage), status=status.HTTP_201_CREATED)


class DamageDetailView(APIView):
    def get(self, request, damage_id: str):
        denied = require_permission(request, 'damage.read')
        if denied:
            return denied

        damage = get_damage_or_404(damage_id)
        if not can_access_district(request.user, damage.district_id):
            return Response({'detail': 'Недостаточно прав для района'}, status=status.HTTP_403_FORBIDDEN)

        return Response(serialize_damage(damage), status=status.HTTP_200_OK)

    def put(self, request, damage_id: str):
        denied = require_permission(request, 'damage.update')
        if denied:
            return denied

        damage = get_damage_or_404(damage_id)
        if not can_access_district(request.user, damage.district_id):
            return Response({'detail': 'Недостаточно прав для района'}, status=status.HTTP_403_FORBIDDEN)

        serializer = DamageWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        payload = dict(serializer.validated_data)

        if 'districtId' in payload:
            district_id = payload['districtId']
            district = District.objects.filter(id=district_id).first()
            if district is None:
                return Response({'detail': 'Район не найден'}, status=status.HTTP_400_BAD_REQUEST)

            if not can_access_district(request.user, district.id):
                return Response({'detail': 'Недостаточно прав для района'}, status=status.HTTP_403_FORBIDDEN)

        damage = apply_damage_changes(damage, payload, request.user, entity_type='damage')
        damage = get_damage_or_404(damage.id)
        return Response(serialize_damage(damage), status=status.HTTP_200_OK)


class DamageArchiveView(APIView):
    def post(self, request, damage_id: str):
        denied = require_permission(request, 'damage.update')
        if denied:
            return denied

        damage = get_damage_or_404(damage_id)
        if not can_access_district(request.user, damage.district_id):
            return Response({'detail': 'Недостаточно прав для района'}, status=status.HTTP_403_FORBIDDEN)

        payload = {'archived': True}
        if damage.order_closed_at is None:
            payload['orderClosedAt'] = timezone.localdate()

        damage = apply_damage_changes(damage, payload, request.user, entity_type='damage')
        damage = get_damage_or_404(damage.id)
        return Response(serialize_damage(damage), status=status.HTTP_200_OK)


class OrdersListView(APIView):
    def get(self, request):
        denied = require_permission(request, 'order.read')
        if denied:
            return denied

        archived = parse_bool(request.query_params.get('archived'), default=False)
        queryset = base_damage_queryset().filter(archived=archived)
        queryset = filter_by_district_access(queryset, request.user)

        return Response([serialize_order(item) for item in queryset], status=status.HTTP_200_OK)


class OrderDetailView(APIView):
    def get(self, request, order_id: str):
        denied = require_permission(request, 'order.read')
        if denied:
            return denied

        damage = get_damage_or_404(order_id)
        if not can_access_district(request.user, damage.district_id):
            return Response({'detail': 'Недостаточно прав для района'}, status=status.HTTP_403_FORBIDDEN)

        return Response(serialize_order(damage), status=status.HTTP_200_OK)

    def put(self, request, order_id: str):
        denied = require_any_permission(request, ('order.update', 'ooppprFields.update'))
        if denied:
            return denied

        damage = get_damage_or_404(order_id)
        if not can_access_district(request.user, damage.district_id):
            return Response({'detail': 'Недостаточно прав для района'}, status=status.HTTP_403_FORBIDDEN)

        serializer = OrderWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        payload = dict(serializer.validated_data)

        role = get_user_role(request.user)
        if role == UserRole.OOPPPR:
            payload = {
                key: value
                for key, value in payload.items()
                if key in {'contractorName', 'contractNumber', 'plannedFinishDate', 'note'}
            }

        damage = apply_order_changes(damage, payload, request.user)
        damage = get_damage_or_404(damage.id)
        return Response(serialize_order(damage), status=status.HTTP_200_OK)


class OrderArchiveView(APIView):
    def post(self, request, order_id: str):
        denied = require_permission(request, 'order.update')
        if denied:
            return denied

        damage = get_damage_or_404(order_id)
        if not can_access_district(request.user, damage.district_id):
            return Response({'detail': 'Недостаточно прав для района'}, status=status.HTTP_403_FORBIDDEN)

        payload = {'archived': True}
        if damage.order_closed_at is None:
            payload['orderClosedAt'] = timezone.localdate()

        damage = apply_damage_changes(damage, payload, request.user, entity_type='order')
        damage = get_damage_or_404(damage.id)
        return Response(serialize_order(damage), status=status.HTTP_200_OK)


class GisOpenOrdersView(APIView):
    def get(self, request):
        denied = require_permission(request, 'order.read')
        if denied:
            return denied

        queryset = base_damage_queryset().filter(archived=False)
        queryset = filter_by_district_access(queryset, request.user)
        return Response([serialize_order(item) for item in queryset], status=status.HTTP_200_OK)


class GisArchivedOrdersView(APIView):
    def get(self, request):
        denied = require_permission(request, 'order.read')
        if denied:
            return denied

        queryset = base_damage_queryset().filter(archived=True)
        queryset = filter_by_district_access(queryset, request.user)

        from_value = request.query_params.get('from')
        to_value = request.query_params.get('to')

        try:
            if from_value:
                from_date = datetime.strptime(from_value, '%Y-%m-%d').date()
                queryset = queryset.filter(order_closed_at__gte=from_date)

            if to_value:
                to_date = datetime.strptime(to_value, '%Y-%m-%d').date()
                queryset = queryset.filter(order_closed_at__lte=to_date)
        except ValueError:
            return Response({'detail': 'Некорректный формат даты, ожидается YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

        return Response([serialize_order(item) for item in queryset], status=status.HTTP_200_OK)


class GisDamagePointView(APIView):
    def post(self, request, damage_id: str):
        return self._save_point(request, damage_id)

    def put(self, request, damage_id: str):
        return self._save_point(request, damage_id)

    def _save_point(self, request, damage_id: str):
        denied = require_permission(request, 'damage.update')
        if denied:
            return denied

        damage = get_damage_or_404(damage_id)
        if not can_access_district(request.user, damage.district_id):
            return Response({'detail': 'Недостаточно прав для района'}, status=status.HTTP_403_FORBIDDEN)

        serializer = GisPointWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        point = getattr(damage, 'gis_point', None)
        if point is None:
            point = GisPoint.objects.create(
                damage=damage,
                address=damage.address,
                latitude=serializer.validated_data['latitude'],
                longitude=serializer.validated_data['longitude'],
                gis_object_id=f'GIS-{timezone.now().strftime("%Y%m%d%H%M%S")}',
                map_url='https://maps.example.local',
            )
            create_audit_event(
                entity_type='damage',
                entity_id=damage.id,
                user=request.user,
                field_name='gis_point',
                old_value='',
                new_value=f'{point.latitude},{point.longitude}',
            )
        else:
            old_value = f'{point.latitude},{point.longitude}'
            point.latitude = serializer.validated_data['latitude']
            point.longitude = serializer.validated_data['longitude']
            point.address = damage.address
            point.save(update_fields=['latitude', 'longitude', 'address', 'updated_at'])
            create_audit_event(
                entity_type='damage',
                entity_id=damage.id,
                user=request.user,
                field_name='gis_point',
                old_value=old_value,
                new_value=f'{point.latitude},{point.longitude}',
            )

        damage = get_damage_or_404(damage.id)
        return Response(serialize_damage(damage), status=status.HTTP_200_OK)


class UsersListView(APIView):
    def get(self, request):
        denied = require_permission(request, 'users.read')
        if denied:
            return denied

        users = User.objects.select_related('profile', 'profile__district').order_by('id')
        return Response([serialize_user(user) for user in users], status=status.HTTP_200_OK)


class UserUpdateView(APIView):
    def put(self, request, user_id: str):
        denied = require_permission(request, 'users.update')
        if denied:
            return denied

        user = get_object_or_404(User.objects.select_related('profile', 'profile__district'), pk=user_id)
        serializer = UserWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        if user.id == request.user.id and payload.get('isActive') is False:
            return Response({'detail': 'Нельзя заблокировать самого себя'}, status=status.HTTP_409_CONFLICT)

        if user.profile.role == UserRole.ADMIN and payload.get('role') and payload['role'] != UserRole.ADMIN:
            active_admins = User.objects.filter(profile__role=UserRole.ADMIN, is_active=True).count()
            if active_admins <= 1:
                return Response({'detail': 'Нельзя снять права последнего администратора'}, status=status.HTTP_409_CONFLICT)

        changes: list[tuple[str, str, str]] = []

        if 'ldapLogin' in payload and payload['ldapLogin'] != user.username:
            old_value = user.username
            user.username = payload['ldapLogin']
            changes.append(('ldapLogin', old_value, user.username))

        if 'isActive' in payload and payload['isActive'] != user.is_active:
            old_value = str(user.is_active)
            user.is_active = payload['isActive']
            changes.append(('isActive', old_value, str(user.is_active)))

        user.save(update_fields=['username', 'is_active'])

        profile = user.profile
        if 'fullName' in payload and payload['fullName'] != profile.full_name:
            old_value = profile.full_name
            profile.full_name = payload['fullName']
            changes.append(('fullName', old_value, profile.full_name))

        if 'role' in payload and payload['role'] != profile.role:
            old_value = profile.role
            profile.role = payload['role']
            changes.append(('role', old_value, profile.role))

        if 'districtId' in payload:
            district_raw = payload['districtId']
            district_id = district_raw or None
            if district_id is None:
                district = None
            else:
                district = District.objects.filter(id=district_id).first()
                if district is None:
                    return Response({'detail': 'Район не найден'}, status=status.HTTP_400_BAD_REQUEST)

            if profile.district_id != district_id:
                old_value = profile.district_id or ''
                profile.district = district
                changes.append(('districtId', old_value, district_id or ''))

        profile.save(update_fields=['full_name', 'role', 'district'])

        for field_name, old_value, new_value in changes:
            create_audit_event(
                entity_type='user',
                entity_id=str(user.id),
                user=request.user,
                field_name=field_name,
                old_value=old_value,
                new_value=new_value,
            )

        return Response(serialize_user(user), status=status.HTTP_200_OK)


class AuditHistoryView(APIView):
    def get(self, request, entity_type: str, entity_id: str):
        queryset = AuditEvent.objects.filter(entity_type=entity_type, entity_id=entity_id)
        return Response([serialize_audit_event(item) for item in queryset], status=status.HTTP_200_OK)


class RootView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({'status': 'ok'}, status=status.HTTP_200_OK)
