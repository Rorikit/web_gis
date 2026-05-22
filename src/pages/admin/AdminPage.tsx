import { Link } from 'react-router-dom';
import { Button, PageHeader } from '@/shared/ui';

export const AdminPage = () => (
  <>
    <PageHeader title="Администрирование" />
    <div className="card">
      <Button><Link to="/admin/users">Пользователи</Link></Button>
    </div>
  </>
);
