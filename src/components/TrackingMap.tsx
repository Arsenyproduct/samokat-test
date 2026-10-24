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
  shokoladnitsa: { pin: [63, 293], route: [[80, 310], [80, 254], [234.5, 254], [234.5, 233.4]] },
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

/**
 * Blocks replaced by bigger shapes. Routes run along the streets between
 * blocks, so the shapes stay inside block areas and keep the streets free.
 */
const merged = new Set([
  '-70:122', '8:122', '-70:180', '8:180', // park
  '86:6', '164:6', // mall
  '164:64', // square
  '320:-52', '320:6', // stadium
  '242:6', // school
  '242:180', // two houses
  '242:122', // garden
  '320:238', // small park by the river
  '-70:296', '8:296', '-70:354', '8:354', // square in the south-west
]);

/** Park, mall, square, stadium and other shapes that make the city less of a grid. */
function CityShapes() {
  return (
    <g>
      {/* Парк Победы: one green area over four blocks, with a pond and paths */}
      <rect x="-70" y="122" width="142" height="102" rx="14" fill="var(--map-park)" />
      <path d="M-60 214 C-20 190 0 170 20 150 S60 130 66 128" fill="none" stroke="#fff" strokeWidth="2" strokeOpacity="0.8" strokeDasharray="1 4" strokeLinecap="round" />
      <ellipse cx="34" cy="190" rx="22" ry="13" fill="var(--map-river)" />
      <circle cx="-8" cy="146" r="5" fill="#c5e2bd" />
      <circle cx="6" cy="138" r="4" fill="#c5e2bd" />
      <circle cx="58" cy="148" r="6" fill="#c5e2bd" />

      {/* ТЦ: a long building with a courtyard */}
      <rect x="86" y="6" width="142" height="44" rx="6" fill="#e1e4dd" />
      <rect x="140" y="16" width="34" height="24" rx="4" fill="var(--map-block)" />

      {/* Square with a fountain */}
      <rect x="164" y="64" width="64" height="44" rx="6" fill="#f1f2ee" />
      <circle cx="196" cy="86" r="13" fill="none" stroke="var(--map-block)" strokeWidth="5" />
      <circle cx="196" cy="86" r="4" fill="var(--map-river)" />

      {/* Stadium */}
      <rect x="320" y="-52" width="64" height="102" rx="10" fill="var(--map-park)" />
      <rect x="331" y="-30" width="42" height="62" rx="21" fill="none" stroke="#fff" strokeWidth="3" />

      {/* School: an L-shaped building */}
      <path d="M242 12a6 6 0 0 1 6-6h52a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6h-22v18a6 6 0 0 1-6 6h-24a6 6 0 0 1-6-6z" fill="var(--map-block)" />
      <rect x="286" y="32" width="20" height="18" rx="4" fill="var(--map-park)" />

      {/* Garden next to the samokat */}
      <rect x="242" y="122" width="64" height="44" rx="8" fill="var(--map-park)" />

      {/* Two houses instead of one block */}
      <rect x="242" y="180" width="28" height="44" rx="5" fill="var(--map-block)" />
      <rect x="276" y="180" width="30" height="20" rx="5" fill="var(--map-block)" />
      <rect x="276" y="204" width="30" height="20" rx="5" fill="var(--map-block)" />

      {/* Small park by the river */}
      <rect x="320" y="238" width="64" height="44" rx="8" fill="var(--map-park)" />

      {/* South-west square with a round flower bed */}
      <rect x="-70" y="296" width="142" height="102" rx="14" fill="var(--map-park)" />
      <circle cx="10" cy="340" r="16" fill="#c5e2bd" />
    </g>
  );
}

/** Points of interest: a dot with a name, kept off the routes and the store pins. */
const pois: { x: number; y: number; name: string }[] = [
  { x: 101, y: 196, name: 'Библиотека' },
  { x: 179, y: 140, name: 'Почта' },
  { x: 257, y: 18, name: 'Школа №7' },
];

function MapLabels() {
  return (
    <g fontFamily="Onest, sans-serif" fontWeight="500" fontSize="9" fill="var(--map-label)">
      <text x="100" y="60">ул. Центральная</text>
      <text x="186" y="292">просп. Мира</text>
      <text x="6" y="172">Парк Победы</text>
      <text x="157" y="31" textAnchor="middle">ТЦ «Галерея»</text>
      <text x="196" y="117" textAnchor="middle" fontSize="8">пл. Пушкина</text>
      <text x="352" y="45" textAnchor="middle">Стадион</text>
      <text x="316" y="102" transform="rotate(-90 316 102)" fontSize="8">ул. Лесная</text>
      <text x="368" y="190" transform="rotate(-78 368 190)" fontSize="8">наб. Речная</text>
      {pois.map((poi) => (
        <g key={poi.name}>
          <circle cx={poi.x} cy={poi.y} r="3.5" fill="#fff" stroke="var(--map-label)" strokeWidth="1.5" />
          <text x={poi.x + 7} y={poi.y + 3} fontSize="8">
            {poi.name}
          </text>
        </g>
      ))}
    </g>
  );
}

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
        rows.map((y) =>
          merged.has(`${x}:${y}`) ? null : (
            <rect key={`${x}:${y}`} x={x} y={y} width="64" height="44" rx="6" fill="var(--map-block)" />
          ),
        ),
      )}
      <CityShapes />
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

      <MapLabels />

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
