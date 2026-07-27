import { useDamages } from '@/features/damages/hooks/useDamages';
import { DamagesTable } from '@/features/damages/ui/DamagesTable';
import { useDistrictFilter } from '@/features/permissions/hooks/useDistrictFilter';
import { ExportTableButton } from '@/widgets/table-toolbar/ExportTableButton';
import { PageHeader, PageToolbar } from '@/shared/ui';

export const DamageArchivePage = () => {
  const query = useDamages(true);
  const data = useDistrictFilter(query.data);
  return (
    <>
      <PageHeader title="Архив повреждений" />
      <PageToolbar>
        <ExportTableButton entityType="damages" archived fileName="Архив-повреждений.xlsx" />
      </PageToolbar>
      <DamagesTable data={data} isLoading={query.isLoading} isError={query.isError} />
    </>
  );
};
