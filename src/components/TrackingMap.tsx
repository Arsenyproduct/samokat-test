// Map from frames 2.4 / 2.5 (378:352): city blocks, river, four routes to the
// home pin, store pins and couriers. Drawn as one SVG so it scales as a whole.

import { stores, type StoreId } from '../data/catalog';

type Point = [number, number];

/** Route polylines from the store pin to home, in frame coordinates. */
const routes: Record<Exclude<StoreId, 'eapteka'>, Point[]> = {
  shokoladnitsa: [[79, 57], [79, 225], [235, 225]],
  samokat: [[313, 115], [235, 115], [235, 231]],
  '4lapy': [[157, 289], [157, 237], [235, 237]],
  lenta: [[313, 289], [313, 231], [235, 231]],
};

const pins: { store: StoreId; x: number; y: number }[] = [
  { store: 'shokoladnitsa', x: 62, y: 40 },
  { store: 'samokat', x: 296, y: 98 },
  { store: '4lapy', x: 140, y: 272 },
  { store: 'lenta', x: 296, y: 272 },
];

const columns = [-70, 8, 86, 164, 242, 320, 398];
const rows = [-52, 6, 64, 122, 180, 238, 296, 354];

function pointAt(line: Point[], t: number): Point {
  const segments = line.slice(1).map((p, i) => {
    const a = line[i] as Point;
    return { a, b: p, len: Math.hypot(p[0] - a[0], p[1] - a[1]) };
  });
  const total = segments.reduce((sum, seg) => sum + seg.len, 0);
  let left = Math.max(0, Math.min(1, t)) * total;
  for (const seg of segments) {
    if (left <= seg.len) {
      const k = seg.len === 0 ? 0 : left / seg.len;
      return [seg.a[0] + (seg.b[0] - seg.a[0]) * k, seg.a[1] + (seg.b[1] - seg.a[1]) * k];
    }
    left -= seg.len;
  }
  return line[line.length - 1] as Point;
}

const toPath = (line: Point[]) => line.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');

/** Courier glyph (Courier icon, 15 px) centered at 0,0. */
function CourierGlyph() {
  return (
    <g transform="translate(-7.5 -7.5)" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.44 13.13a2.19 2.19 0 1 0 0-4.38 2.19 2.19 0 0 0 0 4.38z" />
      <path d="M11.56 13.13a2.19 2.19 0 1 0 0-4.38 2.19 2.19 0 0 0 0 4.38z" />
      <path d="M9.38 3.88a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z" />
      <path d="M7.5 10.94V8.75L5.63 6.88 8.13 5l1.25 1.88h1.25" />
    </g>
  );
}

/** `couriers` holds the share of each route already driven (0 at the store, 1 at home). */
export function TrackingMap({ couriers }: { couriers: Partial<Record<keyof typeof routes, number>> }) {
  return (
    <svg
      className="tracking-map"
      width="100%"
      height="380"
      viewBox="0 0 390 380"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Карта: курьеры едут к дому"
      style={{ display: 'block', background: 'var(--bg-card)' }}
    >
      <defs>
        {pins.map((pin) => (
          <clipPath key={pin.store} id={`pin-${pin.store}`}>
            <circle cx={pin.x + 17} cy={pin.y + 17} r="17" />
          </clipPath>
        ))}
      </defs>

      {columns.map((x) =>
        rows.map((y) => <rect key={`${x}:${y}`} x={x} y={y} width="64" height="44" rx="6" fill="var(--map-block)" />),
      )}
      <rect x="-70" y="180" width="142" height="44" rx="8" fill="var(--map-park)" />
      <rect x="242" y="122" width="64" height="44" rx="8" fill="var(--map-park)" />
      <rect x="320" y="238" width="64" height="44" rx="8" fill="var(--map-park)" />

      <path
        d="M63.25 0C18.25 70 38.25 150 8.25 210C-21.75 270 38.25 310 58.25 360"
        transform="translate(341.75 -10)"
        fill="none"
        stroke="var(--map-river)"
        strokeWidth="26"
        strokeLinecap="round"
      />

      {Object.values(routes).map((line, i) => (
        <path key={`casing-${i}`} d={toPath(line)} fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {(Object.keys(routes) as (keyof typeof routes)[]).map((store) => (
        <path key={store} d={toPath(routes[store])} fill="none" stroke={stores[store].color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      ))}

      <g fontFamily="Onest, sans-serif" fontWeight="500" fontSize="9" fill="var(--map-label)">
        <text x="100" y="59">ул. Центральная</text>
        <text x="-50" y="204">Парк</text>
        <text x="243" y="301">просп. Мира</text>
      </g>

      {(Object.keys(routes) as (keyof typeof routes)[]).map((store) => {
        const [x, y] = pointAt(routes[store], couriers[store] ?? 0.5);
        return (
          <g key={store} className="tracking-courier" style={{ transform: `translate(${x}px, ${y}px)` }}>
            <circle r="11.75" fill={stores[store].color} stroke="#fff" strokeWidth="2.5" />
            <CourierGlyph />
          </g>
        );
      })}

      {pins.map((pin) => (
        <g key={pin.store} style={{ filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.18))' }}>
          <image
            href={stores[pin.store].logo}
            x={pin.x}
            y={pin.y}
            width="34"
            height="34"
            clipPath={`url(#pin-${pin.store})`}
            preserveAspectRatio="xMidYMid slice"
          />
        </g>
      ))}

      <g style={{ filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.2))' }}>
        <circle cx="235" cy="231" r="13" fill="var(--bg-dark-pill)" />
        <circle cx="235" cy="231" r="11.5" fill="none" stroke="#fff" strokeWidth="3" />
        <circle cx="235" cy="231" r="4" fill="#fff" />
      </g>
    </svg>
  );
}
