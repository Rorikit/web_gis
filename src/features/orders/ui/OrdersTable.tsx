import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import type { Order } from '@/entities';
import { Badge, Button, DataTable } from '@/shared/ui';

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
  { header: 'Редактировать', cell: ({ row }) => <Button variant="secondary"><Link to={`/orders/${row.original.id}`}>Открыть</Link></Button> },
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
