import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import type { Damage } from '@/entities';
import { districts } from '@/shared/constants/districts';
import { Badge, Button, DataTable } from '@/shared/ui';

const orDash = (value: string | number | null | undefined) => (value === null || value === undefined || value === '' ? '-' : value);

const columns: ColumnDef<Damage>[] = [
  { id: 'rowNumber', header: '№ п/п', cell: ({ row }) => row.index + 1, size: 70 },
  { header: 'Адрес', accessorKey: 'address' },
  { header: 'Район', cell: ({ row }) => districts.find((item) => item.id === row.original.districtId)?.name ?? '-' },
  { header: 'ОТ/ГВС', accessorKey: 'networkType' },
  { header: 'Дата обнаружения', accessorKey: 'detectedAt' },
  { header: 'Дата устранения', accessorKey: 'fixedAt', cell: ({ getValue }) => String(getValue() ?? '-') },
  { header: '№ ордера', accessorKey: 'orderNumber' },
  { header: 'Дата открытия ордера', accessorKey: 'orderOpenedAt', cell: ({ getValue }) => String(getValue() ?? '-') },
  { header: 'Ордер открыт до', accessorKey: 'orderValidUntil', cell: ({ getValue }) => String(getValue() ?? '-') },
  { header: 'От какого источника запитан', accessorKey: 'heatSource', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Текущее/Гидравлическое', accessorKey: 'damageType' },
  { header: 'Адреса отключенных абонентов', accessorKey: 'disconnectedAddresses', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Характер повреждения', accessorKey: 'damageDescription', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Текущий/Гарантийный', accessorKey: 'orderKind', cell: ({ getValue }) => String(getValue() ?? '-') },
  { header: 'З/зона, м²', accessorKey: 'greenZoneArea' },
  { header: 'Проезжая часть, м²', accessorKey: 'improvementMain' },
  { header: 'Внутрикварт. дорога, м²', accessorKey: 'improvementInnerRoad' },
  { header: 'Тротуар, м²', accessorKey: 'improvementSidewalk' },
  { header: 'Отмостка, м²', accessorKey: 'improvementBlindArea' },
  { header: 'Бордюр/поребрик, шт', accessorKey: 'curbCount' },
  { header: 'Состояние участка', accessorKey: 'areaState' },
  { header: 'Исполнитель', accessorKey: 'contractorType' },
  { header: '№ договора', accessorKey: 'contractNumber', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Дата подачи заявки', accessorKey: 'contractorRequestDate', cell: ({ getValue }) => String(getValue() ?? '-') },
  { header: 'Примечание', accessorKey: 'note', cell: ({ getValue }) => orDash(getValue() as string) },
  { header: 'Дата закрытия ордера', accessorKey: 'orderClosedAt', cell: ({ getValue }) => String(getValue() ?? '-') },
  { header: 'Фотоотчёт', cell: ({ row }) => `${row.original.photos.length} фото` },
  { header: 'Геолокация', cell: ({ row }) => (row.original.gisPoint ? <Badge tone="success">● Есть точка</Badge> : <Badge>○ Нет точки</Badge>) },
  { header: 'Открыть', cell: ({ row }) => <Button variant="secondary"><Link to={`/damages/${row.original.id}`}>Открыть</Link></Button> },
];

export const GeneralTable = ({ data, isLoading, isError }: { data: Damage[]; isLoading?: boolean; isError?: boolean }) => (
  <DataTable
    data={data}
    columns={columns}
    isLoading={isLoading}
    isError={isError}
    emptyTitle="Записи не найдены"
  />
);
