import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import type { Damage } from '@/entities';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { useArchiveDamage } from '@/features/damages/hooks/useDamages';
import { hasPermission } from '@/features/permissions/model/permissions';
import { Badge, Button, DataTable } from '@/shared/ui';

const DamageRowActions = ({ damage }: { damage: Damage }) => {
  const { data: user } = useCurrentUser();
  const archive = useArchiveDamage();
  const canClose = hasPermission(user?.role, 'damage.update');

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button variant="secondary"><Link to={`/damages/${damage.id}`}>Открыть</Link></Button>
      <Button
        variant="secondary"
        disabled={!canClose || damage.archived || archive.isPending}
        onClick={() => archive.mutate(damage.id)}
      >
        {damage.archived ? 'Закрыт' : 'Закрыть'}
      </Button>
    </div>
  );
};

const columns: ColumnDef<Damage>[] = [
  { header: '№', accessorKey: 'id', size: 90 },
  { header: 'Адрес', accessorKey: 'address' },
  { header: 'ОТ/ГВС', accessorKey: 'networkType' },
  { header: 'Тип повреждения', accessorKey: 'damageType' },
  { header: 'Дата обнаружения', accessorKey: 'detectedAt' },
  { header: 'Дата устранения', accessorKey: 'fixedAt', cell: ({ getValue }) => String(getValue() ?? '-') },
  { header: '№ ордера', accessorKey: 'orderNumber' },
  { header: 'GIS', cell: ({ row }) => (row.original.gisPoint ? <Badge tone="success">● Есть точка</Badge> : <Badge>○ Нет точки</Badge>) },
  { header: 'Фото', cell: ({ row }) => `Фото: ${row.original.photos.length}` },
  { header: 'Редактировать', cell: ({ row }) => <DamageRowActions damage={row.original} /> },
];

export const DamagesTable = ({ data, isLoading, isError }: { data: Damage[]; isLoading?: boolean; isError?: boolean }) => (
  <DataTable
    data={data}
    columns={columns}
    isLoading={isLoading}
    isError={isError}
    emptyTitle="Повреждения не найдены"
    getRowDetails={(row) => (
      <div className="details-grid">
        <div className="details-item"><span>Источник тепла</span>{row.heatSource}</div>
        <div className="details-item"><span>Потребители</span>{row.disconnectedConsumers}</div>
        <div className="details-item"><span>Исполнитель</span>{row.contractorType}</div>
        <div className="details-item"><span>Состояние</span>{row.areaState}</div>
      </div>
    )}
  />
);
