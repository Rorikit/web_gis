export type UserRole = 'district_damage' | 'district_order' | 'oopppr' | 'full_access' | 'admin';

export type User = {
  id: string;
  ldapLogin: string;
  fullName: string;
  role: UserRole;
  districtId: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
};
