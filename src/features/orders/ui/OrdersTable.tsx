import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import type { Order } from '@/entities';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { useArchiveOrder } from '@/features/orders/hooks/useOrders';
import { hasPermission } from '@/features/permissions/model/permissions';
import { Badge, Button, DataTable } from '@/shared/ui';

const OrderRowActions = ({ order }: { order: Order }) => {
  const { data: user } = useCurrentUser();
  const archive = useArchiveOrder();
  const canClose = hasPermission(user?.role, 'order.update');
  const isClosed = Boolean(order.closedAt);

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button variant="secondary"><Link to={`/orders/${order.id}`}>Открыть</Link></Button>
      <Button
        variant="secondary"
        disabled={!canClose || isClosed || archive.isPending}
        onClick={() => archive.mutate(order.id)}
      >
        {isClosed ? 'Закрыт' : 'Закрыть'}
      </Button>
    </div>
  );
};

const columns: ColumnDef<Order>[] = [
  { header: '№', accessorKey: 'id' },
  { header: '№ ордера', accessorKey: 'orderNumber' },
  { header: 'Адрес', accessorKey: 'address' },
  { header: 'Тип ордера', accessorKey: 'orderKind' },
  { header: 'Дата открытия', accessorKey: 'openedAt' },
  { header: 'Ордер открыт до', accessorKey: 'validUntil' },
  { header: 'Дата закрытия', accessorKey: 'closedAt', cell: ({ getValue }) => String(getValue() ?? '-') },
  { header: 'Состояние', accessorKey: 'areaState' },
  { header: 'Исполнитель', accessorKey: 'contractorName' },
  { header: 'GIS', cell: ({ row }) => (row.original.gisPoint ? <Badge tone="success">● Есть точка</Badge> : <Badge>○ Нет точки</Badge>) },
  { header: 'Редактировать', cell: ({ row }) => <OrderRowActions order={row.original} /> },
];

export const OrdersTable = ({ data, isLoading, isError }: { data: Order[]; isLoading?: boolean; isError?: boolean }) => (
  <DataTable
    data={data}
    columns={columns}
    isLoading={isLoading}
    isError={isError}
    emptyTitle="Ордера не найдены"
    getRowDetails={(row) => (
      <div className="details-grid">
        <div className="details-item"><span>Договор</span>{row.contractNumber || '-'}</div>
        <div className="details-item"><span>Срок выполнения</span>{row.plannedFinishDate || '-'}</div>
        <div className="details-item"><span>Тип исполнителя</span>{row.contractorType}</div>
        <div className="details-item"><span>Примечание</span>{row.note || '-'}</div>
      </div>
    )}
  />
);
