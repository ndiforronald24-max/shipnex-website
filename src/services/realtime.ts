// Supabase Realtime client for customer-safe shipment tracking updates.
//
// Security model:
// - Subscribes only to a channel scoped to a single tracking number, so one
//   customer can never receive another customer's shipment events.
// - Only customer-safe event names are handled ('tracking_event',
//   'shipment_update', 'pet_care_event', 'pet_location_update'). Anything else
//   is ignored. The backend only ever publishes the public DTOs, so no private
//   records, internal notes, audit logs or other customers' data reach a client.
// - Uses the public anon key only. The service-role key never reaches browsers.
// - Graceful fallback: when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not
//   configured, or Realtime is unreachable, this is a no-op and tracking keeps
//   working through the normal REST endpoints and page refresh.

import {
  createClient,
  REALTIME_SUBSCRIBE_STATES,
  type RealtimeChannel,
  type SupabaseClient,
} from '@supabase/supabase-js'
import type {
  PublicTrackingEventResponse,
  PublicShipmentTrackingResponse,
  PublicPetCareEventResponse,
  PublicPetLocationUpdate,
} from '../types'

export interface RealtimeConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  /**
   * Join private channels (requires Realtime Authorization RLS policies on
   * realtime.messages). Defaults to public broadcast channels.
   */
  usePrivateChannels?: boolean
}

export interface RealtimeListeners {
  onTrackingEvent?: (evt: PublicTrackingEventResponse) => void
  onShipmentUpdate?: (update: PublicShipmentTrackingResponse) => void
  onPetCareEvent?: (evt: PublicPetCareEventResponse) => void
  onPetLocationUpdate?: (update: PublicPetLocationUpdate) => void
  onError?: (err: Error) => void
}

/** Customer-safe event names the backend is allowed to publish. */
export const REALTIME_EVENTS = {
  trackingEvent: 'tracking_event',
  shipmentUpdate: 'shipment_update',
  petCareEvent: 'pet_care_event',
  petLocationUpdate: 'pet_location_update',
} as const

/** Build a config from Vite env vars. Empty values disable realtime. */
export function getRealtimeConfigFromEnv(): RealtimeConfig {
  const env = import.meta.env as unknown as Record<string, string | undefined>
  return {
    supabaseUrl: env.VITE_SUPABASE_URL ?? '',
    supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY ?? '',
    usePrivateChannels: env.VITE_SUPABASE_REALTIME_PRIVATE === 'true',
  }
}

export class ShipmentRealtimeClient {
  readonly config: RealtimeConfig
  private readonly client: SupabaseClient | null
  private channel: RealtimeChannel | null = null
  private listeners: RealtimeListeners | null = null
  private errorHandler: ((err: Error) => void) | null = null
  private isConnected = false

  constructor(config: RealtimeConfig) {
    this.config = config
    this.client =
      config.supabaseUrl && config.supabaseAnonKey
        ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
            auth: { persistSession: false },
            realtime: { params: { eventsPerSecond: 10 } },
          })
        : null
  }

  /** True when Realtime is configured and the channel is joined. */
  get connected(): boolean {
    return this.isConnected
  }

  /**
   * Subscribe to realtime updates for a single tracking number.
   * Safe to call repeatedly; any previous subscription is replaced.
   */
  subscribe(trackingNumber: string, listeners: RealtimeListeners, onReady?: () => void): void {
    this.unsubscribe()
    this.listeners = listeners
    this.errorHandler = listeners.onError ?? null

    const tn = trackingNumber.trim().toUpperCase()
    if (!tn || !this.client) {
      // Realtime not configured/unavailable — tracking still works via REST.
      return
    }

    try {
      const channel = this.client.channel(`tracking:${tn}`, {
        config: this.config.usePrivateChannels ? { private: true } : {},
      })

      channel
        .on('broadcast', { event: '*' }, (message: unknown) => this.handleBroadcast(message))
        .subscribe((status) => {
          if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
            this.isConnected = true
            onReady?.()
          } else if (
            status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
            status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT
          ) {
            this.isConnected = false
            this.errorHandler?.(new Error(`Supabase Realtime channel ${status}`))
          } else {
            this.isConnected = false
          }
        })

      this.channel = channel
    } catch (err) {
      this.isConnected = false
      this.errorHandler?.(err instanceof Error ? err : new Error(String(err)))
    }
  }

  private handleBroadcast(message: unknown): void {
    const listeners = this.listeners
    if (!listeners) return

    // Supabase broadcast callback shape:
    //   { type: 'broadcast', event: '<event name>', payload: <customer-safe DTO> }
    const msg = message as { event?: string; payload?: unknown } | null
    const eventName = msg?.event
    const data = msg?.payload
    if (!eventName || data == null) return

    try {
      switch (eventName) {
        case REALTIME_EVENTS.trackingEvent:
          listeners.onTrackingEvent?.(data as PublicTrackingEventResponse)
          break
        case REALTIME_EVENTS.shipmentUpdate:
          listeners.onShipmentUpdate?.(data as PublicShipmentTrackingResponse)
          break
        case REALTIME_EVENTS.petCareEvent:
          listeners.onPetCareEvent?.(data as PublicPetCareEventResponse)
          break
        case REALTIME_EVENTS.petLocationUpdate:
          listeners.onPetLocationUpdate?.(data as PublicPetLocationUpdate)
          break
        default:
          // Unknown event names are ignored. The backend only ever publishes
          // customer-safe DTOs, so nothing private can leak through here.
          break
      }
    } catch (err) {
      console.warn('[ShipNex Realtime] Failed to process broadcast message:', err)
    }
  }

  /** Unsubscribe from the current channel. Safe to call multiple times. */
  unsubscribe(): void {
    this.isConnected = false
    this.listeners = null
    this.errorHandler = null

    const channel = this.channel
    this.channel = null
    if (channel && this.client) {
      try {
        void this.client.removeChannel(channel)
      } catch {
        /* ignore — the channel is already torn down */
      }
    }
  }
}

/** Singleton-ish helper: creates a client once per config and reuses it. */
let globalClient: ShipmentRealtimeClient | null = null

export function getRealtimeClient(config: RealtimeConfig): ShipmentRealtimeClient {
  if (
    !globalClient ||
    globalClient.config.supabaseUrl !== config.supabaseUrl ||
    globalClient.config.supabaseAnonKey !== config.supabaseAnonKey ||
    globalClient.config.usePrivateChannels !== config.usePrivateChannels
  ) {
    globalClient = new ShipmentRealtimeClient(config)
  }
  return globalClient
}
