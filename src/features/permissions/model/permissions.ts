import type { UserRole } from '@/entities/user/types';

export type Permission =
  | 'damage.create'
  | 'damage.read'
  | 'damage.update'
  | 'order.read'
  | 'order.update'
  | 'ooppprFields.update'
  | 'users.read'
  | 'users.create'
  | 'users.update'
  | 'reports.createReference'
  | 'reports.createDamageCard';

export const permissionMatrix: Record<Permission, UserRole[]> = {
  'damage.create': ['district_damage', 'district_order', 'full_access', 'admin'],
  'damage.read': ['district_damage', 'district_order', 'oopppr', 'full_access', 'admin'],
  'damage.update': ['district_damage', 'district_order', 'full_access', 'admin'],
  'order.read': ['district_damage', 'district_order', 'oopppr', 'full_access', 'admin'],
  'order.update': ['district_damage', 'district_order', 'full_access', 'admin'],
  'ooppprFields.update': ['oopppr', 'full_access', 'admin'],
  'users.read': ['admin'],
  'users.create': ['admin'],
  'users.update': ['admin'],
  'reports.createReference': ['oopppr', 'full_access', 'admin'],
  'reports.createDamageCard': ['district_damage', 'district_order', 'full_access', 'admin'],
};

export const hasPermission = (role: UserRole | undefined, permission: Permission) =>
  Boolean(role && permissionMatrix[permission].includes(role));

export const canAccessDistrict = (
  userRole: UserRole | undefined,
  userDistrictId: string | null | undefined,
  recordDistrictId: string,
) => {
  if (!userRole) return false;
  if (userRole === 'admin' || userRole === 'full_access' || userRole === 'oopppr') return true;
  return userDistrictId === recordDistrictId;
};

export const roleLabel: Record<UserRole, string> = {
  district_damage: 'Район: повреждения',
  district_order: 'Район: ордера',
  oopppr: 'ООППР',
  full_access: 'Полный доступ',
  admin: 'Администратор',
};

export const landingPathByRole: Record<UserRole, string> = {
  district_damage: '/district',
  district_order: '/district',
  oopppr: '/oopppr',
  full_access: '/full-access',
  admin: '/admin',
};
