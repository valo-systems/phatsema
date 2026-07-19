import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type DataTableColumn } from './DataTable';
import { DataToolbar } from './data/DataToolbar';

interface Row {
  id: string;
  name: string;
  status: string;
}

const rows: Row[] = [
  { id: '1', name: 'Hydraulic Fluid', status: 'active' },
  { id: '2', name: 'Safety Helmet', status: 'inactive' },
];

const columns: Array<DataTableColumn<Row>> = [
  { key: 'name', header: 'Name', priority: 'primary', cell: (row) => row.name },
  { key: 'status', header: 'Status', priority: 'secondary', hideBelow: 'md', cell: (row) => row.status },
];

function Harness({ onPageChange = () => {} }: { onPageChange?: (page: number) => void }) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  return (
    <DataTable
      caption="Inventory items"
      columns={columns}
      rows={rows.filter((row) => row.name.toLowerCase().includes(search.toLowerCase()))}
      rowKey={(row) => row.id}
      loading={false}
      page={1}
      pageSize={1}
      total={2}
      onPageChange={onPageChange}
      toolbar={
        <DataToolbar
          searchValue={search}
          onSearchChange={setSearch}
          values={filters}
          onFilterChange={(key, value) => setFilters((current) => ({ ...current, [key]: value ?? '' }))}
          filters={[{
            key: 'status',
            label: 'Status',
            options: [{ value: 'active', label: 'Active' }],
          }]}
        />
      }
    />
  );
}

describe('DataTable composition', () => {
  it('filters records through the shared search toolbar', async () => {
    render(<Harness />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search' }), 'helmet');
    expect(screen.getAllByText('Safety Helmet').length).toBeGreaterThan(0);
    expect(screen.queryByText('Hydraulic Fluid')).not.toBeInTheDocument();
  });

  it('exposes shared filter, density and column controls', () => {
    render(<Harness />);
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Table density' })).toBeInTheDocument();
    expect(screen.getByText('Columns')).toBeInTheDocument();
  });

  it('routes pagination through the supplied page callback', async () => {
    const onPageChange = vi.fn();
    render(<Harness onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('renders a mobile record representation from the same columns', () => {
    render(<Harness />);
    expect(screen.getByRole('list', { name: 'Inventory items' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
