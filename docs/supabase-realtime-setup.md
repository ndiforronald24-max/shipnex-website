# Supabase Realtime — Live Shipment Tracking

Optional, best-effort live updates for the public tracking pages. ShipNex
**never depends** on Realtime: if it is not configured or unreachable, tracking
continues to work through the normal REST endpoints (plus a slow background
refresh on the tracking pages).

---

## 1. Architecture

```
Staff action (add tracking event / update status / pet care / pet location)
        │
        ▼
ShipmentService / PetShipmentService
   └─ ISupabaseRealtimeService  (ShipNex.Infrastructure)
        │  POST /realtime/v1/api/broadcast
        │  { "messages": [ { topic, event, payload, private } ] }
        ▼
Supabase Realtime  ──broadcast──▶  Browser
                                   └─ src/services/realtime.ts
                                      (ShipmentRealtimeClient)
                                         │
                                         ▼
                              TrackingPage / PetTrackingPage
```

| Layer | File |
| --- | --- |
| Publisher interface | `backend/src/ShipNex.Application/Interfaces/ISupabaseRealtimeService.cs` |
| Publisher implementation | `backend/src/ShipNex.Infrastructure/Services/SupabaseRealtimeService.cs` |
| DI registration | `backend/src/ShipNex.Api/Program.cs` |
| Frontend subscriber | `src/services/realtime.ts` |
| Subscribers (UI) | `src/pages/TrackingPage.tsx`, `src/pages/PetTrackingPage.tsx` |

---

## 2. Configuration

### Backend (`backend/src/ShipNex.Api/appsettings.json`)

```json
"Realtime": {
  "SupabaseUrl": "https://<project>.supabase.co",
  "SupabaseAnonKey": "<anon / publishable key>"
}
```

Environment-variable overrides (preferred in deployment):

```
Realtime__SupabaseUrl=https://<project>.supabase.co
Realtime__SupabaseAnonKey=<anon / publishable key>
```

If either value is empty the publisher logs a warning once at startup and
becomes a no-op (`_enabled == false`). Nothing else changes.

### Frontend (`.env`)

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon / publishable key>
VITE_SUPABASE_REALTIME_PRIVATE=false
```

`VITE_SUPABASE_REALTIME_PRIVATE=true` makes the client join **private** channels
and requires the Realtime Authorization policies in section 5.

---

## 3. Channel & payload contract

**Channel:** one channel per tracking number — `tracking:<TRACKING_NUMBER>`
(upper-cased, e.g. `tracking:USP-2026-458921`). The REST broadcast topic is
`realtime:tracking:<TRACKING_NUMBER>`.

Because a channel is scoped to a single tracking number, a customer only ever
receives events for the shipment they are looking at. There is no shared or
global channel.

| Event name | Payload DTO | Published by |
| --- | --- | --- |
| `tracking_event` | `PublicTrackingEventResponse` | `ShipmentService.AddTrackingEventAsync`, `UpdateStatusAsync` |
| `shipment_update` | `PublicShipmentTrackingResponse` | `ShipmentService` (full customer-safe snapshot) |
| `pet_care_event` | `PublicPetCareEventResponse` | `PetShipmentService.AddCareEventAsync`, `UpdateStatusAsync` |
| `pet_location_update` | `{ locationName, latitude, longitude, eventTime }` | `PetShipmentService.UpdateLocationAsync` |

Any other event name is ignored by the client (`src/services/realtime.ts`,
`handleBroadcast`).

---

## 4. Security model

1. **Customer-safe payloads only.** The publisher only ever serializes the
   public DTOs from `PublicTrackingDTOs.cs`. Internal notes, audit logs, staff
   details, sender/receiver names, addresses and phone numbers are never part of
   those records, so they cannot leak through Realtime.
2. **Documents are filtered.** Only documents with `!IsDeleted && IsVerified &&
   CustomerVisible` appear in the broadcast snapshot (same rule as the REST
   endpoint). Private veterinary / health records stay hidden.
3. **Pet care events are filtered.** Only `CustomerVisible == true` care events
   are broadcast from `AddCareEventAsync`.
4. **Per-tracking-number channels.** `tracking:<TRACKNUM>` scoping means one
   customer cannot subscribe to and receive another customer's shipment events.
5. **Frontend key is public.** The browser uses the anon / publishable key only.
   The service-role key (`SUPABASE_SERVICE_KEY`) is server-only and is used for
   Storage, never for Realtime in the browser.
6. **Failure is contained.** Every publish is wrapped: the publisher logs a
   warning, the calling service swallows the error, and the shipment operation
   still succeeds.

---

## 5. Optional: Realtime Authorization (private channels)

Public broadcast channels need no policies. To restrict who may subscribe to a
`tracking:*` topic, enable Realtime Authorization on the `realtime.messages`
table and set `VITE_SUPABASE_REALTIME_PRIVATE=true`.

```sql
-- Turn on RLS for Realtime Authorization
alter table realtime.messages enable row level security;

-- Customers (anon/authenticated) may only READ/SUBSCRIBE to shipment topics.
create policy "shipnex_tracking_read"
on realtime.messages
for select
to anon, authenticated
using (
  realtime.messages.extension = 'broadcast'
  and realtime.topic() like 'tracking:%'
);

-- Only the backend (service role) may WRITE broadcast messages.
create policy "shipnex_tracking_write"
on realtime.messages
for insert
to service_role
with check (
  realtime.messages.extension = 'broadcast'
  and realtime.topic() like 'tracking:%'
);
```

> The backend currently publishes with the anon key (see
> `SupabaseRealtimeService`) so that the REST broadcast works out of the box.
> If you enable the write policy above, set `Realtime:SupabaseAnonKey` to the
> service-role key server-side, or grant `insert` to `anon` for the same topic
> pattern. Never expose that key to the frontend.

---

## 6. Graceful degradation

| Situation | Behaviour |
| --- | --- |
| `Realtime:*` not configured | Publisher no-ops with a startup warning; tracking works via REST |
| `VITE_SUPABASE_URL` blank | Client `subscribe()` returns immediately; no live badge |
| Channel error / timeout | `onError` fires, `isConnected` goes false, page keeps working |
| Realtime connected | Header shows "Live updates on"; updates apply instantly with a "Shipment information updated." notice |
| Realtime not connected | Tracking pages poll the REST endpoint every 60s silently (no spinner flash) |

---

## 7. Verification checklist

1. Set the four env values above and restart the API and dev server.
2. Open `/track?tn=<TRACKING_NUMBER>` and confirm the green **Live updates on**
   badge appears under "Last updated".
3. In the admin UI add a tracking event / change the status for that shipment.
4. The tracking page should update without a refresh and show
   **"Shipment information updated."**
5. Open a *different* tracking number in a second tab — it must **not** receive
   the first shipment's update (channel isolation).
6. Repeat on `/pet-track?tn=USP-PET-...` for care events and location updates.
7. Clear `VITE_SUPABASE_URL`, reload, and confirm tracking still works (no live
   badge, REST polling only).
8. Confirm the browser network tab shows only the anon key — never the
   service-role key.