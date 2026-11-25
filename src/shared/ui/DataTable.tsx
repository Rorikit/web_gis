import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type SortingState,
} from '@tanstack/react-table';
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
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

const sortIndicator = (direction: false | 'asc' | 'desc') => {
  if (direction === 'asc') return '▲';
  if (direction === 'desc') return '▼';
  return '↕';
};

export const DataTable = <T,>({ data, columns, isLoading, isError, emptyTitle = 'Нет данных', getRowDetails }: DataTableProps<T>) => {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [firstColumnWidth, setFirstColumnWidth] = useState(0);
  const [scrollInfo, setScrollInfo] = useState({ width: 0, visible: false, offsetLeft: 0, viewportWidth: 0 });
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);

  const table = useReactTable({
    data,
    columns,
    state: { expanded, sorting },
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const syncLayout = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const firstHeader = wrap.querySelector<HTMLTableCellElement>('thead th');
    setFirstColumnWidth(firstHeader ? firstHeader.getBoundingClientRect().width : 0);
    setScrollInfo((previous) => {
      const next = {
        width: wrap.scrollWidth,
        visible: wrap.scrollWidth > wrap.clientWidth + 1,
        offsetLeft: rect.left,
        viewportWidth: rect.width,
      };
      if (
        previous.width === next.width
        && previous.visible === next.visible
        && previous.offsetLeft === next.offsetLeft
        && previous.viewportWidth === next.viewportWidth
      ) {
        return previous;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    syncLayout();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const observer = new ResizeObserver(syncLayout);
    observer.observe(wrap);
    window.addEventListener('resize', syncLayout);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncLayout);
    };
  }, [syncLayout, data]);

  if (isLoading) return <Skeleton rows={8} />;
  if (isError) return <ErrorState title="Ошибка загрузки данных" />;
  if (!data.length) return <EmptyState title={emptyTitle} />;

  const stickyClass = (index: number, total: number) => {
    if (index === 0) return 'is-sticky-left';
    if (index === 1) return 'is-sticky-left is-sticky-left-2';
    if (index === total - 1 && total > 2) return 'is-sticky-right';
    return '';
  };

  return (
    <>
      <div
        className="data-table-wrap"
        ref={wrapRef}
        onScroll={() => {
          syncLayout();
          const wrap = wrapRef.current;
          const floating = floatingRef.current;
          if (wrap && floating && floating.scrollLeft !== wrap.scrollLeft) {
            floating.scrollLeft = wrap.scrollLeft;
          }
        }}
      >
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => (
                  <th
                    key={header.id}
                    className={stickyClass(index, headerGroup.headers.length)}
                    style={index === 1 ? { left: firstColumnWidth } : undefined}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="data-table__sort"
                        disabled={!header.column.getCanSort()}
                        onClick={header.column.getToggleSortingHandler()}
                        title={header.column.getCanSort() ? 'Сортировать' : undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="data-table__sort-icon">{sortIndicator(header.column.getIsSorted())}</span>
                        )}
                      </button>
                    )}
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
                    <td
                      key={cell.id}
                      className={stickyClass(index, row.getVisibleCells().length)}
                      style={index === 1 ? { left: firstColumnWidth } : undefined}
                    >
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
      {scrollInfo.visible && (
        <div
          className="data-table-floating-scrollbar"
          ref={floatingRef}
          style={{ left: scrollInfo.offsetLeft, width: scrollInfo.viewportWidth }}
          onScroll={(event) => {
            const wrap = wrapRef.current;
            const value = event.currentTarget.scrollLeft;
            if (wrap && wrap.scrollLeft !== value) {
              wrap.scrollLeft = value;
            }
          }}
        >
          <div className="data-table-floating-scrollbar__inner" style={{ width: scrollInfo.width }} />
        </div>
      )}
    </>
  );
};
