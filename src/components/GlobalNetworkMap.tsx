/**
 * GlobalNetworkMap — self-contained SVG world map for the home page.
 *
 * Renders a stylised equirectangular world map with ShipNex hub cities and
 * animated air / ground lanes. It deliberately avoids any external map
 * service (no API key, no network call, works offline) and reuses the
 * hand-traced coastline outlines in `./worldGeometry`.
 */

import { useId, useMemo, useState } from 'react';
import { WORLD_OUTLINES, type LngLat } from './worldGeometry';

// ---------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------

const VIEW_W = 1000;
const VIEW_H = 500;
/** Trim Antarctica and trim the empty ocean above the Arctic circle. */
const LAT_TOP = 78;
const LAT_BOTTOM = -56;

function project([lng, lat]: LngLat): [number, number] {
  const x = ((lng + 180) / 360) * VIEW_W;
  const clamped = Math.min(LAT_TOP, Math.max(LAT_BOTTOM, lat));
  const y = ((LAT_TOP - clamped) / (LAT_TOP - LAT_BOTTOM)) * VIEW_H;
  return [x, y];
}

function toPath(points: readonly LngLat[]): string {
  return (
    points
      .map((p, i) => {
        const [x, y] = project(p);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ') + ' Z'
  );
}

/** Great-circle-ish arc: control point lifted perpendicular to the lane. */
function arcPath(a: LngLat, b: LngLat, lift = 0.18): string {
  const [x1, y1] = project(a);
  const [x2, y2] = project(b);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  // Perpendicular offset, always lifted "upwards" on screen.
  const nx = -dy / len;
  const ny = dx / len;
  const sign = ny > 0 ? -1 : 1;
  const cx = mx + nx * len * lift * sign;
  const cy = my + ny * len * lift * sign;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

// ---------------------------------------------------------------------------
// Network data
// ---------------------------------------------------------------------------

type Hub = {
  id: string;
  city: string;
  country: string;
  code: string;
  coord: LngLat;
  /** Primary hubs get a larger marker. */
  primary?: boolean;
  region: 'Americas' | 'EMEA' | 'APAC';
};

const HUBS: Hub[] = [
  // Americas
  { id: 'LAX', city: 'Los Angeles', country: 'United States', code: 'LAX', coord: [-118.24, 34.05], primary: true, region: 'Americas' },
  { id: 'JFK', city: 'New York', country: 'United States', code: 'JFK', coord: [-73.78, 40.64], primary: true, region: 'Americas' },
  { id: 'ORD', city: 'Chicago', country: 'United States', code: 'ORD', coord: [-87.63, 41.88], region: 'Americas' },
  { id: 'DFW', city: 'Dallas', country: 'United States', code: 'DFW', coord: [-96.8, 32.78], region: 'Americas' },
  { id: 'MIA', city: 'Miami', country: 'United States', code: 'MIA', coord: [-80.19, 25.76], primary: true, region: 'Americas' },
  { id: 'YVR', city: 'Vancouver', country: 'Canada', code: 'YVR', coord: [-123.12, 49.28], region: 'Americas' },
  { id: 'YYZ', city: 'Toronto', country: 'Canada', code: 'YYZ', coord: [-79.38, 43.65], region: 'Americas' },
  { id: 'MEX', city: 'Mexico City', country: 'Mexico', code: 'MEX', coord: [-99.13, 19.43], region: 'Americas' },
  { id: 'GRU', city: 'São Paulo', country: 'Brazil', code: 'GRU', coord: [-46.63, -23.55], primary: true, region: 'Americas' },
  { id: 'BOG', city: 'Bogotá', country: 'Colombia', code: 'BOG', coord: [-74.07, 4.71], region: 'Americas' },
  { id: 'EZE', city: 'Buenos Aires', country: 'Argentina', code: 'EZE', coord: [-58.38, -34.6], region: 'Americas' },
  { id: 'SCL', city: 'Santiago', country: 'Chile', code: 'SCL', coord: [-70.67, -33.45], region: 'Americas' },
  // EMEA
  { id: 'LHR', city: 'London', country: 'United Kingdom', code: 'LHR', coord: [-0.13, 51.51], primary: true, region: 'EMEA' },
  { id: 'AMS', city: 'Rotterdam', country: 'Netherlands', code: 'RTM', coord: [4.48, 51.92], primary: true, region: 'EMEA' },
  { id: 'FRA', city: 'Frankfurt', country: 'Germany', code: 'FRA', coord: [8.68, 50.11], primary: true, region: 'EMEA' },
  { id: 'HAM', city: 'Hamburg', country: 'Germany', code: 'HAM', coord: [9.99, 53.55], region: 'EMEA' },
  { id: 'MAD', city: 'Madrid', country: 'Spain', code: 'MAD', coord: [-3.7, 40.42], region: 'EMEA' },
  { id: 'WAW', city: 'Warsaw', country: 'Poland', code: 'WAW', coord: [21.01, 52.23], region: 'EMEA' },
  { id: 'IST', city: 'Istanbul', country: 'Türkiye', code: 'IST', coord: [28.98, 41.01], region: 'EMEA' },
  { id: 'DXB', city: 'Dubai', country: 'United Arab Emirates', code: 'DXB', coord: [55.27, 25.2], primary: true, region: 'EMEA' },
  { id: 'CAI', city: 'Cairo', country: 'Egypt', code: 'CAI', coord: [31.24, 30.04], region: 'EMEA' },
  { id: 'LOS', city: 'Lagos', country: 'Nigeria', code: 'LOS', coord: [3.38, 6.52], region: 'EMEA' },
  { id: 'NBO', city: 'Nairobi', country: 'Kenya', code: 'NBO', coord: [36.82, -1.29], region: 'EMEA' },
  { id: 'JNB', city: 'Johannesburg', country: 'South Africa', code: 'JNB', coord: [28.05, -26.2], primary: true, region: 'EMEA' },
  { id: 'CPT', city: 'Cape Town', country: 'South Africa', code: 'CPT', coord: [18.42, -33.92], region: 'EMEA' },
  // APAC
  { id: 'DEL', city: 'Delhi', country: 'India', code: 'DEL', coord: [77.21, 28.61], region: 'APAC' },
  { id: 'BOM', city: 'Mumbai', country: 'India', code: 'BOM', coord: [72.88, 19.08], region: 'APAC' },
  { id: 'BKK', city: 'Bangkok', country: 'Thailand', code: 'BKK', coord: [100.5, 13.76], region: 'APAC' },
  { id: 'SIN', city: 'Singapore', country: 'Singapore', code: 'SIN', coord: [103.82, 1.35], primary: true, region: 'APAC' },
  { id: 'HKG', city: 'Hong Kong', country: 'Hong Kong SAR', code: 'HKG', coord: [114.17, 22.32], primary: true, region: 'APAC' },
  { id: 'PVG', city: 'Shanghai', country: 'China', code: 'PVG', coord: [121.47, 31.23], primary: true, region: 'APAC' },
  { id: 'PEK', city: 'Beijing', country: 'China', code: 'PEK', coord: [116.4, 39.9], region: 'APAC' },
  { id: 'ICN', city: 'Seoul', country: 'South Korea', code: 'ICN', coord: [126.98, 37.57], region: 'APAC' },
  { id: 'NRT', city: 'Tokyo', country: 'Japan', code: 'NRT', coord: [139.69, 35.68], primary: true, region: 'APAC' },
  { id: 'SYD', city: 'Sydney', country: 'Australia', code: 'SYD', coord: [151.21, -33.87], primary: true, region: 'APAC' },
  { id: 'MEL', city: 'Melbourne', country: 'Australia', code: 'MEL', coord: [144.96, -37.81], region: 'APAC' },
  { id: 'AKL', city: 'Auckland', country: 'New Zealand', code: 'AKL', coord: [174.76, -36.85], region: 'APAC' },
];

const HUB_BY_ID = new Map(HUBS.map((h) => [h.id, h]));

/** Long-haul + intercontinental air lanes. */
const AIR_LANES: [string, string][] = [
  ['LAX', 'NRT'], ['LAX', 'SYD'], ['LAX', 'LHR'], ['LAX', 'HKG'], ['LAX', 'DXB'],
  ['JFK', 'LHR'], ['JFK', 'DXB'], ['JFK', 'PVG'], ['JFK', 'GRU'], ['JFK', 'MAD'],
  ['ORD', 'FRA'], ['ORD', 'NRT'], ['YVR', 'NRT'], ['YYZ', 'LHR'], ['DFW', 'AMS'],
  ['MIA', 'GRU'], ['MIA', 'LHR'], ['MIA', 'JNB'], ['MIA', 'BOG'], ['MIA', 'SCL'],
  ['BOG', 'EZE'], ['GRU', 'EZE'], ['GRU', 'LOS'], ['MEX', 'LAX'],
  ['LHR', 'DXB'], ['LHR', 'JNB'], ['LHR', 'SIN'], ['LHR', 'HKG'], ['LHR', 'SYD'],
  ['AMS', 'JFK'], ['FRA', 'LAX'], ['FRA', 'SIN'], ['FRA', 'IST'], ['MAD', 'GRU'],
  ['HAM', 'WAW'], ['DXB', 'DEL'], ['DXB', 'BOM'], ['DXB', 'SYD'], ['DXB', 'JNB'],
  ['DXB', 'NBO'], ['CAI', 'LHR'], ['CAI', 'JNB'], ['LOS', 'LHR'], ['NBO', 'DEL'],
  ['JNB', 'GRU'], ['DEL', 'BOM'], ['DEL', 'BKK'], ['BKK', 'SIN'], ['SIN', 'HKG'],
  ['SIN', 'SYD'], ['SIN', 'LAX'], ['SIN', 'MEL'], ['HKG', 'JFK'], ['PVG', 'LAX'],
  ['PVG', 'FRA'], ['PEK', 'ICN'], ['ICN', 'JFK'], ['NRT', 'LAX'], ['SYD', 'LAX'],
  ['MEL', 'AKL'],
];

/** Regional ground corridors (truck / rail lanes). */
const GROUND_LANES: [string, string][] = [
  ['LAX', 'DFW'], ['DFW', 'ORD'], ['ORD', 'JFK'], ['JFK', 'MIA'], ['LAX', 'YVR'],
  ['DFW', 'MEX'], ['YYZ', 'ORD'],
  ['LHR', 'AMS'], ['AMS', 'FRA'], ['FRA', 'HAM'], ['FRA', 'MAD'], ['MAD', 'IST'],
  ['WAW', 'FRA'],
  ['JNB', 'CPT'], ['JNB', 'NBO'],
  ['PVG', 'HKG'], ['PVG', 'ICN'], ['SIN', 'BKK'], ['BKK', 'DEL'], ['DEL', 'BOM'],
  ['SYD', 'MEL'],
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GlobalNetworkMap() {
  const [activeHub, setActiveHub] = useState<string | null>(null);
  const titleId = useId();
  const descId = useId();

  const landPaths = useMemo(() => WORLD_OUTLINES.map(toPath), []);

  const airLanes = useMemo(
    () =>
      AIR_LANES.map(([a, b]) => ({
        id: `${a}-${b}`,
        d: arcPath(HUB_BY_ID.get(a)!.coord, HUB_BY_ID.get(b)!.coord, 0.16),
        a,
        b,
      })),
    [],
  );

  const groundLanes = useMemo(
    () =>
      GROUND_LANES.map(([a, b]) => ({
        id: `${a}-${b}`,
        d: arcPath(HUB_BY_ID.get(a)!.coord, HUB_BY_ID.get(b)!.coord, 0.05),
        a,
        b,
      })),
    [],
  );

  const active = activeHub ? HUB_BY_ID.get(activeHub) : null;
  const isLit = (a: string, b: string) => activeHub !== null && (a === activeHub || b === activeHub);

  const countFor = (id: string, lanes: [string, string][]) =>
    lanes.filter(([a, b]) => a === id || b === id).length;

  return (
    <div className="relative">
      <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-br from-[#0b1a5c] via-[#123a9c] to-[#0d2f7a] shadow-2xl">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-auto block"
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
        >
          <title id={titleId}>ShipNex global network coverage</title>
          <desc id={descId}>
            A world map showing {HUBS.length} ShipNex hubs across the Americas, EMEA and
            APAC, connected by {AIR_LANES.length} air lanes and {GROUND_LANES.length} ground
            corridors.
          </desc>

          <defs>
            <radialGradient id="gnm-glow" cx="50%" cy="45%" r="70%">
              <stop offset="0%" stopColor="#4f8bff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#4f8bff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="gnm-land" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4d7ff0" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#1b3fa8" stopOpacity="0.30" />
            </linearGradient>
          </defs>

          <rect width={VIEW_W} height={VIEW_H} fill="url(#gnm-glow)" />

          {/* Graticule */}
          <g stroke="#93b4ff" strokeOpacity="0.12" strokeWidth="0.6">
            {[-120, -60, 0, 60, 120].map((lng) => {
              const [x] = project([lng, 0]);
              return <line key={`v${lng}`} x1={x} y1={0} x2={x} y2={VIEW_H} />;
            })}
            {[60, 30, 0, -30].map((lat) => {
              const [, y] = project([0, lat]);
              return <line key={`h${lat}`} x1={0} y1={y} x2={VIEW_W} y2={y} />;
            })}
          </g>

          {/* Landmasses */}
          <g fill="url(#gnm-land)" stroke="#7ea6ff" strokeOpacity="0.5" strokeWidth="0.8">
            {landPaths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

          {/* Ground corridors */}
          <g fill="none" strokeLinecap="round">
            {groundLanes.map((lane) => {
              const lit = isLit(lane.a, lane.b);
              return (
                <path
                  key={lane.id}
                  d={lane.d}
                  stroke="#7dd3fc"
                  strokeOpacity={activeHub && !lit ? 0.12 : 0.55}
                  strokeWidth={lit ? 2.4 : 1.4}
                  strokeDasharray="5 4"
                  className="transition-opacity duration-300"
                />
              );
            })}
          </g>

          {/* Air lanes (base + animated flow overlay) */}
          <g fill="none" strokeLinecap="round">
            {airLanes.map((lane) => {
              const lit = isLit(lane.a, lane.b);
              const dim = activeHub !== null && !lit;
              return (
                <g key={lane.id} className="transition-opacity duration-300" opacity={dim ? 0.1 : 1}>
                  <path d={lane.d} stroke="#ff8f00" strokeOpacity={lit ? 0.8 : 0.3} strokeWidth={lit ? 2 : 1.1} />
                  <path
                    d={lane.d}
                    stroke="#ffd08a"
                    strokeWidth={lit ? 2.2 : 1.3}
                    strokeDasharray="3 16"
                    className="gnm-lane-flow"
                  />
                </g>
              );
            })}
          </g>

          {/* Hubs */}
          <g>
            {HUBS.map((hub) => {
              const [x, y] = project(hub.coord);
              const isActive = activeHub === hub.id;
              const r = hub.primary ? 5 : 3.2;
              return (
                <g
                  key={hub.id}
                  transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveHub(hub.id)}
                  onMouseLeave={() => setActiveHub((cur) => (cur === hub.id ? null : cur))}
                >
                  {/* Generous invisible hit area so small markers stay easy to hover */}
                  <circle r={12} fill="transparent" />
                  {hub.primary && (
                    <circle r={9} fill="#ff8f00" fillOpacity="0.18" className="gnm-hub-ping" />
                  )}
                  <circle
                    r={r}
                    fill={hub.primary ? '#ff6f00' : '#9fc4ff'}
                    stroke="#ffffff"
                    strokeWidth={isActive ? 2 : 1.2}
                  />
                  {hub.primary && (
                    <text
                      y={-11}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill="#ffffff"
                      fillOpacity={isActive ? 1 : 0.88}
                      style={{ paintOrder: 'stroke', letterSpacing: '0.04em' }}
                      stroke="#0b1a5c"
                      strokeOpacity="0.65"
                      strokeWidth="2.6"
                    >
                      {hub.code}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hover readout */}
        <div className="pointer-events-none absolute left-4 bottom-4 right-4 sm:left-6 sm:bottom-6 sm:right-auto sm:min-w-[15rem]">
          <div className="rounded-2xl bg-[#0b1a5c]/80 backdrop-blur-sm border border-white/15 px-4 py-3">
            {active ? (
              <>
                <p className="text-[11px] uppercase tracking-widest text-[#9fc4ff]">{active.region} hub</p>
                <p className="text-white font-semibold leading-tight">
                  {active.city}, {active.country}
                </p>
                <p className="text-xs text-white/70 mt-1">
                  <span className="text-[#ff8f00] font-semibold">{active.code}</span> ·{' '}
                  {countFor(active.id, AIR_LANES)} air lanes ·{' '}
                  {countFor(active.id, GROUND_LANES)} ground corridors
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] uppercase tracking-widest text-[#9fc4ff]">Global network</p>
                <p className="text-white font-semibold leading-tight">
                  {HUBS.length} hubs · {AIR_LANES.length} air lanes
                </p>
                <p className="text-xs text-white/70 mt-1">Hover a hub to highlight its lanes</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/75">
        <span className="inline-flex items-center gap-2">
          <span className="w-6 h-0.5 bg-[#ff8f00] rounded-full" aria-hidden="true" />
          Air lane
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-6 h-0.5 bg-[#7dd3fc] rounded-full" aria-hidden="true" />
          Ground corridor
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff6f00] border border-white" aria-hidden="true" />
          Primary hub
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#9fc4ff] border border-white/70" aria-hidden="true" />
          Gateway
        </span>
      </div>
    </div>
  );
}
