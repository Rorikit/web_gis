import { useMemo, useState } from 'react';
import { useDamages } from '@/features/damages/hooks/useDamages';
import { DamagesTable } from '@/features/damages/ui/DamagesTable';
import { useDistrictFilter } from '@/features/permissions/hooks/useDistrictFilter';
import { TableToolbar } from '@/widgets/table-toolbar/TableToolbar';
import { Button, PageHeader } from '@/shared/ui';

export const DamagesPage = () => {
  const [search, setSearch] = useState('');
  const query = useDamages(false);
  const districtData = useDistrictFilter(query.data);
  const data = useMemo(() => districtData.filter((item) => `${item.address} ${item.orderNumber}`.toLowerCase().includes(search.toLowerCase())), [districtData, search]);
  return (
    <>
      <PageHeader title="Повреждения" actions={<Button>Создать повреждение</Button>} />
      <TableToolbar search={search} onSearch={setSearch} />
      <DamagesTable data={data} isLoading={query.isLoading} isError={query.isError} />
    </>
  );
};
