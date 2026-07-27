import { Link } from 'react-router-dom';
import { useDamages } from '@/features/damages/hooks/useDamages';
import { useDistrictFilter } from '@/features/permissions/hooks/useDistrictFilter';
import { GeneralTable } from '@/widgets/general-table/GeneralTable';
import { ExportTableButton } from '@/widgets/table-toolbar/ExportTableButton';
import { Button, PageHeader, PageToolbar } from '@/shared/ui';

export const DistrictPage = () => {
  const query = useDamages(false);
  const data = useDistrictFilter(query.data);

  return (
    <>
      <PageHeader
        title="Район"
        actions={(
          <>
            <Button variant="secondary"><Link to="/damages">Повреждения</Link></Button>
            <Button variant="secondary"><Link to="/orders">Ордера</Link></Button>
          </>
        )}
      />
      <PageToolbar>
        <ExportTableButton entityType="damages" fileName="Район.xlsx" />
      </PageToolbar>
      <GeneralTable data={data} isLoading={query.isLoading} isError={query.isError} />
    </>
  );
};
