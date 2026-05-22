import { Link } from 'react-router-dom';
import { Button, PageHeader } from '@/shared/ui';

export const AccessDeniedPage = () => (
  <>
    <PageHeader title="Нет доступа" subtitle="У вашей роли недостаточно прав для открытия раздела" />
    <Button><Link to="/dashboard">На главную</Link></Button>
  </>
);
