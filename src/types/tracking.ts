// src/types/tracking.ts
// Types for the multimodal shipment tracking system.

export interface TrackingResponse {
  trackingNumber: string;
  status: string;
  origin: LocationPoint;
  destination: LocationPoint;
  currentLocation?: LocationPoint;
  estimatedDelivery?: string;
  shipmentType: string;
  serviceType: string;
  weight: number;
  pieces: number;
  referenceNumber?: string;
  lastUpdated?: string;
  events: TrackingEvent[];
  route?: RouteNode[];
}

export interface LocationPoint {
  name: string;
  lat: number;
  lng: number;
}

export interface TrackingEvent {
  id: string;
  timestamp: string; // ISO-8601
  status: string;
  location: string;
  description: string;
  coordinates?: LocationPoint;
  message: string;
}

export interface RouteNode {
  id: string;
  location: LocationPoint;
  label: string;
  status?: string;
  timestamp?: string;
}

export interface RouteEdge {
  id: string;
  from: string;
  to: string;
  status?: string;
  distance?: number;
}

export interface GeoMapState {
  center: { lat: number; lng: number };
  zoom: number;
  bearing: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  category: 'status' | 'eta' | 'shipment-details' | 'logistics-info';
  timestamp: string;
}

export type ChatPanelOpen = 'status' | 'eta' | 'shipment-details' | 'logistics-info' | null;

export interface TrackingState {
  shipment: TrackingResponse | null;
  liveEvents: TrackingEvent[];
  timeline: TrackingEvent[];
  routeGraph: {
    nodes: RouteNode[];
    edges: RouteEdge[];
  };
  aiMessages: ChatMessage[];
  chatPanelOpen: ChatPanelOpen;
  navHistory: string[];
  currentNavIndex: number;
  viewport: GeoMapState;
  activePanel: 'map' | 'route' | 'timeline' | 'chat';
  isLoading: boolean;
  errorMessage: string | null;
  timezone: string;
}

export interface CompressedPayload {
  compressed: boolean;
  data: string;
  algo?: string;
}

// src/types/tracking.ts
// Types for the multimodal shipment tracking system.

export interface TrackingResponse {
  trackingNumber: string;
  status: string;
  origin: LocationPoint;
  destination: LocationPoint;
  currentLocation?: LocationPoint;
  estimatedDelivery?: string;
  shipmentType: string;
  serviceType: string;
  weight: number;
  pieces: number;
  referenceNumber?: string;
  lastUpdated?: string;
  events: TrackingEvent[];
  route?: RouteNode[];
}

export interface LocationPoint {
  name: string;
  lat: number;
  lng: number;
}

export interface TrackingEvent {
  id: string;
  timestamp: string; // ISO-8601
  status: string;
  location: string;
  description: string;
  coordinates?: LocationPoint;
  message: string; // for AI categorization
}

export interface RouteNode {
  id: string;
  location: LocationPoint;
  label: string;
  status?: string;
  timestamp?: string;
}

export interface RouteEdge {
  id: string;
  from: string;
  to: string;
  status?: string;
  distance?: number;
}

export interface GeoMapState {
  center: { lat: number; lng: number };
  zoom: number;
  bearing: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  category: 'status' | 'eta' | 'shipment-details' | 'logistics-info';
  timestamp: string;
}

export interface TrackingStoreState {
  shipment: TrackingResponse | null;
  liveEvents: TrackingEvent[];
  timeline: TrackingEvent[];
  routeGraph: {
    nodes: RouteNode[];
    edges: RouteEdge[];
  };
  aiMessages: ChatMessage[];
  chatPanelOpen: ChatPanelOpen;
  navHistory: string[];
  currentNavIndex: number;
  viewport: GeoMapState;
  activePanel: 'map' | 'route' | 'timeline' | 'chat';
  isLoading: boolean;
  errorMessage: string | null;
  timezone: string;
}

export interface CompressedPayload {
  compressed: boolean;
  data: string;
  algo?: string;
}



export interface CompressedTimelinePayload {
  compressed: boolean;
  data: string;
  algo?: string;
}

export interface CacheEntry<T> {
  value: T;
  kind: string;
  cachedAt: number;
  expiresAt: number;
  staleAt: number;
  version: number;
  trackingNumber: string;
  scope: string;
}

export type AiCategory = 'status' | 'eta' | 'shipment-details' | 'logistics-info';
