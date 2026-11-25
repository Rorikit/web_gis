import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateDamage, useDamages } from '@/features/damages/hooks/useDamages';
import { DamagesTable } from '@/features/damages/ui/DamagesTable';
import { useDistrictFilter } from '@/features/permissions/hooks/useDistrictFilter';
import { inDateRange } from '@/shared/lib/date-range';
import { DateRangeFilter } from '@/widgets/table-toolbar/DateRangeFilter';
import { ExportTableButton } from '@/widgets/table-toolbar/ExportTableButton';
import { TableToolbar } from '@/widgets/table-toolbar/TableToolbar';
import { Button, PageHeader, PageToolbar } from '@/shared/ui';

export const DamagesPage = () => {
  const [search, setSearch] = useState('');
  const [detectedFrom, setDetectedFrom] = useState('');
  const [detectedTo, setDetectedTo] = useState('');
  const [fixedFrom, setFixedFrom] = useState('');
  const [fixedTo, setFixedTo] = useState('');
  const navigate = useNavigate();
  const query = useDamages(false);
  const create = useCreateDamage();
  const districtData = useDistrictFilter(query.data);
  const data = useMemo(
    () => districtData.filter((item) => (
      `${item.address} ${item.orderNumber}`.toLowerCase().includes(search.toLowerCase())
      && inDateRange(item.detectedAt, detectedFrom, detectedTo)
      && inDateRange(item.fixedAt, fixedFrom, fixedTo)
    )),
    [districtData, search, detectedFrom, detectedTo, fixedFrom, fixedTo],
  );
  const handleCreate = () => create.mutate({}, { onSuccess: (damage) => navigate(`/damages/${damage.id}`) });
  return (
    <>
      <PageHeader title="Повреждения" actions={<Button onClick={handleCreate} disabled={create.isPending}>Создать повреждение</Button>} />
      <PageToolbar>
        <Button variant="secondary"><Link to="/damages/archive">Архив повреждений</Link></Button>
        <ExportTableButton entityType="damages" fileName="Повреждения.xlsx" />
      </PageToolbar>
      <TableToolbar search={search} onSearch={setSearch}>
        <DateRangeFilter label="Обнаружено" from={detectedFrom} to={detectedTo} onFrom={setDetectedFrom} onTo={setDetectedTo} />
        <DateRangeFilter label="Устранено" from={fixedFrom} to={fixedTo} onFrom={setFixedFrom} onTo={setFixedTo} />
      </TableToolbar>
      <DamagesTable data={data} isLoading={query.isLoading} isError={query.isError} />
    </>
  );
};
