import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import type { Order } from '@/entities';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { useArchiveOrder } from '@/features/orders/hooks/useOrders';
import { hasPermission } from '@/features/permissions/model/permissions';
import { Badge, Button, DataTable } from '@/shared/ui';

const orDash = (value: string | number | null | undefined) => (value === null || value === undefined || value === '' ? '-' : value);

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
  { header: 'Адрес', accessorKey: 'address' },
  { header: '№ ордера', accessorKey: 'orderNumber' },
  { header: 'Текущ./Гарант.', accessorKey: 'orderKind', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Дата открытия ордера', accessorKey: 'openedAt', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Ордер открыт до', accessorKey: 'validUntil', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Дата закрытия ордера', accessorKey: 'closedAt', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'З/зона, м²', accessorKey: 'greenZoneArea' },
  { header: 'Проезжая часть, м²', accessorKey: 'improvementMain' },
  { header: 'Внутрикварт. дорога, м²', accessorKey: 'improvementInnerRoad' },
  { header: 'Тротуар, м²', accessorKey: 'improvementSidewalk' },
  { header: 'Отмостка, м²', accessorKey: 'improvementBlindArea' },
  { header: 'Бордюр/поребрик, шт', accessorKey: 'curbCount' },
  { header: 'Состояние участка', accessorKey: 'areaState' },
  { header: 'Исполнитель благоустройства', accessorKey: 'contractorType' },
  { header: '№ договора', accessorKey: 'contractNumber', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Дата подачи заявки на восстановление благоустройства', accessorKey: 'contractorRequestDate', cell: ({ getValue }) => orDash(getValue() as string) },
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
