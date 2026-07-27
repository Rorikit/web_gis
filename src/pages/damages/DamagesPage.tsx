import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateDamage, useDamages } from '@/features/damages/hooks/useDamages';
import { DamagesTable } from '@/features/damages/ui/DamagesTable';
import { useDistrictFilter } from '@/features/permissions/hooks/useDistrictFilter';
import { ExportTableButton } from '@/widgets/table-toolbar/ExportTableButton';
import { TableToolbar } from '@/widgets/table-toolbar/TableToolbar';
import { Button, PageHeader, PageToolbar } from '@/shared/ui';

export const DamagesPage = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const query = useDamages(false);
  const create = useCreateDamage();
  const districtData = useDistrictFilter(query.data);
  const data = useMemo(() => districtData.filter((item) => `${item.address} ${item.orderNumber}`.toLowerCase().includes(search.toLowerCase())), [districtData, search]);
  const handleCreate = () => create.mutate({}, { onSuccess: (damage) => navigate(`/damages/${damage.id}`) });
  return (
    <>
      <PageHeader title="Повреждения" actions={<Button onClick={handleCreate} disabled={create.isPending}>Создать повреждение</Button>} />
      <PageToolbar>
        <Button variant="secondary"><Link to="/damages/archive">Архив повреждений</Link></Button>
        <ExportTableButton entityType="damages" fileName="Повреждения.xlsx" />
      </PageToolbar>
      <TableToolbar search={search} onSearch={setSearch} />
      <DamagesTable data={data} isLoading={query.isLoading} isError={query.isError} />
    </>
  );
};
