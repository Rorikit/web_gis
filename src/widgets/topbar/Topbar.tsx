import { Link } from 'react-router-dom';
import { useLogout, useCurrentUser } from '@/features/auth/hooks/useAuth';
import { roleLabel } from '@/features/permissions/model/permissions';
import { districts } from '@/shared/constants/districts';
import { env } from '@/shared/config/env';
import { Button } from '@/shared/ui';

export const Topbar = () => {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const district = districts.find((item) => item.id === user?.districtId);

  return (
    <header className="topbar">
      <Link to="/dashboard" className="topbar__title">{env.appName}</Link>
      <div className="topbar__meta">
        <span>{district?.name ?? 'Все районы'}</span>
        <span>{user?.role ? roleLabel[user.role] : ''}</span>
        <span>{user?.ldapLogin}</span>
        <Button variant="secondary" onClick={() => logout.mutate()}>Выход</Button>
      </div>
    </header>
  );
};
