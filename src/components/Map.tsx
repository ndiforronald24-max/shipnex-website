import { useEffect, useRef } from 'react';

export interface MapPoint {
  lat: number;
  lng: number;
  name: string;
}

export interface ShipmentMapProps {
  origin: MapPoint;
  destination: MapPoint;
  current?: MapPoint | null;
  route?: MapPoint[];
  apiKey?: string;
}

// Load the Google Maps script once and share the promise across instances.
let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise<void>((resolve, reject) => {
      const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
      if (existing) {
        const g = (window as unknown as { google?: { maps?: unknown } }).google;
        if (g && g.maps) {
          resolve();
        } else {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject(new Error('maps-load-failed')));
        }
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = 'https://maps.googleapis.com/maps/api/js?key=' + apiKey;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('maps-load-failed'));
      document.head.appendChild(script);
    });
  }
  return googleMapsPromise;
}

export function isValidPoint(p?: MapPoint | null): p is MapPoint {
  return !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng);
}


export default function ShipmentMap(props: ShipmentMapProps) {
  const keyFromEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_GOOGLE_MAPS_API_KEY;
  const apiKey = props.apiKey ?? keyFromEnv;
  const { origin, destination, current, route } = props;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapFailed = useRef(false);

  const hasCoords = isValidPoint(origin) && isValidPoint(destination);

  useEffect(() => {
    let cancelled = false;
    if (!mapRef.current || !apiKey || !hasCoords) return;

    const points: MapPoint[] = [origin];
    if (isValidPoint(current)) points.push(current as MapPoint);
    points.push(destination);
    const path: MapPoint[] =
      route && route.length >= 2 ? route.filter(isValidPoint) : points;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current) return;
        const w = window as any;
        const bounds = new w.google.maps.LatLngBounds();
        points.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));

        const map = new w.google.maps.Map(mapRef.current as HTMLElement, {
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        map.fitBounds(bounds, 48);

        const mk = (position: MapPoint, title: string) =>
          new w.google.maps.Marker({ position, map, title });
        mk(origin, 'Origin: ' + origin.name);
        mk(destination, 'Destination: ' + destination.name);

        let currentMarker: any = null;
        if (isValidPoint(current)) {
          const loc = current as MapPoint;
          currentMarker = new w.google.maps.Marker({
            position: loc,
            map,
            title: loc.name + ' - Latest reported location',
            icon: {
              path: w.google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: '#ff6f00',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
          });
          const info = new w.google.maps.InfoWindow();
          currentMarker.addListener('click', () => {
            info.setContent(
              '<strong>Latest reported location</strong><br/>' + loc.name +
              '<br/><small>Manually reported by staff - not continuous GPS tracking.</small>'
            );
            info.open(map, currentMarker as any);
          });
        }

        new w.google.maps.Polyline({
          path: path.map((p) => ({ lat: p.lat, lng: p.lng })),
          strokeColor: '#1a237e',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map,
        });
      })
      .catch(() => {
        mapFailed.current = true;
      });

    return () => {
      cancelled = true;
    };
  }, [origin, destination, current, route, apiKey, hasCoords]);

  return (
    <div className="relative w-full h-64 md:h-80 lg:h-96 bg-gray-100 rounded-lg overflow-hidden">
      <svg viewBox="0 0 400 220" className="absolute inset-0 w-full h-full" role="img" aria-label="Shipment route overview">
        <rect width="400" height="220" fill="#eef2f7" />
        {hasCoords && (
          <>
            <circle cx="60" cy="150" r="8" fill="#1a237e" />
            <text x="60" y="172" textAnchor="middle" fontSize="10" fill="#1a237e">Origin</text>
            <circle cx="340" cy="70" r="8" fill="#16a34a" />
            <text x="340" y="92" textAnchor="middle" fontSize="10" fill="#16a34a">Destination</text>
            <line x1="60" y1="150" x2="340" y2="70" stroke="#1a237e" strokeWidth="2" strokeDasharray="6 4" />
            {isValidPoint(current) && (
              <>
                <circle cx="200" cy="110" r="9" fill="#ff6f00" stroke="#fff" strokeWidth="2" />
                <text x="200" y="132" textAnchor="middle" fontSize="10" fill="#9a3412">Latest reported location</text>
              </>
            )}
          </>
        )}
      </svg>
      {apiKey && hasCoords ? (
        <div ref={mapRef} className="absolute inset-0 w-full h-full" />
      ) : (
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-[11px] text-gray-500 bg-white/80 rounded px-2 py-1 text-center">
            {apiKey ? 'Route overview (live map unavailable)' : 'Live map requires the VITE_GOOGLE_MAPS_API_KEY environment variable - showing route overview.'}
          </p>
        </div>
      )}
    </div>
  );
}
