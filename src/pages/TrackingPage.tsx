import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, MapPin, FileText } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { getRealtimeClient, getRealtimeConfigFromEnv } from '../services/realtime';
import type { PublicShipmentTrackingResponse } from '../types';
import ShipmentMap, { isValidPoint, type MapPoint } from '../components/Map';

export interface PublicTimelineEvent {
  status: string;
  locationName: string;
  description?: string | null;
  eventTime: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PublicShipmentResult {
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
  timeline: PublicTimelineEvent[];
  documents: { documentNumber: string; documentType: string; fileName: string; fileSize: number; issuedAt?: string | null }[];
}

export const NOT_FOUND_MESSAGE =
  "We couldn't find a shipment with that tracking number. Please check the number and try again.";

function toPoint(name: string, lat?: number | null, lng?: number | null): MapPoint | null {
  const p: MapPoint = { name, lat: Number(lat), lng: Number(lng) };
  return isValidPoint(p) ? p : null;
}

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [result, setResult] = useState<PublicShipmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [liveConnected, setLiveConnected] = useState(false);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => {
      setNotice((current) => (current === message ? '' : current));
    }, 5000);
  }, []);

  const runTrack = useCallback(async (tn: string, options?: { silent?: boolean }) => {
    const value = tn.trim();
    if (!value) return;
    const silent = options?.silent === true;
    if (!silent) {
      setLoading(true);
      setError('');
      setResult(null);
    }
    try {
      const envelope = await apiClient.publicTrack(value);
      if (envelope && envelope.type && envelope.type !== 'shipment') {
        if (!silent) setError(NOT_FOUND_MESSAGE);
        return;
      }
      const data = (envelope && envelope.result ? envelope.result : envelope) as PublicShipmentResult;
      if (!data || !data.trackingNumber) {
        if (!silent) setError(NOT_FOUND_MESSAGE);
        return;
      }
      setResult(data);
    } catch (err: unknown) {
      if (silent) return;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || NOT_FOUND_MESSAGE);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    await runTrack(trackingNumber);
  };

  // Deep link from the homepage widget: /track?tn=USP-2026-458921
  useEffect(() => {
    const tn = searchParams.get('tn');
    if (tn && tn.trim()) {
      setTrackingNumber(tn.trim());
      void runTrack(tn.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------
  // Realtime: optional live updates, scoped to this tracking number only.
  // If Realtime is not configured or fails, the page still works via REST.
  // ---------------------------------------------------------------
  useEffect(() => {
    const activeTrackingNumber = result?.trackingNumber;
    const client = getRealtimeClient(getRealtimeConfigFromEnv());

    if (!activeTrackingNumber) {
      client.unsubscribe();
      setLiveConnected(false);
      return;
    }

    client.subscribe(
      activeTrackingNumber,
      {
        // Full customer-safe snapshot for this tracking number.
        onShipmentUpdate: (update: PublicShipmentTrackingResponse) => {
          setResult((prev) => (prev ? { ...prev, ...update } : prev));
          showNotice('Shipment information updated.');
        },
        // A genuinely new tracking event arrived for this shipment.
        onTrackingEvent: () => {
          showNotice('Shipment information updated.');
        },
      },
      () => setLiveConnected(true)
    );

    return () => {
      client.unsubscribe();
      setLiveConnected(false);
    };
  }, [result?.trackingNumber, showNotice]);

  // Fallback: while Realtime is unavailable, keep the page fresh with a slow
  // REST poll so tracking keeps working without a manual refresh.
  useEffect(() => {
    const activeTrackingNumber = result?.trackingNumber;
    if (!activeTrackingNumber || liveConnected) return;
    const id = window.setInterval(() => {
      void runTrack(activeTrackingNumber, { silent: true });
    }, 60000);
    return () => window.clearInterval(id);
  }, [result?.trackingNumber, liveConnected, runTrack]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Track Your Shipment</h1>

      {/* Search Form */}
      <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 mb-8" role="search" aria-label="Track your shipment">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
          <label htmlFor="tracking-number" className="sr-only">Enter tracking number</label>
          <input
            id="tracking-number"
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number (e.g., USP-2026-458921)"
            autoComplete="off"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6f00] focus:border-transparent outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-[#ff6f00] text-white rounded-lg font-medium hover:bg-[#e65100] transition-colors disabled:opacity-50"
        >
          {loading ? 'Tracking...' : 'Track Shipment'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
          {error}
        </div>
      )}

      {/* Subtle realtime notification (customer-safe) */}
      {notice && (
        <div
          className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 text-sm"
          role="status"
          aria-live="polite"
        >
          {notice}
        </div>
      )}

      {/* Results */}
      {result && (
      <article className="bg-white rounded-xl shadow-lg p-4 sm:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-6 border-b">
          <div>
            <p className="text-sm text-gray-500">Tracking Number</p>
            <p className="font-bold text-lg break-all">{result.trackingNumber}</p>
            <p className="text-xs text-gray-400 mt-1">
              Last updated: {result.lastUpdated ? new Date(result.lastUpdated).toLocaleString() : '—'}
            </p>
            {liveConnected && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
                Live updates on
              </p>
            )}
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              result.status === 'Delivered' ? 'bg-green-100 text-green-700' :
              result.status === 'In Transit' || result.status === 'ArrivedAtDestination' || result.status === 'OutForDelivery'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
>
              {result.status}
            </div>
          </div>

          {/* Route */}
          <div className="flex items-center gap-2 sm:gap-4 mb-6">
            <div className="text-center flex-shrink-0 max-w-[35%]">
              <MapPin className="w-5 h-5 text-[#ff6f00] mx-auto" aria-hidden="true" />
              <p className="text-sm font-medium mt-1 break-words">{result.origin}</p>
              <p className="text-xs text-gray-500">Origin</p>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 relative min-w-[40px]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                <Package className="w-5 h-5 text-[#1a237e]" aria-hidden="true" />
              </div>
            </div>
            <div className="text-center flex-shrink-0 max-w-[35%]">
              <MapPin className="w-5 h-5 text-green-500 mx-auto" aria-hidden="true" />
              <p className="text-sm font-medium mt-1 break-words">{result.destination}</p>
              <p className="text-xs text-gray-500">Destination</p>
            </div>
          </div>

          {/* Shipment overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Service</p>
              <p className="font-medium text-sm">{result.serviceType || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Shipment type</p>
              <p className="font-medium text-sm">{result.shipmentType || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Weight / Pieces</p>
              <p className="font-medium text-sm">{result.weight} kg · {result.numberOfPieces}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Reference</p>
              <p className="font-medium text-sm break-all">{result.referenceNumber || '—'}</p>
            </div>
          </div>

          {/* Current Location */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">Current location</p>
            <p className="font-medium">{result.currentLocationName}</p>
            <p className="text-xs text-gray-400 mt-1">Latest reported location (manually reported by staff — not continuous GPS tracking).</p>
            {result.estimatedDelivery && (
              <p className="text-sm text-gray-500 mt-1">
                Estimated Delivery: {new Date(result.estimatedDelivery).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Map */}
          {(() => {
            const o = toPoint(result.origin, result.originLatitude, result.originLongitude);
            const d = toPoint(result.destination, result.destinationLatitude, result.destinationLongitude);
            const c = toPoint(result.currentLocationName, result.currentLatitude, result.currentLongitude);
            if (!o || !d) return null;
            const routePts = (result.timeline || [])
              .filter((e) => Number.isFinite(Number(e.latitude)) && Number.isFinite(Number(e.longitude)))
              .slice()
              .reverse()
              .map((e) => ({ name: e.locationName, lat: Number(e.latitude), lng: Number(e.longitude) }));
            return (
              <div className="mb-6">
                <ShipmentMap origin={o} destination={d} current={c} route={routePts.length >= 2 ? routePts : undefined} />
              </div>
            );
          })()}

          {/* Timeline */}
          <h3 className="font-semibold mb-4">Tracking Timeline</h3>
          {result.timeline && result.timeline.length > 0 ? (
          <ol className="space-y-4">
            {result.timeline.map((event, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex flex-col items-center" aria-hidden="true">
                  <div className={`w-3 h-3 rounded-full mt-1 ${i === 0 ? 'bg-[#ff6f00] ring-4 ring-orange-100' : 'bg-gray-300'}`} />
                  {i < result.timeline.length - 1 && <div className="w-0.5 flex-1 min-h-[24px] bg-gray-200" />}
                </div>
                <div className="pb-4 min-w-0">
                  <p className="font-medium text-sm">
                    {i === 0 && <span className="mr-2 inline-block px-2 py-0.5 text-[11px] rounded-full bg-orange-100 text-orange-700 align-middle">Latest</span>}
                    {event.status}
                  </p>
                  <p className="text-sm text-gray-700 break-words">{event.locationName}</p>
                  {event.description && <p className="text-xs text-gray-500 break-words">{event.description}</p>}
                  <p className="text-xs text-gray-400">
                    {event.eventTime ? new Date(event.eventTime).toLocaleString() : ''}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          ) : (
            <p className="text-sm text-gray-500">No tracking events yet. Check back soon.</p>
          )}

          {/* Customer-visible documents (verified only) */}
          {result.documents && result.documents.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Documents</h3>
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                {result.documents.map((doc) => (
                  <li key={doc.documentNumber} className="flex items-center gap-3 px-4 py-3">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.fileName}</p>
                      <p className="text-xs text-gray-500">{doc.documentType} · {doc.documentNumber}</p>
                    </div>
                  </li>
                ))}
              </ul>
          </div>
        )}
      </article>
      )}

      {/* Sample Tracking */}
      {!result && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-700">
            Try tracking number: <strong>USP-2026-458921</strong>
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Try tracking number: <strong>USP-PET-2026-000789</strong>
          </p>
        </div>
      )}
    </div>
  );
}
