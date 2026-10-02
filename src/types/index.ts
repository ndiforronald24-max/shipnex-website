/**
 * Shared TypeScript types for the ShipNexaro frontend.
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  companyName: string;
  taxId: string;
  isActive: boolean;
}

export interface ShipmentResponse {
  id: string;
  trackingNumber: string;
  senderName: string;
  senderAddress: string;
  receiverName: string;
  receiverAddress: string;
  origin: string;
  destination: string;
  status: string;
  serviceType: string;
  weight: number;
  numberOfPieces: string;
  referenceNumber: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  createdAt: string;
  events: TrackingEventResponse[];
}

export interface TrackingEventResponse {
  id: string;
  location: string;
  description: string;
  status: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
}

export interface PetShipmentResponse {
  id: string;
  trackingNumber: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  petName: string;
  petType: string;
  petBreed: string;
  petAge?: number | null;
  petGender?: string | null;
  weight?: number | null;
  microchipId?: string | null;
  photoUrl?: string | null;
  origin: string;
  destination: string;
  originLatitude?: number | null;
  originLongitude?: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  journeyStatus: string;
  currentLocation?: string;
  vaccinationVerified: boolean;
  healthCertificate: boolean;
  specialInstructions?: string | null;
  customerVisibleInformation?: string | null;
  carrierName?: string | null;
  createdAt: string;
  estimatedDelivery?: string;
  careEvents: PetCareEventResponse[];
  documents: PetDocumentResponse[];
}

export interface PetCareEventResponse {
  id: string;
  locationName: string;
  description: string;
  eventType: string;
  careStatus: string;
  eventTime: string;
  customerVisible: boolean;
}

export interface PetDocumentResponse {
  id: string;
  documentNumber: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  fileSize: number;
  description?: string | null;
  issuedAt?: string | null;
  createdAt: string;
  isVerified: boolean;
  customerVisible: boolean;
}

export interface OfficeResponse {
  id: string;
  name: string;
  code: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  region?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  openingHours?: string;
  managerName?: string;
  managerPhone?: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOfficeRequest {
  name: string;
  code: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  region?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  openingHours?: string;
  managerName?: string;
  managerPhone?: string;
  type?: string;
}

export interface UpdateOfficeRequest {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  region?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  openingHours?: string;
  managerName?: string;
  managerPhone?: string;
  type?: string;
  isActive?: boolean;
}

export const OFFICE_REGIONS = [
  "Africa",
  "Europe",
  "Asia",
  "North America",
  "South America",
  "Middle East",
  "Oceania"
] as const;

export type OfficeRegion = typeof OFFICE_REGIONS[number];

export interface AdminStats {
  totalShipments: number;
  activeShipments: number;
  deliveredShipments: number;
  petShipments: number;
  customers: number;
  offices: number;
  vehicles: number;
  unreadNotifications: number;
}

export interface AuthResponse {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface ShipmentFilter {
  trackingNumber?: string;
  customerId?: string;
  status?: string;
  origin?: string;
  destination?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
/* ---------------------------------------------------------------------------
 * Public (customer-safe) tracking types.
 * Mirror the backend DTOs in PublicTrackingDTOs.cs and contain no private
 * fields (no addresses, phones, internal notes, audit data or private docs).
 * These are also the payload shapes broadcast over Supabase Realtime.
 * ------------------------------------------------------------------------- */

export interface PublicTrackingEventResponse {
  status: string;
  locationName: string;
  description?: string | null;
  eventTime: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PublicTrackingDocumentResponse {
  documentNumber: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  issuedAt?: string | null;
}

export interface PublicShipmentTrackingResponse {
  trackingNumber: string;
  status: string;
  origin: string;
  originLatitude?: number | null;
  originLongitude?: number | null;
  destination: string;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  currentLocationName: string;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  estimatedDelivery?: string | null;
  shipmentType: string;
  serviceType: string;
  weight: number;
  numberOfPieces: number;
  referenceNumber?: string | null;
  lastUpdated: string;
  timeline: PublicTrackingEventResponse[];
  documents: PublicTrackingDocumentResponse[];
}

export interface PublicPetCareEventResponse {
  eventType: string;
  status: string;
  description?: string | null;
  locationName: string;
  eventTime: string;
}

export interface PublicPetLocationUpdate {
  locationName: string;
  latitude?: number | null;
  longitude?: number | null;
  eventTime: string;
}
