import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import type { Damage } from '@/entities';
import { districts } from '@/shared/constants/districts';
import { Badge, Button, DataTable } from '@/shared/ui';

const columns: ColumnDef<Damage>[] = [
  { header: '№', accessorKey: 'id', size: 90 },
  { header: 'Район', cell: ({ row }) => districts.find((item) => item.id === row.original.districtId)?.name ?? '-' },
  { header: 'Адрес', accessorKey: 'address' },
  { header: 'ОТ/ГВС', accessorKey: 'networkType' },
  { header: 'Дата обнаружения', accessorKey: 'detectedAt' },
  { header: 'Дата устранения', accessorKey: 'fixedAt', cell: ({ getValue }) => String(getValue() ?? '-') },
  { header: '№ ордера', accessorKey: 'orderNumber' },
  { header: 'Дата открытия ордера', accessorKey: 'orderOpenedAt' },
  { header: 'Ордер открыт до', accessorKey: 'orderValidUntil' },
  { header: 'Дата закрытия ордера', accessorKey: 'orderClosedAt', cell: ({ getValue }) => String(getValue() ?? '-') },
  { header: 'Текущий/Гарантийный', accessorKey: 'orderKind' },
  { header: 'Состояние участка', accessorKey: 'areaState' },
  { header: 'GIS', cell: ({ row }) => (row.original.gisPoint ? <Badge tone="success">● Есть точка</Badge> : <Badge>○ Нет точки</Badge>) },
  { header: 'Открыть', cell: ({ row }) => <Button variant="secondary"><Link to={`/damages/${row.original.id}`}>Открыть</Link></Button> },
];

export const GeneralTable = ({ data, isLoading, isError }: { data: Damage[]; isLoading?: boolean; isError?: boolean }) => (
  <DataTable
    data={data}
    columns={columns}
    isLoading={isLoading}
    isError={isError}
    emptyTitle="Записи не найдены"
    getRowDetails={(row) => (
      <div className="details-grid">
        <div className="details-item"><span>От какого источника запитан</span>{row.heatSource || '-'}</div>
        <div className="details-item"><span>Признак повреждения</span>{row.damageType}</div>
        <div className="details-item"><span>Отключенные абоненты</span>{row.disconnectedConsumers}</div>
        <div className="details-item"><span>Характер повреждения</span>{row.damageDescription || '-'}</div>
        <div className="details-item"><span>Зеленая зона, м²</span>{row.greenZoneArea}</div>
        <div className="details-item"><span>Асфальт, м²</span>{row.asphaltArea}</div>
        <div className="details-item"><span>Бордюры/поребрик, шт</span>{row.curbCount}</div>
        <div className="details-item"><span>Благоустройство</span>
          {[
            row.improvementMain && 'основная',
            row.improvementInnerRoad && 'внутриквартальная дорога',
            row.improvementSidewalk && 'тротуар',
            row.improvementBlindArea && 'отмостка',
          ].filter(Boolean).join(', ') || '-'}
        </div>
        <div className="details-item"><span>Исполнитель благоустройства</span>{row.contractorType}</div>
        <div className="details-item"><span>№ договора</span>{row.contractNumber || '-'}</div>
        <div className="details-item"><span>Дата подачи заявки подрядчику</span>{row.contractorRequestDate || '-'}</div>
        <div className="details-item"><span>Срок выполнения работ по графику</span>{row.plannedFinishDate || '-'}</div>
        <div className="details-item"><span>Примечание</span>{row.note || '-'}</div>
        <div className="details-item"><span>Фото</span>{`Фото: ${row.photos.length}`}</div>
      </div>
    )}
  />
);
