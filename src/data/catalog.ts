// Stores, products and copy taken verbatim from the Figma frames
// (Главная, Каталог, Подборка, Товар, Корзина).

export type StoreId = 'samokat' | 'eapteka' | '4lapy' | 'shokoladnitsa' | 'lenta';

export type Store = {
  id: StoreId;
  name: string;
  logo: string;
  color: string;
  /** Срок доставки in the cart header of a partner block. */
  cartEta?: string;
};

const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;

/** Images that are not products in the cart. */
export const images = {
  island: asset('island.jpg'),
  bar: asset('products/bar.jpg'),
};

export const stores: Record<StoreId, Store> = {
  samokat: {
    id: 'samokat',
    name: 'Самокат',
    logo: asset('logos/samokat.png'),
    color: 'var(--store-samokat)',
  },
  eapteka: {
    id: 'eapteka',
    name: 'еАптека',
    logo: asset('logos/eapteka.png'),
    color: 'var(--store-eapteka)',
    cartEta: '~10 минут',
  },
  '4lapy': {
    id: '4lapy',
    name: '4 лапы',
    logo: asset('logos/4lapy.png'),
    color: 'var(--store-4lapy)',
    cartEta: '~1 час',
  },
  shokoladnitsa: {
    id: 'shokoladnitsa',
    name: 'Шоколадница',
    logo: asset('logos/shokoladnitsa.png'),
    color: 'var(--store-shokoladnitsa)',
    cartEta: '~1 час',
  },
  lenta: {
    id: 'lenta',
    name: 'Лента',
    logo: asset('logos/lenta.png'),
    color: 'var(--store-lenta)',
    cartEta: 'от 3 часов',
  },
};

/** Partner blocks in the cart, in the Figma order. */
export const partnerOrder: StoreId[] = ['eapteka', '4lapy', 'shokoladnitsa', 'lenta'];

export type ProductId = 'milk' | 'ice' | 'cookie' | 'nurofen' | 'toy' | 'combo' | 'buckwheat';

export type Product = {
  id: ProductId;
  store: StoreId;
  price: number;
  image: string;
  /** Name on the product card in the collection. */
  title: string;
  /** Name in the cart row. */
  cartTitle: string;
  /** Weight or pack size under the name. */
  amount: string;
  /** Green hint after the amount ("для хвостиков", "привезём горячим"). */
  hint?: string;
  /** Partner delivery block on the product sheet; Самокат products have none. */
  detail?: {
    delivery: string;
    note: string;
  };
};

export const products: Record<ProductId, Product> = {
  milk: {
    id: 'milk',
    store: 'samokat',
    price: 149,
    image: asset('products/milk.jpg'),
    title: 'Молоко Самокат, 1,8%, без лактозы, ультрапастеризованное',
    cartTitle: 'Молоко Самокат, 1,8%, без лактозы, 975 мл',
    amount: '975 мл',
  },
  ice: {
    id: 'ice',
    store: 'samokat',
    price: 159,
    image: asset('products/ice.jpg'),
    title: 'Пломбир Самокат, с пробиотиками, в вафельном стаканчике',
    cartTitle: 'Пломбир Самокат, с пробиотиками, 80 г',
    amount: '80 г',
  },
  cookie: {
    id: 'cookie',
    store: 'samokat',
    price: 115,
    image: asset('products/cookie.jpg'),
    title: 'Печенье Самокат, 27% протеина, с манго, 40 г',
    cartTitle: 'Печенье Самокат, 27% протеина, с манго, 40 г',
    amount: '40 г',
  },
  nurofen: {
    id: 'nurofen',
    store: 'eapteka',
    price: 389,
    image: asset('products/nurofen.jpg'),
    title: 'Нурофен Экспресс, 200 мг, 20 таблеток',
    cartTitle: 'Нурофен Экспресс, 200 мг, 20 таблеток',
    amount: '20 шт',
    detail: {
      delivery: 'Привезёт еАптека, около 10 минут',
      note: 'Это партнёрский товар. Срок доставки отличается от Самоката, остальное в заказе приедет как обычно.',
    },
  },
  toy: {
    id: 'toy',
    store: '4lapy',
    price: 549,
    image: asset('products/toy.jpg'),
    title: 'Игрушка для собак «Лиса» с канатом',
    cartTitle: 'Игрушка для собак «Лиса» с канатом',
    amount: '1 шт',
    hint: 'для хвостиков',
    detail: {
      delivery: 'Привезёт 4 лапы, около часа',
      note: 'Это партнёрский товар. Срок доставки отличается от Самоката, остальное в заказе приедет как обычно.',
    },
  },
  combo: {
    id: 'combo',
    store: 'shokoladnitsa',
    price: 690,
    image: asset('products/combo.jpg'),
    title: 'Комбо: паста карбонара, салат и капучино',
    cartTitle: 'Комбо: паста карбонара, салат и капучино',
    amount: '650 г',
    hint: 'привезём горячим',
    detail: {
      delivery: 'Привезёт Шоколадница, около часа',
      note: 'Блюда готовят после заказа. Остальное из Самоката приедет раньше, ждать комбо не нужно.',
    },
  },
  buckwheat: {
    id: 'buckwheat',
    store: 'lenta',
    price: 119,
    image: asset('products/buckwheat.jpg'),
    title: 'Гречневая крупа Лента, 800 г',
    cartTitle: 'Гречневая крупа Лента, 800 г',
    amount: '800 г',
    detail: {
      delivery: 'Привезёт Лента, от 3 часов',
      note: 'Это партнёрский товар. Срок доставки отличается от Самоката, остальное в заказе приедет как обычно.',
    },
  },
};

/** Order of cards in «Подборка на вечер». */
export const collection: ProductId[] = ['milk', 'nurofen', 'toy', 'ice', 'buckwheat', 'combo'];

/** Order of rows inside the cart. */
export const cartOrder: ProductId[] = ['milk', 'ice', 'cookie', 'nurofen', 'toy', 'combo', 'buckwheat'];

/**
 * Starting cart: everything from the Figma cart except the two products that
 * have their own product sheet. Adding Нурофен and the combo from those sheets
 * brings the cart to exactly the Figma state (2 065 ₽ with bonuses).
 */
export const initialCart: Partial<Record<ProductId, number>> = {
  milk: 1,
  ice: 1,
  cookie: 1,
  toy: 1,
  buckwheat: 1,
};

export const cartCopy = {
  address: 'Зеленоград, к828',
  leaveAtDoor: 'Оставить у двери',
  orderForOther: 'Заказать другому',
  samokatTitle: 'Доставка 15 минут',
  packing: 'Сборка и упаковка',
  packingPrice: 49,
  partnersTitle: 'От партнёров',
  partnersNote: 'Приедут отдельно. Срок доставки у каждого свой, оплата одна на всё.',
  promoTitle: 'Скидка или промокод',
  promoNote: 'Один промокод на все товары, в том числе от партнёров',
  promoBadge: 'Весь заказ',
  bonusTitle: 'СберСпасибо',
  bonusNote: '154 бонуса, спишем всё на весь заказ, включая партнёров',
  bonusAmount: 154,
  payment: 'Оплата SberPay ••• 5801',
  totalWithBonus: 'Итого, со скидкой 154 ₽',
  total: 'Итого',
  cta: 'Перейти к оформлению',
  footnote: 'Бонусы и промокод действуют на всю корзину, ничего считать по магазинам не нужно',
  emptyCta: 'К товарам',
};

const NBSP = '\u00a0';

/** "2 065 ₽" with non-breaking spaces, as in the frames. */
export const formatPrice = (value: number) =>
  `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)}${NBSP}₽`;
