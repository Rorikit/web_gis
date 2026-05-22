import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
} from '@tanstack/react-table';
import { Fragment, useState, type ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Skeleton } from './Skeleton';

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  isError?: boolean;
  emptyTitle?: string;
  getRowDetails?: (row: T) => ReactNode;
};

export const DataTable = <T,>({ data, columns, isLoading, isError, emptyTitle = 'Нет данных', getRowDetails }: DataTableProps<T>) => {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const table = useReactTable({
    data,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  if (isLoading) return <Skeleton rows={8} />;
  if (isError) return <ErrorState title="Ошибка загрузки данных" />;
  if (!data.length) return <EmptyState title={emptyTitle} />;

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => (
                <th key={header.id} className={index === 0 ? 'is-sticky-left' : index === headerGroup.headers.length - 1 ? 'is-sticky-right' : ''}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <Fragment key={row.id}>
              <tr onDoubleClick={row.getToggleExpandedHandler()}>
                {row.getVisibleCells().map((cell, index) => (
                  <td key={cell.id} className={index === 0 ? 'is-sticky-left' : index === row.getVisibleCells().length - 1 ? 'is-sticky-right' : ''}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
              {row.getIsExpanded() && getRowDetails && (
                <tr className="data-table__details">
                  <td colSpan={row.getVisibleCells().length}>{getRowDetails(row.original)}</td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
