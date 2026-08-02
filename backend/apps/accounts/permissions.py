from collections.abc import Iterable

from django.contrib.auth.models import AnonymousUser

from .models import UserRole

PermissionName = str


PERMISSION_MATRIX: dict[PermissionName, set[str]] = {
    'damage.create': {UserRole.DISTRICT_DAMAGE, UserRole.DISTRICT_ORDER, UserRole.FULL_ACCESS, UserRole.ADMIN},
    'damage.read': {UserRole.DISTRICT_DAMAGE, UserRole.DISTRICT_ORDER, UserRole.OOPPPR, UserRole.FULL_ACCESS, UserRole.ADMIN},
    'damage.update': {UserRole.DISTRICT_DAMAGE, UserRole.DISTRICT_ORDER, UserRole.FULL_ACCESS, UserRole.ADMIN},
    'order.read': {UserRole.DISTRICT_DAMAGE, UserRole.DISTRICT_ORDER, UserRole.OOPPPR, UserRole.FULL_ACCESS, UserRole.ADMIN},
    'order.update': {UserRole.DISTRICT_DAMAGE, UserRole.DISTRICT_ORDER, UserRole.FULL_ACCESS, UserRole.ADMIN},
    'ooppprFields.update': {UserRole.OOPPPR, UserRole.FULL_ACCESS, UserRole.ADMIN},
    'users.read': {UserRole.ADMIN},
    'users.create': {UserRole.ADMIN},
    'users.update': {UserRole.ADMIN},
    'reports.createReference': {UserRole.OOPPPR, UserRole.FULL_ACCESS, UserRole.ADMIN},
    'reports.createDamageCard': {UserRole.DISTRICT_DAMAGE, UserRole.DISTRICT_ORDER, UserRole.FULL_ACCESS, UserRole.ADMIN},
}


ALL_DISTRICTS_ROLES: set[str] = {UserRole.ADMIN, UserRole.FULL_ACCESS, UserRole.OOPPPR}


def get_user_role(user) -> str | None:
    if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
        return None

    profile = getattr(user, 'profile', None)
    if profile is not None:
        return profile.role

    if user.is_superuser:
        return UserRole.ADMIN
    return None


def has_permission(user, permission: PermissionName) -> bool:
    role = get_user_role(user)
    if role is None:
        return False
    allowed_roles = PERMISSION_MATRIX.get(permission, set())
    return role in allowed_roles


def has_any_permission(user, permissions: Iterable[PermissionName]) -> bool:
    return any(has_permission(user, permission) for permission in permissions)


def can_access_district(user, district_id: str | None) -> bool:
    role = get_user_role(user)
    if role is None:
        return False

    if role in ALL_DISTRICTS_ROLES:
        return True

    profile = getattr(user, 'profile', None)
    if profile is None:
        return False

    return bool(district_id and profile.district_id == district_id)
