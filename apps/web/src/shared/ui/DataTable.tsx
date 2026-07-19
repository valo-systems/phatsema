import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, MoreHorizontal, Settings2 } from 'lucide-react';
import { cn } from './cn';
import { Button, Checkbox, IconButton, SegmentedControl, Select } from './controls';
import { Skeleton } from './surfaces';
import { EmptyState, ErrorState } from './states';
import { downloadCsv } from '@/shared/format/csv';

export interface DataTableColumn<Row> {
  key: string;
  header: string;
  cell: (row: Row) => ReactNode;
  /** Plain-text accessor for CSV export. */
  text?: (row: Row) => string;
  sortable?: boolean;
  numeric?: boolean;
  /** Visual importance used by the mobile record renderer. */
  priority?: 'primary' | 'secondary' | 'tertiary';
  /** Hide the desktop column below this breakpoint. */
  hideBelow?: 'sm' | 'md' | 'lg';
  /** Essential columns remain visible in the column menu. */
  required?: boolean;
  /** @deprecated Use priority and hideBelow. */
  secondary?: boolean;
}

interface DataTableProps<Row> {
  caption: string;
  columns: Array<DataTableColumn<Row>>;
  rows: Row[] | undefined;
  rowKey: (row: Row) => string;
  loading: boolean;
  error?: unknown;
  onRetry?: () => void;
  sort?: string | undefined;
  onToggleSort?: (key: string) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRowClick?: (row: Row) => void;
  empty?: { title: string; description?: string; action?: ReactNode };
  csvName?: string;
  /** Search and filter controls bound to the top of the data surface. */
  toolbar?: ReactNode;
  /** Compact summary metrics rendered above the toolbar. */
  summary?: ReactNode;
  /** Enables density and column visibility controls. */
  configurable?: boolean;
  /** Enables row selection and renders actions for the selected records. */
  bulkActions?: (selectedRows: Row[], clearSelection: () => void) => ReactNode;
  /** Enables selection without requiring a bulk action. */
  selectable?: boolean;
  /** Shows a compact final action affordance that opens the row. */
  showRowActions?: boolean;
  /** Adds a restrained left accent for exception rows. */
  rowTone?: (row: Row) => 'default' | 'warning' | 'danger';
}

export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  sort,
  onToggleSort,
  page = 1,
  pageSize = 25,
  total,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  empty,
  csvName,
  toolbar,
  summary,
  configurable = true,
  bulkActions,
  selectable = false,
  showRowActions = false,
  rowTone,
}: DataTableProps<Row>) {
  const [density, setDensity] = useState(readDensityPreference);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
  const selectedRows = (rows ?? []).filter((row) => selectedKeys.includes(rowKey(row)));
  const selectionEnabled = selectable || Boolean(bulkActions);

  useEffect(() => {
    try {
      window.localStorage?.setItem?.('phatsema.table-density', density);
    } catch {
      // Storage can be unavailable in hardened browsers; density still works for the session.
    }
  }, [density]);

  const columnDefs = useMemo<Array<ColumnDef<Row>>>(
    () =>
      visibleColumns.map((column) => ({
        id: column.key,
        header: column.header,
        cell: (context) => column.cell(context.row.original),
      })),
    [visibleColumns],
  );

  const table = useReactTable({
    data: rows ?? [],
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => rowKey(row),
    manualSorting: true,
    manualPagination: true,
  });

  if (error) return <ErrorState error={error} {...(onRetry ? { onRetry } : {})} />;

  const pageCount = total !== undefined ? Math.max(1, Math.ceil(total / pageSize)) : undefined;

  const exportCsv = () => {
    if (!rows || !csvName) return;
    downloadCsv(
      `${csvName}.csv`,
      visibleColumns.map((c) => c.header),
      rows.map((row) => visibleColumns.map((c) => c.text?.(row) ?? plainText(c.cell(row)))),
    );
  };

  const allSelected = Boolean(rows?.length) && rows!.every((row) => selectedKeys.includes(rowKey(row)));
  const toggleAll = (checked: boolean) => setSelectedKeys(checked && rows ? rows.map(rowKey) : []);
  const toggleRow = (key: string, checked: boolean) =>
    setSelectedKeys((current) => checked ? [...new Set([...current, key])] : current.filter((value) => value !== key));
  const cellPadding = density === 'compact' ? 'px-4 py-2' : 'px-4 py-3';

  return (
    <div className="space-y-4">
      {summary}
      <div className="overflow-hidden rounded-[14px] border border-line bg-surface shadow-table">
      {configurable && (
        <div className="hidden flex-wrap items-center justify-end gap-2 border-b border-line bg-thead/50 px-4 py-2 md:flex">
          <SegmentedControl
            aria-label="Table density"
            value={density}
            onValueChange={setDensity}
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ]}
          />
          <details className="relative">
            <summary className="focus-ring flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-medium text-ink-secondary shadow-low hover:border-line-strong hover:bg-sunken">
              <Settings2 aria-hidden className="size-4" />
              Columns
            </summary>
            <div className="absolute top-full right-0 z-30 mt-1 min-w-52 space-y-2 rounded-md border border-line bg-surface p-3 shadow-high">
              {columns.map((column) => (
                <Checkbox
                  key={column.key}
                  label={column.header}
                  checked={!hiddenColumns.includes(column.key)}
                  disabled={column.required || column.priority === 'primary' || (visibleColumns.length === 1 && !hiddenColumns.includes(column.key))}
                  onCheckedChange={(checked) =>
                    setHiddenColumns((current) =>
                      checked ? current.filter((key) => key !== column.key) : [...current, column.key],
                    )
                  }
                />
              ))}
            </div>
          </details>
        </div>
      )}
      {toolbar}
      {bulkActions && selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 bg-primary-soft px-3 py-2">
          <span className="text-sm font-medium text-ink">{selectedRows.length} selected</span>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions(selectedRows, () => setSelectedKeys([]))}
          </div>
        </div>
      )}
      <div
        className="hidden max-h-[70vh] overflow-auto scrollbar-thin md:block"
        role="region"
        aria-label={caption}
        tabIndex={0}
      >
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 z-10 bg-thead text-left">
            <tr>
              {selectionEnabled && (
                <th scope="col" className={cn('w-10 border-b border-line', cellPadding)}>
                  <Checkbox
                    label="Select all rows"
                    hideLabel
                    checked={allSelected}
                    indeterminate={selectedKeys.length > 0 && !allSelected}
                    onCheckedChange={toggleAll}
                  />
                </th>
              )}
              {visibleColumns.map((column) => {
                const active = sort === column.key || sort === `-${column.key}`;
                const descending = sort === `-${column.key}`;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={active ? (descending ? 'descending' : 'ascending') : undefined}
                    className={cn(
                      'border-b border-line text-xs font-semibold tracking-wide text-thead-ink',
                      cellPadding,
                      column.numeric && 'text-right',
                      responsiveClass(column),
                    )}
                  >
                    {column.sortable && onToggleSort ? (
                      // eslint-disable-next-line no-restricted-syntax -- column sort affordance lives inside <th>; Button would break table semantics
                      <button
                        type="button"
                        onClick={() => onToggleSort(column.key)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-sm hover:text-ink',
                          active && 'text-primary',
                        )}
                      >
                        {column.header}
                        {active ? (
                          descending ? (
                            <ArrowDown aria-hidden className="size-3" />
                          ) : (
                            <ArrowUp aria-hidden className="size-3" />
                          )
                        ) : (
                          <ArrowUpDown aria-hidden className="size-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
              {showRowActions && <th scope="col" className={cn('w-16 border-b border-line text-right text-xs font-semibold text-thead-ink', cellPadding)}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}>
                  {selectionEnabled && <td className={cn('border-b border-line', cellPadding)}><Skeleton className="size-4" /></td>}
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('border-b border-line', cellPadding, responsiveClass(column))}
                    >
                      <Skeleton className="h-4 w-full max-w-32" />
                    </td>
                  ))}
                  {showRowActions && <td className={cn('border-b border-line', cellPadding)}><Skeleton className="ml-auto size-8" /></td>}
                </tr>
              ))}
            {!loading &&
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'group transition-colors hover:bg-row-hover',
                    onRowClick && 'cursor-pointer',
                    selectedKeys.includes(row.id) && 'bg-row-selected',
                    rowTone?.(row.original) === 'warning' && 'border-l-2 border-l-warning bg-warning-soft/20',
                    rowTone?.(row.original) === 'danger' && 'border-l-2 border-l-danger bg-danger-soft/20',
                  )}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {selectionEnabled && (
                    <td className={cn('border-b border-line', cellPadding)}>
                      <div onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          label={`Select row ${row.id}`}
                          hideLabel
                          checked={selectedKeys.includes(row.id)}
                          onCheckedChange={(checked) => toggleRow(row.id, checked)}
                        />
                      </div>
                    </td>
                  )}
                  {row.getVisibleCells().map((cell, index) => {
                    const column = visibleColumns[index];
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          'border-b border-line align-middle text-ink',
                          cellPadding,
                          column?.numeric && 'text-right',
                          column && responsiveClass(column),
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                  {showRowActions && (
                    <td className={cn('border-b border-line text-right', cellPadding)}>
                      <div onClick={(event) => event.stopPropagation()}>
                        <IconButton
                          size="sm"
                          aria-label={`Open ${caption} record`}
                          onClick={() => onRowClick?.(row.original)}
                          icon={<MoreHorizontal aria-hidden className="size-4" />}
                          className="border border-line bg-surface shadow-low hover:border-line-strong"
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
        {!loading && rows && rows.length === 0 && (
          <div className="p-4">
            <EmptyState
              title={empty?.title ?? 'Nothing here yet'}
              {...(empty?.description ? { description: empty.description } : {})}
              {...(empty?.action ? { action: empty.action } : {})}
            />
          </div>
        )}
      </div>
      <div className="divide-y divide-line md:hidden" role="list" aria-label={caption}>
        {loading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2 p-3" role="listitem">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        {!loading &&
          table.getRowModel().rows.map((row) => {
            const mobileColumns = visibleColumns.filter((column) => column.priority !== 'tertiary');
            const titleColumn = mobileColumns.find((column) => column.priority === 'primary') ?? mobileColumns[0];
            return (
              <div
                key={row.id}
                role="listitem"
                className={cn(
                  'p-3',
                  onRowClick && 'cursor-pointer active:bg-primary-soft/40',
                  rowTone?.(row.original) === 'warning' && 'border-l-2 border-l-warning bg-warning-soft/20',
                  rowTone?.(row.original) === 'danger' && 'border-l-2 border-l-danger bg-danger-soft/20',
                )}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              >
                <div className="flex items-start gap-3">
                  {selectionEnabled && (
                    <div onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        label={`Select row ${row.id}`}
                        hideLabel
                        checked={selectedKeys.includes(row.id)}
                        onCheckedChange={(checked) => toggleRow(row.id, checked)}
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {titleColumn && <div className="font-medium text-ink">{titleColumn.cell(row.original)}</div>}
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
                      {mobileColumns.filter((column) => column.key !== titleColumn?.key).map((column) => (
                        <div key={column.key} className="min-w-0">
                          <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">{column.header}</dt>
                          <dd className={cn('mt-0.5 truncate text-sm text-ink', column.numeric && 'numeric')}>
                            {column.cell(row.original)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </div>
            );
          })}
        {!loading && rows && rows.length === 0 && (
          <div className="p-4">
            <EmptyState
              title={empty?.title ?? 'Nothing here yet'}
              {...(empty?.description ? { description: empty.description } : {})}
              {...(empty?.action ? { action: empty.action } : {})}
            />
          </div>
        )}
      </div>
      {(pageCount !== undefined || csvName) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3">
          <div className="text-xs text-muted" data-numeric>
            {total !== undefined && (
              <>
                {total === 0 ? 'No records' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pageCount !== undefined && onPageChange && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft aria-hidden className="size-4" />
                </Button>
                {pageNumbers(page, pageCount).map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    size="sm"
                    variant={pageNumber === page ? 'primary' : 'ghost'}
                    aria-label={`Page ${pageNumber}`}
                    aria-current={pageNumber === page ? 'page' : undefined}
                    onClick={() => onPageChange(pageNumber)}
                    className="min-w-8 px-2"
                  >
                    {pageNumber}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page >= pageCount}
                  onClick={() => onPageChange(page + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight aria-hidden className="size-4" />
                </Button>
              </>
            )}
            {onPageSizeChange && (
              <Select
                aria-label="Rows per page"
                size="sm"
                value={String(pageSize)}
                onValueChange={(value) => onPageSizeChange(Number(value))}
                options={[10, 25, 50, 100].map((size) => ({ value: String(size), label: `${size} per page` }))}
                className="w-32"
              />
            )}
            {csvName && rows && rows.length > 0 && (
              <Button size="sm" variant="secondary" onClick={exportCsv}>
                <Download aria-hidden className="size-3.5" /> Export
              </Button>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function responsiveClass<Row>(column: DataTableColumn<Row>): string | undefined {
  const breakpoint = column.hideBelow ?? (column.secondary ? 'md' : undefined);
  if (breakpoint === 'sm') return 'hidden sm:table-cell';
  if (breakpoint === 'md') return 'hidden md:table-cell';
  if (breakpoint === 'lg') return 'hidden lg:table-cell';
  return undefined;
}

function plainText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(plainText).join(' ');
  if (typeof node === 'object' && 'props' in node) {
    const props = (node as { props: { children?: ReactNode } }).props;
    return plainText(props.children);
  }
  return '';
}

function pageNumbers(page: number, pageCount: number): number[] {
  const start = Math.max(1, Math.min(page - 1, pageCount - 2));
  const end = Math.min(pageCount, start + 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function readDensityPreference(): string {
  if (typeof window === 'undefined') return 'comfortable';
  try {
    return window.localStorage?.getItem?.('phatsema.table-density') ?? 'comfortable';
  } catch {
    return 'comfortable';
  }
}
