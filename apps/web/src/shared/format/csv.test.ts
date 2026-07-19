import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadCsv, toCsv } from './csv';

describe('CSV export', () => {
  it('escapes commas, quotes, and line breaks', () => {
    expect(toCsv(['Name', 'Note'], [['DEMO Item, A', 'Said "ready"\nToday']])).toBe(
      'Name,Note\r\n"DEMO Item, A","Said ""ready""\nToday"',
    );
  });

  it('creates and revokes a browser download URL', () => {
    const createObjectURL = vi.fn(() => 'blob:demo');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    downloadCsv('demo.csv', ['Name'], [['DEMO item']]);

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:demo');
  });

  afterEach(() => vi.restoreAllMocks());
});
