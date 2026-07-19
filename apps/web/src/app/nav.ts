import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Boxes,
  ClipboardCheck,
  FileClock,
  Gauge,
  MapPin,
  PackagePlus,
  PackageMinus,
  Scale,
  Settings2,
  Tags,
  Truck,
} from 'lucide-react';
import { P } from '@/shared/auth/permissions';

export interface NavItem {
  label: string;
  to: string;
  icon: typeof Gauge;
  permission?: string;
  children?: Array<{ label: string; to: string; permission?: string }>;
}

export const NAV_SECTIONS: Array<{ heading: string | null; items: NavItem[] }> = [
  {
    heading: null,
    items: [{ label: 'Dashboard', to: '/dashboard', icon: Gauge }],
  },
  {
    heading: 'Inventory',
    items: [
      { label: 'Items', to: '/inventory/items', icon: Tags, permission: P.inventoryView },
      { label: 'Balances', to: '/inventory/balances', icon: Boxes, permission: P.inventoryView },
      { label: 'Movements', to: '/inventory/movements', icon: FileClock, permission: P.inventoryView },
      { label: 'Receive', to: '/inventory/receive', icon: PackagePlus, permission: P.inventoryReceive },
      { label: 'Issue', to: '/inventory/issue', icon: PackageMinus, permission: P.inventoryIssue },
      { label: 'Adjust', to: '/inventory/adjust', icon: Scale, permission: P.inventoryAdjust },
      { label: 'Stock counts', to: '/inventory/counts', icon: ClipboardCheck, permission: P.inventoryView },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Transfers', to: '/transfers', icon: ArrowLeftRight, permission: P.inventoryView },
      { label: 'Assets', to: '/assets', icon: Truck, permission: P.assetView },
      { label: 'Sites', to: '/sites', icon: MapPin, permission: P.inventoryView },
    ],
  },
  {
    heading: 'Insight',
    items: [
      { label: 'Reports', to: '/reports', icon: BarChart3, permission: P.reportView },
      { label: 'Audit log', to: '/audit', icon: Bell, permission: P.auditView },
    ],
  },
  {
    heading: 'Administration',
    items: [{ label: 'Administration', to: '/admin/users', icon: Settings2, permission: P.userManage }],
  },
];

export interface QuickAction {
  label: string;
  to: string;
  permission: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Receive stock', to: '/inventory/receive', permission: P.inventoryReceive },
  { label: 'Issue stock', to: '/inventory/issue', permission: P.inventoryIssue },
  { label: 'Adjust stock', to: '/inventory/adjust', permission: P.inventoryAdjust },
  { label: 'New transfer', to: '/transfers/new', permission: P.transferCreate },
  { label: 'New stock count', to: '/inventory/counts?new=1', permission: P.countCreate },
];
