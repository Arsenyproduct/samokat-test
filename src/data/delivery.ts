// Everything the «Ползунок» scenario shows: checkout (frames 2.1, 2.2, 2.3),
// tracking (2.4) and the delay (2.5). Prices are conditional, as in the mockups.
//
// Texts marked "derived" have no frame of their own in Figma: the tracking
// mockup exists only for «Баланс», so the other two positions reuse its
// wording with their own trips.

import type { StoreId } from './catalog';

export type ScenarioId = 'fast' | 'balance' | 'all';

export const scenarioOrder: ScenarioId[] = ['fast', 'balance', 'all'];

export const DEFAULT_SCENARIO: ScenarioId = 'balance';

export type Trip = {
  id: string;
  time: string;
  stores: StoreId[];
  /** Green chip under the products, shown only if all `requires` stores are in the cart. */
  note?: { text: string; requires: StoreId[] };
};

export type TrackChip =
  | { kind: 'countdown'; from: number; to: number }
  | { kind: 'static'; text: string; tone: 'green' | 'amber' };

export type TrackRow = {
  id: string;
  stores: StoreId[];
  /** Store whose logo leads the row. */
  logo: StoreId;
  /** Title override; by default store names are joined with a comma. */
  title?: string;
  time: string;
  status: string;
  chip?: TrackChip;
  /** Progress bar share at the start of tracking and at the moment of the delay. */
  progress: [number, number];
};

export type Scenario = {
  id: ScenarioId;
  label: string;
  delivery: number;
  trips: Trip[];
  tracking: {
    title: string;
    subtitle?: string;
    rows: TrackRow[];
  };
  /** Present when 4 лапы rides separately from Лента and can be merged with it. */
  delay?: {
    /** Row that splits: 4 лапы leaves it. */
    splitRowId: string;
    /** Row 4 лапы can join. */
    joinRowId: string;
    /** How the remaining rows read after the split (frame 2.5). */
    rowUpdates: Record<string, Partial<Omit<TrackRow, 'id'>>>;
    /** Trips left after merging, counted the way frame 2.5 counts them. */
    tripsAfterMerge: number;
  };
};

// Track width in the frames is 334 px, the bars are drawn in px there.
const px = (value: number) => value / 334;

export const checkoutCopy = {
  title: 'Оформление',
  question: 'Как привезти?',
  hint: 'Двигайте ползунок, рейсы и цена пересоберутся.',
  arrivalsLabel: (count: number) => pluralArrivals(count),
  lastLabel: 'всё доедет',
  deliveryLabel: 'доставка',
  promoNote: 'Один промокод на все товары, включая партнёров',
  bonusNote: '154 бонуса, списываем на весь заказ',
  total: 'Итого',
  pay: 'Оплатить',
};

function pluralArrivals(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'приезд';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'приезда';
  return 'приездов';
}

const shokoladnitsaAnd4lapy: StoreId[] = ['shokoladnitsa', '4lapy'];

export const scenarios: Record<ScenarioId, Scenario> = {
  fast: {
    id: 'fast',
    label: 'Скорее',
    delivery: 199,
    trips: [
      { id: 'eapteka', time: '14:26', stores: ['eapteka'] },
      { id: 'samokat', time: '14:31', stores: ['samokat'] },
      { id: 'evening', time: '15:20', stores: shokoladnitsaAnd4lapy },
      { id: 'lenta', time: '17:30', stores: ['lenta'] },
    ],
    tracking: {
      // derived
      title: 'Первой приедет еАптека через 10 минут',
      subtitle: 'Дальше Самокат, Шоколадница с зоомагазином, потом Лента.',
      rows: [
        {
          id: 'eapteka',
          stores: ['eapteka'],
          logo: 'eapteka',
          time: '14:26',
          status: 'Курьер в пути',
          chip: { kind: 'countdown', from: 10, to: 3 },
          progress: [px(160), px(290)],
        },
        {
          id: 'samokat',
          stores: ['samokat'],
          logo: 'samokat',
          time: '14:31',
          status: 'Курьер в пути',
          chip: { kind: 'countdown', from: 15, to: 7 },
          progress: [px(127), px(223)],
        },
        {
          id: 'evening',
          stores: shokoladnitsaAnd4lapy,
          logo: 'shokoladnitsa',
          time: '15:20',
          status: 'Готовим и собираем',
          progress: [px(38), px(64)],
        },
        {
          id: 'lenta',
          stores: ['lenta'],
          logo: 'lenta',
          time: '17:30',
          status: 'Ждёт отправки',
          progress: [px(6), px(6)],
        },
      ],
    },
    delay: {
      splitRowId: 'evening',
      joinRowId: 'lenta',
      rowUpdates: {
        evening: { stores: ['shokoladnitsa'], status: 'Готовим' },
      },
      tripsAfterMerge: 3,
    },
  },
  balance: {
    id: 'balance',
    label: 'Баланс',
    delivery: 99,
    trips: [
      {
        id: 'first',
        time: '14:31',
        stores: ['eapteka', 'samokat'],
        note: { text: 'аптека едет с Самокатом', requires: ['eapteka', 'samokat'] },
      },
      { id: 'evening', time: '15:20', stores: shokoladnitsaAnd4lapy },
      { id: 'lenta', time: '17:30', stores: ['lenta'] },
    ],
    tracking: {
      title: 'Первым приедет Самокат с аптекой через 15 минут',
      subtitle: 'Дальше Шоколадница с зоомагазином, потом Лента.',
      rows: [
        {
          id: 'first',
          stores: ['eapteka', 'samokat'],
          logo: 'samokat',
          time: '14:31',
          status: 'Собираем и везём вместе',
          chip: { kind: 'countdown', from: 15, to: 7 },
          progress: [px(127), px(223)],
        },
        {
          id: 'evening',
          stores: shokoladnitsaAnd4lapy,
          logo: 'shokoladnitsa',
          time: '15:20',
          status: 'Готовим и собираем',
          progress: [px(38), px(64)],
        },
        {
          id: 'lenta',
          stores: ['lenta'],
          logo: 'lenta',
          time: '17:30',
          status: 'Ждёт отправки',
          progress: [px(6), px(6)],
        },
      ],
    },
    delay: {
      splitRowId: 'evening',
      joinRowId: 'lenta',
      rowUpdates: {
        first: { status: 'Курьер в пути' },
        evening: { stores: ['shokoladnitsa'], status: 'Готовим' },
      },
      tripsAfterMerge: 2,
    },
  },
  all: {
    id: 'all',
    label: 'Всё сразу',
    delivery: 0,
    trips: [
      {
        id: 'all',
        time: '17:30',
        stores: ['eapteka', 'samokat', 'shokoladnitsa', '4lapy', 'lenta'],
        note: { text: 'Самокат тоже в 17:30. Нужно раньше? Сдвиньте влево', requires: ['samokat'] },
      },
    ],
    tracking: {
      // derived
      title: 'Всё приедет одним рейсом в 17:30',
      rows: [
        {
          id: 'all',
          stores: ['eapteka', 'samokat', 'shokoladnitsa', '4lapy', 'lenta'],
          logo: 'samokat',
          time: '17:30',
          status: 'Ждёт отправки',
          progress: [px(6), px(24)],
        },
      ],
    },
  },
};

/** The delay event on the tracking screen (frame 2.5). */
export const delayCopy = {
  afterMs: 6000,
  title: '4 лапы задерживаются',
  subtitle: 'Новый срок доставки 17:10, Лента приедет в 17:30.',
  proposalTitle: 'Сдвинуть ползунок?',
  proposalText: (tripsLeft: number) =>
    `Если привезти игрушку вместе с Лентой в 17:30, останется ${tripsLeft} ${pluralArrivals(tripsLeft)}, а доставка станет дешевле на 50 ₽.`,
  merge: 'Объединить',
  keep: 'Оставить',
  delayedRow: {
    id: '4lapy',
    stores: ['4lapy'],
    logo: '4lapy',
    time: '17:10',
    status: 'Нет игрушки на складе',
    chip: { kind: 'static', text: 'задержка', tone: 'amber' },
    progress: [px(16), px(16)],
  } satisfies TrackRow,
  /** After «Объединить» 4 лапы rides with Лента. */
  mergedStatus: 'Ждёт отправки',
};

/** Product delivered by a store must be in the cart for the store to show up anywhere. */
export const tripStoresInCart = (stores: StoreId[], inCart: Set<StoreId>) =>
  stores.filter((store) => inCart.has(store));
