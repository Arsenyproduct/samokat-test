// Map from frames 2.4–2.6 (378:352): city blocks, river, and for every trip
// still on its way a store pin, a route to home and a courier. Drawn as one SVG
// so it scales as a whole.

import { stores, type StoreId } from '../data/catalog';

type Point = [number, number];

/**
 * Where each store sits on the map and how its courier drives home (frame
 * coordinates from 2.4 and 2.5). A trip is drawn at the store that leads it.
 */
const places: Record<StoreId, { pin: Point; route: Point[] }> = {
  samokat: { pin: [296, 98], route: [[313, 115], [235, 115], [235, 231]] },
  lenta: { pin: [296, 272], route: [[313, 289], [313, 231], [235, 231]] },
  '4lapy': { pin: [140, 272], route: [[157, 289], [157, 237], [235, 237]] },
  shokoladnitsa: { pin: [63, 293], route: [[80, 310], [80, 254], [235, 254]] },
  eapteka: { pin: [62, 40], route: [[79, 57], [79, 225], [235, 225]] },
};

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

export type MapTrip = { store: StoreId; share: number };

/** `trips` are the rows still on their way: store leading the row and the share already driven. */
export function TrackingMap({ trips }: { trips: MapTrip[] }) {
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
        {trips.map(({ store }) => (
          <clipPath key={store} id={`pin-${store}`}>
            <circle cx={places[store].pin[0] + 17} cy={places[store].pin[1] + 17} r="17" />
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

      {trips.map(({ store }) => (
        <path key={`casing-${store}`} d={toPath(places[store].route)} fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {trips.map(({ store }) => (
        <path key={store} d={toPath(places[store].route)} fill="none" stroke={stores[store].color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      ))}

      <g fontFamily="Onest, sans-serif" fontWeight="500" fontSize="9" fill="var(--map-label)">
        <text x="100" y="59">ул. Центральная</text>
        <text x="-50" y="204">Парк</text>
        <text x="243" y="301">просп. Мира</text>
      </g>

      {trips.map(({ store, share }) => {
        const [x, y] = pointAt(places[store].route, 0.5 + 0.5 * share);
        return (
          <g key={store} className="tracking-courier" style={{ transform: `translate(${x}px, ${y}px)` }}>
            <circle r="11.75" fill={stores[store].color} stroke="#fff" strokeWidth="2.5" />
            <CourierGlyph />
          </g>
        );
      })}

      {trips.map(({ store }) => {
        const [x, y] = places[store].pin;
        return (
          <g key={store} style={{ filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.18))' }}>
            <image
              href={stores[store].logo}
              x={x}
              y={y}
              width="34"
              height="34"
              clipPath={`url(#pin-${store})`}
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        );
      })}

      <g style={{ filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.2))' }}>
        <circle cx="235" cy="231" r="13" fill="var(--bg-dark-pill)" />
        <circle cx="235" cy="231" r="11.5" fill="none" stroke="#fff" strokeWidth="3" />
        <circle cx="235" cy="231" r="4" fill="#fff" />
      </g>
    </svg>
  );
}
