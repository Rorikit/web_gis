import { NavLink } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import type { UserRole } from '@/entities/user/types';

const itemsByRole: Record<UserRole, Array<{ label: string; to: string }>> = {
  district_damage: [
    { label: 'Главная', to: '/dashboard' },
    { label: 'Повреждения', to: '/damages' },
    { label: 'Ордера', to: '/orders' },
    { label: 'Карта ордеров', to: '/map/orders' },
    { label: 'Архив повреждений', to: '/damages/archive' },
    { label: 'Архив ордеров', to: '/orders/archive' },
  ],
  district_order: [
    { label: 'Главная', to: '/dashboard' },
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
    { label: 'Главная', to: '/dashboard' },
    { label: 'Повреждения', to: '/damages' },
    { label: 'Ордера', to: '/orders' },
    { label: 'Карта ордеров', to: '/map/orders' },
    { label: 'Справка', to: '/full-access' },
    { label: 'Архивы', to: '/damages/archive' },
  ],
  admin: [
    { label: 'Главная', to: '/dashboard' },
    { label: 'Повреждения', to: '/damages' },
    { label: 'Ордера', to: '/orders' },
    { label: 'Карта', to: '/map/orders' },
    { label: 'Архивы', to: '/damages/archive' },
    { label: 'Пользователи', to: '/admin/users' },
    { label: 'Справка', to: '/full-access' },
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
