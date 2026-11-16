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
export const PACKING = 49;
export const BONUS = 154;

const base = `${import.meta.env.BASE_URL}assets/promo/`;

export const img = {
  hero: (f: FlavorId) => `${base}hero-${f}.jpg`,
  bar: (f: FlavorId) => `${base}bar-${f}.webp`,
};

export const productTitle = (f: FlavorId) => `Шоколадный батончик Snickers, ${flavors[f].lower}`;

/** «Лесной орех, белый, больше арахиса» */
export const flavorList = (list: FlavorId[]) =>
  list.map((f, i) => (i === 0 ? flavors[f].name : flavors[f].lower)).join(', ');

/** The set starts from the open flavour, then as on E2: «Лесной орех, белый, больше арахиса». */
const setOrder: FlavorId[] = ['les', 'bel', 'arahis'];
export const defaultSet = (first: FlavorId): FlavorId[] => [first, ...setOrder.filter((f) => f !== first)];

export const rub = (value: number) => `${value.toLocaleString('ru-RU').replace(/\s/g, ' ')} ₽`;

/* ---------- Product details under the card (scroll) ---------- */

export type Nutrition = { kcal: number; protein: number; fat: number; carbs: number };

export const details: Record<FlavorId, { nutrition: Nutrition; about: string; composition: string }> = {
  les: {
    nutrition: { kcal: 506, protein: 8.1, fat: 27.4, carbs: 56 },
    about: 'Нуга с фундуком, мягкая карамель и обжаренный арахис в молочном шоколаде.',
    composition:
      'Молочный шоколад (сахар, какао-масло, сухое цельное молоко, какао тёртое, сухая молочная сыворотка, молочный жир, эмульгатор лецитин, ароматизатор), арахис жареный, сахар, сироп глюкозы, фундук жареный, сухое обезжиренное молоко, растительный жир, лактоза, соль, яичный белок, ароматизатор.',
  },
  arahis: {
    nutrition: { kcal: 521, protein: 10.6, fat: 29.8, carbs: 52.6 },
    about: 'Классический Snickers, в котором арахиса больше: нуга, карамель и молочный шоколад.',
    composition:
      'Арахис жареный, молочный шоколад (сахар, какао-масло, сухое цельное молоко, какао тёртое, сухая молочная сыворотка, молочный жир, эмульгатор лецитин, ароматизатор), сахар, сироп глюкозы, сухое обезжиренное молоко, растительный жир, лактоза, соль, яичный белок, ароматизатор.',
  },
  bel: {
    nutrition: { kcal: 509, protein: 7.4, fat: 26.9, carbs: 58.4 },
    about: 'Нуга, карамель и арахис в белой глазури со сливочным вкусом.',
    composition:
      'Белая кондитерская глазурь (сахар, растительный жир, сухое цельное молоко, сухая молочная сыворотка, эмульгатор лецитин, ароматизатор), арахис жареный, сахар, сироп глюкозы, сухое обезжиренное молоко, растительный жир, лактоза, соль, яичный белок, ароматизатор.',
  },
};

export const facts = [
  ['Срок годности', '12 месяцев'],
  ['Условия хранения', 'от +5 до +25 °C'],
  ['Производитель', 'Марс, Россия'],
] as const;
