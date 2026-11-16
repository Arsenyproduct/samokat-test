// Data of the «3 по цене 2» prototype (Figma page «Тестовое 2», frames E1–E5).

export type FlavorId = 'les' | 'arahis' | 'bel';

export type Flavor = {
  id: FlavorId;
  /** Chip label: «Лесной орех» */
  name: string;
  /** In titles: «Шоколадный батончик Snickers, лесной орех» */
  lower: string;
  /** Dot colour of the flavour chips (E5) */
  dot: string;
};

export const flavors: Record<FlavorId, Flavor> = {
  les: { id: 'les', name: 'Лесной орех', lower: 'лесной орех', dot: '#7A4E2D' },
  arahis: { id: 'arahis', name: 'Больше арахиса', lower: 'больше арахиса', dot: '#C8102E' },
  bel: { id: 'bel', name: 'Белый', lower: 'белый', dot: '#EFE6D2' },
};

/** Chip order on the product card (E2): Лесной орех, Больше арахиса, Белый, Эспрессо */
export const flavorOrder: FlavorId[] = ['les', 'arahis', 'bel'];

export const PRICE = 89;
export const SET_PRICE = 178;
export const SET_FULL = PRICE * 3;
export const COOKIE_PRICE = 115;
export const PACKING = 49;
export const BONUS = 154;

const base = `${import.meta.env.BASE_URL}assets/promo/`;

export const img = {
  hero: (f: FlavorId) => `${base}hero-${f}.jpg`,
  bar: (f: FlavorId) => `${base}bar-${f}.webp`,
  cookie: `${base}cookie.jpg`,
};

export const productTitle = (f: FlavorId) => `Шоколадный батончик Snickers, ${flavors[f].lower}`;

/** «Лесной орех, белый, больше арахиса» */
export const flavorList = (list: FlavorId[]) =>
  list.map((f, i) => (i === 0 ? flavors[f].name : flavors[f].lower)).join(', ');

/** The set starts from the open flavour, then as on E2: «Лесной орех, белый, больше арахиса». */
const setOrder: FlavorId[] = ['les', 'bel', 'arahis'];
export const defaultSet = (first: FlavorId): FlavorId[] => [first, ...setOrder.filter((f) => f !== first)];

export const rub = (value: number) => `${value.toLocaleString('ru-RU').replace(/\s/g, ' ')} ₽`;
