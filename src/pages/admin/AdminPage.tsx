import { Link } from 'react-router-dom';
import { useDamages } from '@/features/damages/hooks/useDamages';
import { GeneralTable } from '@/widgets/general-table/GeneralTable';
import { ExportTableButton } from '@/widgets/table-toolbar/ExportTableButton';
import { Button, PageHeader, PageToolbar } from '@/shared/ui';

export const AdminPage = () => {
  const query = useDamages(false);

  return (
    <>
      <PageHeader
        title="Администратор"
        actions={<Button><Link to="/admin/users">Пользователи</Link></Button>}
      />
      <PageToolbar>
        <Button variant="secondary"><Link to="/admin/archive">Архив администратора</Link></Button>
        <ExportTableButton entityType="damages" fileName="Администратор.xlsx" />
      </PageToolbar>
      <GeneralTable data={query.data ?? []} isLoading={query.isLoading} isError={query.isError} />
    </>
  );
};
