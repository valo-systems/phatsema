import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CompactTable, LineItemEditor } from './CompactTable';

describe('shared secondary table renderers', () => {
  it('contains read-only detail tables in the shared focusable frame', () => {
    render(
      <CompactTable label="Location balances">
        <thead><tr><th>Location</th></tr></thead>
        <tbody><tr><td>Main store</td></tr></tbody>
      </CompactTable>,
    );

    const region = screen.getByRole('region', { name: 'Location balances' });
    expect(region).toHaveClass('compact-table-frame');
    expect(screen.getByRole('table')).toHaveClass('compact-table');
    expect(screen.getByText('Main store')).toBeVisible();
  });

  it('contains editable line tables in the shared transaction frame', () => {
    render(
      <LineItemEditor label="Receipt lines">
        <thead><tr><th>Item</th></tr></thead>
        <tbody><tr><td>Hydraulic fluid</td></tr></tbody>
      </LineItemEditor>,
    );

    const region = screen.getByRole('region', { name: 'Receipt lines' });
    expect(region).toHaveClass('line-item-table-frame');
    expect(screen.getByRole('table')).toHaveClass('line-item-table');
  });
});
