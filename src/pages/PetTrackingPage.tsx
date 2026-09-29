import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  PawPrint,
  Heart,
  MapPin,
  Droplets,
  Shield,
  Apple,
  Thermometer,
  Stethoscope,
  Sparkles,
  FileText,
  Clock,
  Home,
  Flag,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { getRealtimeClient, getRealtimeConfigFromEnv } from '../services/realtime';
import ShipmentMap, { isValidPoint, type MapPoint } from '../components/Map';

export interface PublicPetResult {
  trackingNumber: string;
  status: string;
  petName: string;
  petType: string;
  petBreed?: string | null;
  petAge?: number | null;
  petGender?: string | null;
  weight?: number | null;
  photoUrl?: string | null;
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
  lastUpdated: string;
  timeline: { status: string; locationName: string; description?: string | null; eventTime: string; latitude?: number | null; longitude?: number | null }[];
  careEvents: { eventType: string; status: string; description?: string | null; locationName: string; eventTime: string }[];
  documents: { documentNumber: string; documentType: string; fileName: string; fileSize: number; issuedAt?: string | null }[];
}

export const NOT_FOUND_MESSAGE =
  "We couldn't find a shipment with that tracking number. Please check the number and try again.";

const CARE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Food: Apple,
  Water: Droplets,
  ComfortCheck: Heart,
  HealthCheck: Stethoscope,
  TemperatureCheck: Thermometer,
  RestPeriod: Sparkles,
  VeterinaryCheck: Shield,
};

interface CareItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  detail: string;
  time: string;
  latest?: boolean;
}

function CareEventItem({ icon: Icon, label, detail, time, latest }: CareItemProps) {
  return (
    <li className="flex gap-4">
      <div className="flex flex-col items-center" aria-hidden="true">
        <span className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-emerald-600" />
        </span>
      </div>
      <div className="pb-5 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {label}
          {latest && (
            <span className="ml-2 inline-block px-2 py-0.5 text-[11px] rounded-full bg-emerald-100 text-emerald-700 align-middle">
              Latest
            </span>
          )}
        </p>
        <p className="text-sm text-gray-600 break-words">{detail}</p>
        <p className="text-xs text-gray-400">{time}</p>
      </div>
    </li>
  );
}

function toPoint(name: string, lat?: number | null, lng?: number | null): MapPoint | null {
  const p: MapPoint = { name, lat: Number(lat), lng: Number(lng) };
  return isValidPoint(p) ? p : null;
}

export default function PetTrackingPage() {
  const [searchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [result, setResult] = useState<PublicPetResult | null>(null);
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

  const runTrack = async (tn: string) => {
    const value = tn.trim();
    if (!value) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const envelope = await apiClient.getPetTracking(value);
      const data = (envelope && envelope.result ? envelope.result : envelope) as PublicPetResult;
      if (!data || !data.trackingNumber) {
        setError(NOT_FOUND_MESSAGE);
        return;
      }
      setResult(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || NOT_FOUND_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    await runTrack(trackingNumber);
  };

  useEffect(() => {
    const tn = searchParams.get('tn');
    if (tn && tn.trim()) {
      setTrackingNumber(tn.trim());
      void runTrack(tn.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------
  // Realtime: optional live updates, scoped to this pet tracking number.
  // If Realtime is unavailable the page still works normally via REST.
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
        onPetCareEvent: () => {
          showNotice('Shipment information updated.');
        },
        onPetLocationUpdate: (update) => {
          setResult((prev) =>
            prev
              ? {
                  ...prev,
                  currentLocationName: update.locationName ?? prev.currentLocationName,
                  currentLatitude: update.latitude ?? prev.currentLatitude,
                  currentLongitude: update.longitude ?? prev.currentLongitude,
                }
              : prev
          );
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

  // Fallback while Realtime is unavailable: slow REST refresh (no spinner).
  useEffect(() => {
    const activeTrackingNumber = result?.trackingNumber;
    if (!activeTrackingNumber || liveConnected) return;
    const id = window.setInterval(() => {
      void apiClient
        .publicTrack(activeTrackingNumber)
        .then((envelope: unknown) => {
          const env = envelope as { result?: PublicPetResult };
          const data = (env?.result ?? envelope) as PublicPetResult;
          if (data && data.trackingNumber) setResult(data);
        })
        .catch(() => {
          /* background refresh failures are non-fatal */
        });
    }, 60000);
    return () => window.clearInterval(id);
  }, [result?.trackingNumber, liveConnected]);

  const latestCare = result?.careEvents && result.careEvents.length > 0 ? result.careEvents[0] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-sm text-emerald-700">
          <PawPrint className="w-4 h-4" aria-hidden="true" />
          Pet &amp; Live Animal Tracking
        </span>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Your Pet&apos;s Journey Matters</h1>
        <p className="text-gray-500 mt-2 max-w-xl mx-auto">
          Follow your companion&apos;s journey with calm, caring and transparent updates at every step.
        </p>
      </div>

      {/* Search */}
      <form
        onSubmit={handleTrack}
        className="flex flex-col sm:flex-row gap-3 mb-10 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5"
        role="search"
        aria-label="Track a pet shipment"
      >
        <label htmlFor="pet-tracking-input" className="sr-only">
          Enter pet tracking number
        </label>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
          <input
            id="pet-tracking-input"
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number (e.g. USP-PET-2026-000789)"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Tracking…' : 'Track Pet'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Subtle realtime notification (customer-safe) */}
      {notice && (
        <div
          className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm mb-4"
          role="status"
          aria-live="polite"
        >
          {notice}
        </div>
      )}

      {/* Result */}
      {result && (
        <article className="space-y-8">
          {/* Hero card - status immediately visible */}
          <section className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {result.photoUrl ? (
                <img
                  src={result.photoUrl}
                  alt={`${result.petName} the ${result.petType.toLowerCase()} travelling with ShipNex`}
                  className="w-28 h-28 rounded-2xl object-cover shadow-md"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  <PawPrint className="w-12 h-12 text-emerald-600" aria-hidden="true" />
                </div>
              )}
              <div className="text-center sm:text-left">
                <p className="text-xs uppercase tracking-wider text-emerald-600 font-semibold">Journey status</p>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">{result.petName || 'Your pet'}</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {[result.petType, result.petBreed, result.petGender].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-1.5 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" aria-hidden="true" />
                  {result.status}
                </div>
              </div>
              <div className="sm:ml-auto text-center sm:text-left">
                <p className="text-xs text-gray-500">Tracking number</p>
                <p className="font-mono text-sm font-medium text-gray-900">{result.trackingNumber}</p>
                <p className="text-xs text-gray-500 mt-2">Last updated</p>
                <p className="text-sm text-gray-700">{result.lastUpdated ? new Date(result.lastUpdated).toLocaleString() : ''}</p>
              </div>
            </div>
          </section>

          {/* Route overview */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5" aria-hidden="true" /> Origin
              </p>
              <p className="font-medium text-gray-900 mt-1">{result.origin}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Latest location
              </p>
              <p className="font-medium text-gray-900 mt-1">{result.currentLocationName}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" aria-hidden="true" /> Destination
              </p>
              <p className="font-medium text-gray-900 mt-1">{result.destination}</p>
              {result.estimatedDelivery && (
                <p className="text-xs text-emerald-600 mt-1">
                  Est. {new Date(result.estimatedDelivery).toLocaleDateString()}
                </p>
              )}
            </div>
          </section>

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
              <ShipmentMap origin={o} destination={d} current={c} route={routePts.length >= 2 ? routePts : undefined} />
            );
          })()}

          {/* Care events */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-4">Care Along the Way</h3>
            {result.careEvents && result.careEvents.length > 0 ? (
              <ul>
                {result.careEvents.map((event, i) => {
                  const Icon = CARE_ICONS[event.eventType] || Heart;
                  return (
                    <CareEventItem
                      key={`${event.eventType}-${event.eventTime}-${i}`}
                      icon={Icon}
                      label={event.eventType}
                      detail={event.description || ''}
                      time={event.eventTime ? new Date(event.eventTime).toLocaleString() : ''}
                      latest={i === 0}
                    />
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No care updates yet. Check back soon.</p>
            )}
          </section>

          {/* Journey timeline */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-4">Journey Timeline</h3>
            {result.timeline && result.timeline.length > 0 ? (
              <ol className="space-y-4">
                {result.timeline.map((event, i) => (
                  <li key={`${event.status}-${event.eventTime}-${i}`} className="flex gap-4">
                    <div className="flex flex-col items-center" aria-hidden="true">
                      <div
                        className={`w-3 h-3 rounded-full mt-1 ${
                          i === 0 ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-gray-300'
                        }`}
                      />
                      {i < result.timeline.length - 1 && <div className="w-0.5 flex-1 min-h-[24px] bg-gray-200" />}
                    </div>
                    <div className="pb-4 min-w-0">
                      <p className="font-medium text-sm text-gray-900">
                        {i === 0 && (
                          <span className="mr-2 inline-block px-2 py-0.5 text-[11px] rounded-full bg-emerald-100 text-emerald-700 align-middle">
                            Latest
                          </span>
                        )}
                        {event.status}
                      </p>
                      <p className="text-sm text-gray-600 break-words">{event.locationName}</p>
                      {event.description && <p className="text-xs text-gray-500 break-words">{event.description}</p>}
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {event.eventTime ? new Date(event.eventTime).toLocaleString() : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-500">No journey events yet. Check back soon.</p>
            )}
          </section>

          {/* Documents */}
          {result.documents && result.documents.length > 0 && (
            <section>
              <h3 className="font-semibold text-gray-900 mb-4">Documents</h3>
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                {result.documents.map((doc) => (
                  <li key={doc.documentNumber} className="flex items-center gap-3 px-4 py-3">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {doc.documentType} · {doc.documentNumber}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      )}

      {!result && !loading && !error && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <p className="text-sm text-emerald-700">
            Try tracking number: <strong>USP-PET-2026-000789</strong>
          </p>
        </div>
      )}

      {latestCare && (
        <p className="text-center text-xs text-gray-400 mt-8 flex items-center justify-center gap-1">
          <Heart className="w-3 h-3" aria-hidden="true" />
          Care events shown are provided by our trained pet operations team.
        </p>
      )}
    </div>
  );
}