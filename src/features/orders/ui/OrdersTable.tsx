import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import type { Order } from '@/entities';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { useArchiveOrder } from '@/features/orders/hooks/useOrders';
import { hasPermission } from '@/features/permissions/model/permissions';
import { Badge, Button, DataTable } from '@/shared/ui';

const orDash = (value: string | number | null | undefined) => (value === null || value === undefined || value === '' ? '-' : value);

const improvementSummary = (order: Order) => {
  const parts = [
    ['Основная', order.improvementMain],
    ['Внутрикварт. дорога', order.improvementInnerRoad],
    ['Тротуар', order.improvementSidewalk],
    ['Отмостка', order.improvementBlindArea],
  ] as const;
  const selected = parts.filter(([, flag]) => flag).map(([label]) => label);
  return selected.length ? selected.join(', ') : '-';
};

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

// Приложение №5 «Ордера»
const columns: ColumnDef<Order>[] = [
  { id: 'rowNumber', header: '№ п/п', cell: ({ row }) => row.index + 1, size: 70 },
  { header: '№ ордера', accessorKey: 'orderNumber' },
  { header: 'Адрес', accessorKey: 'address' },
  { header: 'Текущ./Гарант.', accessorKey: 'orderKind', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Дата открытия ордера', accessorKey: 'openedAt', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Ордер открыт до', accessorKey: 'validUntil', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Дата закрытия ордера', accessorKey: 'closedAt', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'З/зона, м²', accessorKey: 'greenZoneArea' },
  { header: 'Асфальт, м²', accessorKey: 'asphaltArea' },
  { header: 'Основная/внутрикварт. дорога, тротуар, отмостка', cell: ({ row }) => improvementSummary(row.original) },
  { header: 'Бордюр/поребрик', accessorKey: 'curbCount' },
  { header: 'Состояние участка', accessorKey: 'areaState' },
  { header: 'Подрядчик/УРТС/Участок', accessorKey: 'contractorType' },
  { header: '№ договора', accessorKey: 'contractNumber', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Дата подачи заявки на восстановление благоустройства', accessorKey: 'contractorRequestDate', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Срок выполнения работ по графику', accessorKey: 'plannedFinishDate', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Примечание', accessorKey: 'note', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Фотоотчёт', cell: ({ row }) => `${row.original.photos?.length ?? 0} фото` },
  { header: 'Геолокация на карте', cell: ({ row }) => (row.original.gisPoint ? <Badge tone="success">● Есть точка</Badge> : <Badge>○ Нет точки</Badge>) },
  { header: 'Редактировать', cell: ({ row }) => <OrderRowActions order={row.original} /> },
];

export const OrdersTable = ({ data, isLoading, isError }: { data: Order[]; isLoading?: boolean; isError?: boolean }) => (
  <DataTable
    data={data}
    columns={columns}
    isLoading={isLoading}
    isError={isError}
    emptyTitle="Ордера не найдены"
  />
);
