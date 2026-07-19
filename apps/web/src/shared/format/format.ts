import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';

const zar = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 0,
});

const num = new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 3 });

export function formatMoney(value: string): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? zar.format(parsed) : value;
}

export function formatQuantity(value: string, unit?: string): string {
  const parsed = Number(value);
  const text = Number.isFinite(parsed) ? num.format(parsed) : value;
  return unit ? `${text} ${unit}` : text;
}

export function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), 'd MMM yyyy');
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  try {
    return format(parseISO(iso), 'd MMM yyyy, HH:mm');
  } catch {
    return iso;
  }
}

export function formatRelative(iso: string): string {
  try {
    return `${formatDistanceToNowStrict(parseISO(iso))} ago`;
  } catch {
    return iso;
  }
}

export function todayISODate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

const LABELS: Record<string, string> = {
  // movement types
  opening_balance: 'Opening balance',
  receipt: 'Receipt',
  issue: 'Issue',
  transfer_dispatch: 'Transfer dispatch',
  transfer_receipt: 'Transfer receipt',
  adjustment_increase: 'Adjustment (+)',
  adjustment_decrease: 'Adjustment (−)',
  count_variance: 'Count variance',
  reversal: 'Reversal',
  // statuses
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  dispatched: 'Dispatched',
  received: 'Received',
  cancelled: 'Cancelled',
  in_progress: 'In progress',
  recount_required: 'Recount required',
  reviewed: 'Reviewed',
  posted: 'Posted',
  available: 'Available',
  assigned: 'Assigned',
  on_hire: 'On hire',
  in_maintenance: 'In maintenance',
  out_of_service: 'Out of service',
  retired: 'Retired',
  active: 'Active',
  inactive: 'Inactive',
  // stock health
  healthy: 'Healthy',
  low: 'Low',
  out_of_stock: 'Out of stock',
  excess: 'Excess',
  quarantined: 'Quarantined',
  // inventory types
  saleable: 'Saleable',
  consumable: 'Consumable',
  raw_material: 'Raw material',
  spare_part: 'Spare part',
  installation_component: 'Installation component',
  // ownership
  company_owned: 'Company owned',
  consignment: 'Consignment',
  client_owned: 'Client owned',
  // tracking
  quantity: 'Quantity',
  batch: 'Batch',
  serial: 'Serial',
  // site types
  head_office: 'Head office',
  warehouse: 'Warehouse',
  mine_site: 'Mine site',
  workshop: 'Workshop',
  fabrication: 'Fabrication',
  depot: 'Depot',
  // location types
  yard: 'Yard',
  cage: 'Cage',
  tank: 'Tank',
  vehicle_store: 'Vehicle store',
  bin: 'Bin',
  // asset
  plant: 'Plant',
  transport: 'Transport',
  workshop_equipment: 'Workshop equipment',
  attachment: 'Attachment',
  hours: 'Hours',
  kilometres: 'Kilometres',
  ok: 'OK',
  due_soon: 'Due soon',
  overdue: 'Overdue',
  // issue purposes
  site_consumption: 'Site consumption',
  project: 'Project',
  maintenance: 'Maintenance',
  fabrication_job: 'Fabrication job',
  cost_centre: 'Cost centre',
  // count scopes
  all_items: 'All items',
  category: 'Category',
  selected_items: 'Selected items',
};

/** Human label for an API enum value. */
export function label(value: string | null | undefined): string {
  if (value == null) return 'Not set';
  return LABELS[value] ?? value.replaceAll('_', ' ');
}
