import { useDamages } from '@/features/damages/hooks/useDamages';
import { GeneralTable } from '@/widgets/general-table/GeneralTable';
import { ExportTableButton } from '@/widgets/table-toolbar/ExportTableButton';
import { PageHeader, PageToolbar } from '@/shared/ui';

export const AdminArchivePage = () => {
  const query = useDamages(true);

  return (
    <>
      <PageHeader title="Архив администратора" />
      <PageToolbar>
        <ExportTableButton entityType="damages" archived fileName="Архив-администратора.xlsx" />
      </PageToolbar>
      <GeneralTable data={query.data ?? []} isLoading={query.isLoading} isError={query.isError} />
    </>
  );
};
