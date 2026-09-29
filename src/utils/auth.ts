// Role-based access control utilities.
// Mirrors ShipNexRoles from the backend (ShipNex.Domain.Entities).
export const ROLES = {
  SuperAdmin: 'SuperAdmin',
  OperationsManager: 'OperationsManager',
  ShipmentStaff: 'ShipmentStaff',
  PetOperations: 'PetOperations',
  CustomerSupport: 'CustomerSupport',
  Finance: 'Finance',
  ReadOnly: 'ReadOnly',
  Customer: 'Customer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  role: Role;
}

const USER_KEY = 'authUser';

export function saveAuthUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearAuthUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function getRole(): Role {
  return getAuthUser()?.role ?? ROLES.Customer;
}

/** Permission matrix - mirrors backend [Authorize(Roles = ...)] attributes. */
const ALL_STAFF: Role[] = [
  ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.ShipmentStaff,
  ROLES.PetOperations, ROLES.CustomerSupport, ROLES.Finance, ROLES.ReadOnly,
];

export const permissions = {
  dashboard: ALL_STAFF,
  shipmentsView: [ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.ShipmentStaff, ROLES.CustomerSupport, ROLES.ReadOnly],
  shipmentsCreate: [ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.ShipmentStaff],
  shipmentsUpdate: [ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.ShipmentStaff],
  shipmentsDelete: [ROLES.SuperAdmin, ROLES.OperationsManager],
  customersView: [ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.CustomerSupport, ROLES.ReadOnly],
  customersManage: [ROLES.SuperAdmin, ROLES.OperationsManager],
  petsView: [ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.PetOperations, ROLES.CustomerSupport, ROLES.ReadOnly],
  petsManage: [ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.PetOperations],
  officesView: [ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.ShipmentStaff, ROLES.ReadOnly],
  officesManage: [ROLES.SuperAdmin, ROLES.OperationsManager],
  vehiclesView: [ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.ShipmentStaff, ROLES.ReadOnly],
  vehiclesManage: [ROLES.SuperAdmin, ROLES.OperationsManager],
  staffView: [ROLES.SuperAdmin, ROLES.OperationsManager],
  staffManage: [ROLES.SuperAdmin],
  notificationsView: ALL_STAFF,
  notificationsManage: [ROLES.SuperAdmin, ROLES.OperationsManager],
  documentsView: [ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.ShipmentStaff, ROLES.PetOperations, ROLES.CustomerSupport, ROLES.ReadOnly],
  documentsManage: [ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.ShipmentStaff, ROLES.PetOperations],
  reportsView: [ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.Finance, ROLES.ReadOnly],
  settingsView: [ROLES.SuperAdmin],
  auditLogsView: [ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.ReadOnly],
} as const;

export type Permission = keyof typeof permissions;

/** Frontend check only — the backend enforces authorization on every request. */
export function can(permission: Permission, role: Role = getRole()): boolean {
  return (permissions[permission] as readonly Role[]).includes(role);
}

export const STATUS_LABELS: Record<string, string> = {
  ShipmentCreated: 'Shipment Created',
  PickedUp: 'Picked Up',
  AtOriginFacility: 'At Origin Facility',
  ExportCustoms: 'Export Customs',
  DepartedOrigin: 'Departed Origin',
  InTransit: 'In Transit',
  ArrivedAtDestination: 'Arrived at Destination',
  ImportCustoms: 'Import Customs',
  AtDestinationFacility: 'At Destination Facility',
  OutForDelivery: 'Out for Delivery',
  Delivered: 'Delivered',
  Delayed: 'Delayed',
  Exception: 'Exception',
  Cancelled: 'Cancelled',
};

export const ALL_STATUSES = Object.keys(STATUS_LABELS);

export function statusLabel(status?: string): string {
  return STATUS_LABELS[status ?? ''] ?? (status || '—');
}

const BADGE_CLASSES: Record<string, string> = {
  Delivered: 'bg-green-100 text-green-700',
  InTransit: 'bg-blue-100 text-blue-700',
  OutForDelivery: 'bg-amber-100 text-amber-700',
  Delayed: 'bg-red-100 text-red-700',
  Exception: 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-200 text-gray-600',
};

export function statusBadgeClass(status?: string): string {
  return BADGE_CLASSES[status ?? ''] ?? 'bg-gray-100 text-gray-700';
}
