from datetime import datetime, timedelta
from pathlib import Path

from django.contrib.auth import get_user_model, update_session_auth_hash
from django.db.models import QuerySet
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import District, UserRole
from apps.accounts.permissions import can_access_district, get_user_role, has_any_permission, has_permission
from apps.accounts.serializers import serialize_user

from .models import AuditEvent, Damage, GisPoint, OrderKind, Photo, RequestArchive
from .reports import DAMAGE_CARD_INPUT_FIELDS, build_current_table_workbook, build_damage_card_document, build_reference_workbook
from .serializers import DamageOpenOrderSerializer, DamageWriteSerializer, GisPointWriteSerializer, OrderWriteSerializer, RequestArchiveWriteSerializer, UserCreateSerializer, UserWriteSerializer, serialize_audit_event, serialize_damage, serialize_order, serialize_request_archive
from .services import DAMAGE_FIELD_MAP, ORDER_FIELD_MAP, apply_damage_changes, apply_order_changes, create_audit_event, default_damage_payload

ALLOWED_PHOTO_CONTENT_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
ALLOWED_PHOTO_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MAX_PHOTO_SIZE = 10 * 1024 * 1024
DAMAGE_CARD_FIELD_NAMES = {name for name, _ in DAMAGE_CARD_INPUT_FIELDS}

# Ключи карточки повреждения -> ключи карточки ордера.
DAMAGE_ORDER_FIELD_ALIASES = {
    'orderNumber': 'orderNumber',
    'orderOpenedAt': 'openedAt',
    'orderValidUntil': 'validUntil',
    'orderClosedAt': 'closedAt',
    'orderKind': 'orderKind',
    'address': 'address',
    'greenZoneArea': 'greenZoneArea',
    'curbCount': 'curbCount',
    'improvementMain': 'improvementMain',
    'improvementInnerRoad': 'improvementInnerRoad',
    'improvementSidewalk': 'improvementSidewalk',
    'improvementBlindArea': 'improvementBlindArea',
}

User = get_user_model()


def parse_bool(value: str | bool | None, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
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
            'disconnected_addresses': payload['disconnectedAddresses'],
            'damage_description': payload['damageDescription'],
            'order_kind': payload['orderKind'],
            'green_zone_area': payload['greenZoneArea'],
            'improvement_main': payload['improvementMain'],
            'improvement_inner_road': payload['improvementInnerRoad'],
            'improvement_sidewalk': payload['improvementSidewalk'],
            'improvement_blind_area': payload['improvementBlindArea'],
            'curb_count': payload['curbCount'],
            'area_state': payload['areaState'],
            'contractor_type': payload['contractorType'],
            'contract_number': payload['contractNumber'],
            'contractor_request_date': payload['contractorRequestDate'],
            'note': payload['note'],
            'order_closed_at': payload['orderClosedAt'],
            # Заполненная дата устранения сразу отправляет повреждение в архив.
            'archived': payload['fixedAt'] is not None,
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
        # Поля повреждения меняет «Район: повреждения», поля ордера — «Район: ордера».
        denied = require_any_permission(request, ('damage.update', 'damage.orderFields.update'))
        if denied:
            return denied

        damage = get_damage_or_404(damage_id)
        if not can_access_district(request.user, damage.district_id):
            return Response({'detail': 'Недостаточно прав для района'}, status=status.HTTP_403_FORBIDDEN)

        serializer = DamageWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        payload = dict(serializer.validated_data)

        can_edit_damage = has_permission(request.user, 'damage.update')
        can_edit_order = has_permission(request.user, 'damage.orderFields.update')

        allowed = set()
        if can_edit_damage:
            allowed |= set(DAMAGE_FIELD_MAP)
        if can_edit_order:
            allowed |= set(DAMAGE_ORDER_FIELD_ALIASES)
        payload = {key: value for key, value in payload.items() if key in allowed}

        if 'districtId' in payload:
            if not can_edit_damage:
                payload.pop('districtId')
            else:
                district_id = payload['districtId']
                district = District.objects.filter(id=district_id).first()
                if district is None:
                    return Response({'detail': 'Район не найден'}, status=status.HTTP_400_BAD_REQUEST)

                if not can_access_district(request.user, district.id):
                    return Response({'detail': 'Недостаточно прав для района'}, status=status.HTTP_403_FORBIDDEN)

        # После заполнения номера ордера адрес правит только роль «Район: ордера».
        if (
            'address' in payload
            and damage.order_number.strip()
            and not can_edit_order
            and payload['address'] != damage.address
        ):
            return Response(
                {'detail': 'Адрес после заполнения номера ордера может менять только пользователь с правами района ордеров'},
                status=status.HTTP_403_FORBIDDEN,
            )

        damage_payload = (
            {key: value for key, value in payload.items() if key in DAMAGE_FIELD_MAP}
            if can_edit_damage else {}
        )
        order_payload = {}
        if can_edit_order:
            for source, target in DAMAGE_ORDER_FIELD_ALIASES.items():
                if source in payload:
                    order_payload[target] = payload[source]
            if can_edit_damage:
                # Адрес уже применён как поле повреждения.
                order_payload.pop('address', None)

        if 'fixedAt' in damage_payload:
            damage_payload['archived'] = damage_payload['fixedAt'] is not None

        damage = apply_damage_changes(damage, damage_payload, request.user, entity_type='damage')
        if order_payload:
            damage = apply_order_changes(damage, order_payload, request.user)
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

        damage = apply_damage_changes(damage, {'archived': True}, request.user, entity_type='damage')
        if damage.order_opened_at is not None and damage.order_closed_at is None:
            damage = apply_order_changes(damage, {'closedAt': timezone.localdate()}, request.user)
        damage = get_damage_or_404(damage.id)
        return Response(serialize_damage(damage), status=status.HTTP_200_OK)


class DamageOpenOrderView(APIView):
    def post(self, request, damage_id: str):
        denied = require_permission(request, 'damage.orderFields.update')
        if denied:
            return denied

        damage = get_damage_or_404(damage_id)
        if not can_access_district(request.user, damage.district_id):
            return Response({'detail': 'Недостаточно прав для района'}, status=status.HTTP_403_FORBIDDEN)

        if damage.order_opened_at is not None:
            return Response({'detail': 'Ордер уже открыт'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = DamageOpenOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        today = timezone.localdate()
        order_opened_at = data.get('orderOpenedAt') or today
        payload = {
            # Номер ордера вводит пользователь; бэкенд не генерирует его сам.
            'orderNumber': (data.get('orderNumber') or '').strip(),
            'openedAt': order_opened_at,
            'validUntil': data.get('orderValidUntil') or order_opened_at + timedelta(days=30),
            'orderKind': OrderKind.CURRENT,
        }

        damage = apply_order_changes(damage, payload, request.user)
        damage = get_damage_or_404(damage.id)
        return Response(serialize_damage(damage), status=status.HTTP_200_OK)


class OrdersListView(APIView):
    def get(self, request):
        denied = require_permission(request, 'order.read')
        if denied:
            return denied

        archived = parse_bool(request.query_params.get('archived'), default=False)
        queryset = base_damage_queryset().filter(archived=archived, order_opened_at__isnull=False)
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
                if key in {'contractorType', 'contractNumber', 'note'}
            }

        # Ордер с проставленной датой закрытия уезжает в архив и наоборот (ТЗ, раздел В).
        if 'closedAt' in payload:
            payload['archived'] = payload['closedAt'] is not None

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
            payload['closedAt'] = timezone.localdate()

        damage = apply_order_changes(damage, payload, request.user)
        damage = get_damage_or_404(damage.id)
        return Response(serialize_order(damage), status=status.HTTP_200_OK)


class RequestArchiveListView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        denied = require_permission(request, 'requests.read')
        if denied:
            return denied

        queryset = RequestArchive.objects.select_related('district')
        role = get_user_role(request.user)
        if role not in {UserRole.ADMIN, UserRole.FULL_ACCESS}:
            district_id = getattr(getattr(request.user, 'profile', None), 'district_id', None)
            queryset = queryset.filter(district_id=district_id) if district_id else queryset.none()

        return Response([serialize_request_archive(item) for item in queryset], status=status.HTTP_200_OK)

    def post(self, request):
        denied = require_permission(request, 'requests.create')
        if denied:
            return denied

        serializer = RequestArchiveWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        district_id = getattr(getattr(request.user, 'profile', None), 'district_id', None)
        if not district_id:
            district_id = District.objects.order_by('id').values_list('id', flat=True).first()

        uploaded_file = request.FILES.get('file')
        item = RequestArchive.objects.create(
            district_id=district_id,
            request_date=payload.get('requestDate') or timezone.localdate(),
            contractor=payload.get('contractor', ''),
            addresses=payload.get('addresses', ''),
            file=uploaded_file or '',
            file_name=uploaded_file.name if uploaded_file else '',
            created_by=request.user if request.user.is_authenticated else None,
        )
        create_audit_event(
            entity_type='request',
            entity_id=item.id,
            user=request.user,
            field_name='__created__',
            old_value='',
            new_value='created',
        )
        return Response(serialize_request_archive(item), status=status.HTTP_201_CREATED)


class RequestArchiveDetailView(APIView):
    def delete(self, request, request_id: str):
        denied = require_permission(request, 'requests.delete')
        if denied:
            return denied

        item = get_object_or_404(RequestArchive.objects.select_related('district'), pk=request_id)
        role = get_user_role(request.user)
        if role not in {UserRole.ADMIN, UserRole.FULL_ACCESS}:
            district_id = getattr(getattr(request.user, 'profile', None), 'district_id', None)
            if not district_id or item.district_id != district_id:
                return Response({'detail': 'Недостаточно прав для района'}, status=status.HTTP_403_FORBIDDEN)

        item.delete()
        create_audit_event(
            entity_type='request',
            entity_id=request_id,
            user=request.user,
            field_name='__deleted__',
            old_value='',
            new_value='',
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class GisOpenOrdersView(APIView):
    def get(self, request):
        denied = require_permission(request, 'order.read')
        if denied:
            return denied

        queryset = base_damage_queryset().filter(archived=False, order_opened_at__isnull=False)
        queryset = filter_by_district_access(queryset, request.user)
        return Response([serialize_order(item) for item in queryset], status=status.HTTP_200_OK)


class GisArchivedOrdersView(APIView):
    def get(self, request):
        denied = require_permission(request, 'order.read')
        if denied:
            return denied

        queryset = base_damage_queryset().filter(archived=True, order_opened_at__isnull=False)
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


def save_gis_point(request, entity_id: str, permission_name: str, entity_type: str, serialize_fn):
    denied = require_permission(request, permission_name)
    if denied:
        return denied

    damage = get_damage_or_404(entity_id)
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
            entity_type=entity_type,
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
            entity_type=entity_type,
            entity_id=damage.id,
            user=request.user,
            field_name='gis_point',
            old_value=old_value,
            new_value=f'{point.latitude},{point.longitude}',
        )

    damage = get_damage_or_404(damage.id)
    return Response(serialize_fn(damage), status=status.HTTP_200_OK)


class GisDamagePointView(APIView):
    def post(self, request, damage_id: str):
        return save_gis_point(request, damage_id, 'damage.update', 'damage', serialize_damage)

    def put(self, request, damage_id: str):
        return save_gis_point(request, damage_id, 'damage.update', 'damage', serialize_damage)


class GisOrderPointView(APIView):
    def post(self, request, order_id: str):
        return save_gis_point(request, order_id, 'order.update', 'order', serialize_order)

    def put(self, request, order_id: str):
        return save_gis_point(request, order_id, 'order.update', 'order', serialize_order)


class UsersListView(APIView):
    def get(self, request):
        denied = require_permission(request, 'users.read')
        if denied:
            return denied

        users = User.objects.select_related('profile', 'profile__district').order_by('id')
        return Response([serialize_user(user) for user in users], status=status.HTTP_200_OK)

    def post(self, request):
        denied = require_permission(request, 'users.create')
        if denied:
            return denied

        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        ldap_login = payload['ldapLogin'].strip()
        if not ldap_login:
            return Response({'detail': 'Не указан логин'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=ldap_login).exists():
            return Response({'detail': 'Пользователь с таким логином уже существует'}, status=status.HTTP_409_CONFLICT)

        district = None
        district_id = payload.get('districtId') or None
        if district_id:
            district = District.objects.filter(id=district_id).first()
            if district is None:
                return Response({'detail': 'Район не найден'}, status=status.HTTP_400_BAD_REQUEST)

        # Пароль сохраняется как задал администратор: простой и пустой пароли допустимы.
        user = User.objects.create_user(
            username=ldap_login,
            password=payload['password'],
            is_active=payload.get('isActive', True),
        )

        profile = user.profile
        profile.full_name = payload.get('fullName', '')
        profile.role = payload['role']
        profile.district = district
        profile.save(update_fields=['full_name', 'role', 'district'])

        create_audit_event(
            entity_type='user',
            entity_id=str(user.id),
            user=request.user,
            field_name='__created__',
            old_value='',
            new_value=user.username,
        )

        user = User.objects.select_related('profile', 'profile__district').get(pk=user.pk)
        return Response(serialize_user(user), status=status.HTTP_201_CREATED)


def is_last_active_admin(user) -> bool:
    if user.profile.role != UserRole.ADMIN or not user.is_active:
        return False
    return User.objects.filter(profile__role=UserRole.ADMIN, is_active=True).count() <= 1


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

        if payload.get('role') and payload['role'] != UserRole.ADMIN and is_last_active_admin(user):
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

        update_fields = ['username', 'is_active']
        password_changed = 'password' in payload
        if password_changed:
            user.set_password(payload['password'])
            update_fields.append('password')
            # значения пароля в журнал не пишем
            changes.append(('password', '', 'изменен'))

        user.save(update_fields=update_fields)

        if password_changed and user.id == request.user.id:
            # иначе смена собственного пароля разлогинит администратора
            update_session_auth_hash(request, user)

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

    def delete(self, request, user_id: str):
        denied = require_permission(request, 'users.delete')
        if denied:
            return denied

        user = get_object_or_404(User.objects.select_related('profile'), pk=user_id)

        if user.id == request.user.id:
            return Response({'detail': 'Нельзя удалить самого себя'}, status=status.HTTP_409_CONFLICT)

        if is_last_active_admin(user):
            return Response({'detail': 'Нельзя удалить последнего администратора'}, status=status.HTTP_409_CONFLICT)

        username = user.username
        user.delete()

        create_audit_event(
            entity_type='user',
            entity_id=str(user_id),
            user=request.user,
            field_name='__deleted__',
            old_value=username,
            new_value='',
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class AuditHistoryView(APIView):
    def get(self, request, entity_type: str, entity_id: str):
        queryset = AuditEvent.objects.filter(entity_type=entity_type, entity_id=entity_id)
        return Response([serialize_audit_event(item) for item in queryset], status=status.HTTP_200_OK)


class RootView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({'status': 'ok'}, status=status.HTTP_200_OK)


class DamageCardReportView(APIView):
    def post(self, request):
        denied = require_permission(request, 'reports.createDamageCard')
        if denied:
            return denied

        damage_id = request.data.get('damageId')
        if not damage_id:
            return Response({'detail': 'Не указан damageId'}, status=status.HTTP_400_BAD_REQUEST)

        damage = get_damage_or_404(damage_id)
        if not can_access_district(request.user, damage.district_id):
            return Response({'detail': 'Недостаточно прав для района'}, status=status.HTTP_403_FORBIDDEN)

        raw_fields = request.data.get('fields')
        fields = {
            key: value
            for key, value in raw_fields.items()
            if isinstance(key, str) and key in DAMAGE_CARD_FIELD_NAMES
        } if isinstance(raw_fields, dict) else {}

        additional_info = str(request.data.get('additionalInfo') or '')
        content = build_damage_card_document(damage, fields, additional_info)

        response = HttpResponse(
            content,
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        )
        response['Content-Disposition'] = f'attachment; filename="damage-card-{damage.id}.docx"'
        return response


class ReferenceReportView(APIView):
    def post(self, request):
        denied = require_permission(request, 'reports.createReference')
        if denied:
            return denied

        report_date = str(request.data.get('reportDate') or timezone.localdate().isoformat())
        content = build_reference_workbook(report_date)

        response = HttpResponse(
            content,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = f'attachment; filename="reference-{report_date}.xlsx"'
        return response


class ExportCurrentTableView(APIView):
    def post(self, request):
        entity_type = request.data.get('entityType') or 'damages'
        archived = parse_bool(request.data.get('archived'), default=False)

        permission_name = 'order.read' if entity_type == 'orders' else 'damage.read'
        denied = require_permission(request, permission_name)
        if denied:
            return denied

        queryset = base_damage_queryset().filter(archived=archived)
        if entity_type == 'orders':
            queryset = queryset.filter(order_opened_at__isnull=False)
        queryset = filter_by_district_access(queryset, request.user)

        content = build_current_table_workbook(queryset, entity_type)
        response = HttpResponse(
            content,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = 'attachment; filename="export.xlsx"'
        return response


class DamagePhotoUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, damage_id: str):
        denied = require_permission(request, 'damage.update')
        if denied:
            return denied

        damage = get_damage_or_404(damage_id)
        if not can_access_district(request.user, damage.district_id):
            return Response({'detail': 'Недостаточно прав для района'}, status=status.HTTP_403_FORBIDDEN)

        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'detail': 'Файл не передан'}, status=status.HTTP_400_BAD_REQUEST)

        extension = Path(uploaded_file.name).suffix.lower()
        if uploaded_file.content_type not in ALLOWED_PHOTO_CONTENT_TYPES or extension not in ALLOWED_PHOTO_EXTENSIONS:
            return Response({'detail': 'Допустимы только изображения JPEG, PNG, GIF или WEBP'}, status=status.HTTP_400_BAD_REQUEST)

        if uploaded_file.size > MAX_PHOTO_SIZE:
            return Response({'detail': 'Файл больше 10 МБ'}, status=status.HTTP_400_BAD_REQUEST)

        photo = Photo.objects.create(damage=damage, file=uploaded_file, file_name=uploaded_file.name)
        create_audit_event(
            entity_type='damage',
            entity_id=damage.id,
            user=request.user,
            field_name='photo',
            old_value='',
            new_value=photo.file_name,
        )

        damage = get_damage_or_404(damage.id)
        return Response(serialize_damage(damage), status=status.HTTP_201_CREATED)
