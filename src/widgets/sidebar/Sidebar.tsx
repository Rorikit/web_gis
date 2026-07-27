import { NavLink } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import type { UserRole } from '@/entities/user/types';

const itemsByRole: Record<UserRole, Array<{ label: string; to: string }>> = {
  district_damage: [
    { label: 'Район', to: '/district' },
    { label: 'Повреждения', to: '/damages' },
    { label: 'Ордера', to: '/orders' },
    { label: 'Карта ордеров', to: '/map/orders' },
    { label: 'Архив повреждений', to: '/damages/archive' },
    { label: 'Архив ордеров', to: '/orders/archive' },
  ],
  district_order: [
    { label: 'Район', to: '/district' },
    { label: 'Повреждения', to: '/damages' },
    { label: 'Ордера', to: '/orders' },
    { label: 'Карта ордеров', to: '/map/orders' },
    { label: 'Архив повреждений', to: '/damages/archive' },
    { label: 'Архив ордеров', to: '/orders/archive' },
  ],
  oopppr: [
    { label: 'ООППР', to: '/oopppr' },
    { label: 'Архив ООППР', to: '/oopppr/archive' },
    { label: 'Справка', to: '/full-access' },
    { label: 'Карта ордеров', to: '/map/orders' },
  ],
  full_access: [
    { label: 'Полный доступ', to: '/full-access' },
    { label: 'Повреждения', to: '/damages' },
    { label: 'Ордера', to: '/orders' },
    { label: 'Карта ордеров', to: '/map/orders' },
    { label: 'Архив повреждений', to: '/damages/archive' },
    { label: 'Архив ордеров', to: '/orders/archive' },
  ],
  admin: [
    { label: 'Администратор', to: '/admin' },
    { label: 'Повреждения', to: '/damages' },
    { label: 'Ордера', to: '/orders' },
    { label: 'Карта ордеров', to: '/map/orders' },
    { label: 'Архив администратора', to: '/admin/archive' },
    { label: 'Пользователи', to: '/admin/users' },
    { label: 'Полный доступ', to: '/full-access' },
  ],
};

export const Sidebar = () => {
  const { data: user } = useCurrentUser();
  const items = user?.role ? itemsByRole[user.role] : [];

  return (
    <aside className="sidebar">
      <nav>
        {items.map((item) => (
          <NavLink key={item.to} to={item.to}>{item.label}</NavLink>
        ))}
      </nav>
    </aside>
  );
};
