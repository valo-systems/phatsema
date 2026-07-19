import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { useTableState } from './useTableState';

/**
 * Safety net for the shared list-page state contract.
 *
 * Every list page reads filters, sort, paging and search from the URL through
 * this hook, so these assertions are what protect the control migration:
 * swapping native selects for Ark Select must not change the query string.
 */
function wrapperFor(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>;
  };
}

const FILTERS = ['status', 'categoryId'] as const;

describe('useTableState', () => {
  it('applies documented defaults when the URL is bare', () => {
    const { result } = renderHook(() => useTableState(FILTERS), {
      wrapper: wrapperFor('/inventory/items'),
    });

    expect(result.current.state.page).toBe(1);
    expect(result.current.state.pageSize).toBe(25);
    expect(result.current.state.sort).toBeUndefined();
    expect(result.current.state.q).toBe('');
    expect(result.current.state.filters).toEqual({});
  });

  it('hydrates state from an existing query string', () => {
    const { result } = renderHook(() => useTableState(FILTERS), {
      wrapper: wrapperFor('/inventory/items?page=3&size=50&sort=-sku&q=grdc&status=active'),
    });

    expect(result.current.state.page).toBe(3);
    expect(result.current.state.pageSize).toBe(50);
    expect(result.current.state.sort).toBe('-sku');
    expect(result.current.state.q).toBe('grdc');
    expect(result.current.state.filters).toEqual({ status: 'active' });
  });

  it('only surfaces filters it was told to track', () => {
    const { result } = renderHook(() => useTableState(FILTERS), {
      wrapper: wrapperFor('/inventory/items?status=active&somethingElse=nope'),
    });

    expect(result.current.state.filters).toEqual({ status: 'active' });
  });

  it('clamps hostile paging values instead of trusting the URL', () => {
    const { result } = renderHook(() => useTableState(FILTERS), {
      wrapper: wrapperFor('/inventory/items?page=-5&size=9999'),
    });

    expect(result.current.state.page).toBe(1);
    expect(result.current.state.pageSize).toBe(100);
  });

  it('cycles sort ascending, descending, then off', () => {
    const { result } = renderHook(() => useTableState(FILTERS), {
      wrapper: wrapperFor('/inventory/items'),
    });

    act(() => result.current.toggleSort('sku'));
    expect(result.current.state.sort).toBe('sku');

    act(() => result.current.toggleSort('sku'));
    expect(result.current.state.sort).toBe('-sku');

    act(() => result.current.toggleSort('sku'));
    expect(result.current.state.sort).toBeUndefined();
  });

  it('starts a new ascending cycle when a different column is sorted', () => {
    const { result } = renderHook(() => useTableState(FILTERS), {
      wrapper: wrapperFor('/inventory/items?sort=-sku'),
    });

    act(() => result.current.toggleSort('name'));

    expect(result.current.state.sort).toBe('name');
  });

  it('returns to page one when the search term changes', () => {
    const { result } = renderHook(() => useTableState(FILTERS), {
      wrapper: wrapperFor('/inventory/items?page=4'),
    });

    act(() => result.current.update({ q: 'hydraulic' }));

    expect(result.current.state.q).toBe('hydraulic');
    expect(result.current.state.page).toBe(1);
  });

  it('returns to page one when a filter changes', () => {
    const { result } = renderHook(() => useTableState(FILTERS), {
      wrapper: wrapperFor('/inventory/items?page=4'),
    });

    act(() => result.current.update({ filters: { status: 'inactive' } }));

    expect(result.current.state.filters).toEqual({ status: 'inactive' });
    expect(result.current.state.page).toBe(1);
  });

  it('clears a filter when set to null', () => {
    const { result } = renderHook(() => useTableState(FILTERS), {
      wrapper: wrapperFor('/inventory/items?status=active&categoryId=abc'),
    });

    act(() => result.current.update({ filters: { status: null } }));

    expect(result.current.state.filters).toEqual({ categoryId: 'abc' });
  });

  it('clears an empty search rather than storing a blank parameter', () => {
    const { result } = renderHook(() => useTableState(FILTERS), {
      wrapper: wrapperFor('/inventory/items?q=grdc'),
    });

    act(() => result.current.update({ q: '' }));

    expect(result.current.state.q).toBe('');
  });

  it('preserves unrelated filters while paging', () => {
    const { result } = renderHook(() => useTableState(FILTERS), {
      wrapper: wrapperFor('/inventory/items?status=active&q=oil'),
    });

    act(() => result.current.update({ page: 2 }));

    expect(result.current.state.page).toBe(2);
    expect(result.current.state.filters).toEqual({ status: 'active' });
    expect(result.current.state.q).toBe('oil');
  });
});
