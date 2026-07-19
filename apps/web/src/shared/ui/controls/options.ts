import { label } from '@/shared/format/format';
import type { SelectOption } from './Select';

/**
 * Option builders shared by every filter and form select.
 *
 * Enum options route through `label()` so a status reads the same everywhere in
 * the application, and no page invents its own wording.
 */

/** Build options from API enum values, e.g. ['active', 'inactive']. */
export function enumOptions(values: readonly string[]): SelectOption[] {
  return values.map((value) => ({ value, label: label(value) }));
}

/** Build options from records that carry an id and a display name. */
export function recordOptions<T extends { id: string }>(
  records: readonly T[] | undefined,
  toLabel: (record: T) => string,
  toDescription?: (record: T) => string | undefined,
): SelectOption[] {
  return (records ?? []).map((record) => {
    const description = toDescription?.(record);
    return {
      value: record.id,
      label: toLabel(record),
      ...(description ? { description } : {}),
    };
  });
}

export const STATUS_VALUES = ['active', 'inactive'] as const;

export const STOCK_HEALTH_VALUES = [
  'healthy',
  'low',
  'out_of_stock',
  'excess',
  'quarantined',
] as const;

export const INVENTORY_TYPE_VALUES = [
  'saleable',
  'consumable',
  'raw_material',
  'spare_part',
  'installation_component',
] as const;

export const MOVEMENT_TYPE_VALUES = [
  'opening_balance',
  'receipt',
  'issue',
  'transfer_dispatch',
  'transfer_receipt',
  'adjustment_increase',
  'adjustment_decrease',
  'count_variance',
  'reversal',
] as const;

export const TRANSFER_STATUS_VALUES = [
  'draft',
  'submitted',
  'approved',
  'dispatched',
  'received',
  'cancelled',
] as const;

export const COUNT_STATUS_VALUES = [
  'draft',
  'in_progress',
  'submitted',
  'recount_required',
  'reviewed',
  'posted',
] as const;

export const ASSET_STATUS_VALUES = [
  'available',
  'assigned',
  'on_hire',
  'in_maintenance',
  'out_of_service',
  'retired',
] as const;
