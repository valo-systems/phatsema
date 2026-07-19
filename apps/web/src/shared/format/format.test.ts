import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatQuantity,
  formatRelative,
  label,
  todayISODate,
} from './format';

describe('display formatting', () => {
  it('uses South African currency formatting', () => {
    expect(formatMoney('1250')).toContain('1');
    expect(formatMoney('1250')).toContain('250');
  });

  it('formats quantities and enum labels', () => {
    expect(formatQuantity('12.500', 'kg')).toBe('12,5 kg');
    expect(label('in_maintenance')).toBe('In maintenance');
    expect(label('custom_state')).toBe('custom state');
    expect(label(null)).toBe('Not set');
  });

  it('formats dates and falls back safely for invalid values', () => {
    expect(formatDate('2026-07-19T10:30:00Z')).toMatch(/19 Jul 2026/);
    expect(formatDateTime('2026-07-19T10:30:00Z')).toMatch(/19 Jul 2026/);
    expect(formatDate('not-a-date')).toBe('not-a-date');
    expect(formatDateTime('not-a-date')).toBe('not-a-date');
    expect(formatRelative('not-a-date')).toBe('not-a-date');
  });

  it('uses the current day for form defaults and relative labels', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'));

    expect(todayISODate()).toBe('2026-07-19');
    expect(formatRelative('2026-07-18T12:00:00Z')).toContain('ago');
  });

  afterEach(() => vi.useRealTimers());
});
