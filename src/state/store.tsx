import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { cartCopy, initialCart, products, type ProductId, type StoreId } from '../data/catalog';
import { DEFAULT_SCENARIO, type ScenarioId } from '../data/delivery';

export type Cart = Partial<Record<ProductId, number>>;

type PersistedState = {
  cart: Cart;
  favorites: ProductId[];
  leaveAtDoor: boolean;
  orderForOther: boolean;
  useBonus: boolean;
  scenario: ScenarioId;
  /** Scenario the order was paid with; drives the tracking screen. */
  paidScenario: ScenarioId | null;
  /** Tracking time already run, ms. It pauses while the order change screens are open. */
  trackBase: number;
  /** When the tracking clock last started running (ms since epoch); null while paused. */
  trackRunningSince: number | null;
  /** Answer to the delay proposal on tracking. */
  delayDecision: DelayDecision;
};

export type DelayDecision = 'merged' | 'kept' | null;

type Store = PersistedState & {
  add: (id: ProductId) => void;
  remove: (id: ProductId) => void;
  toggleFavorite: (id: ProductId) => void;
  setLeaveAtDoor: (value: boolean) => void;
  setOrderForOther: (value: boolean) => void;
  setUseBonus: (value: boolean) => void;
  setScenario: (value: ScenarioId) => void;
  /** Pays the order; `scenario` overrides the slider (single-store orders have no slider). */
  pay: (scenario?: ScenarioId) => void;
  /** Runs the tracking clock (tracking screen is open). */
  resumeTracking: () => void;
  /** Freezes the tracking clock (order change screens are open). */
  pauseTracking: () => void;
  setDelayDecision: (value: DelayDecision) => void;
  /** Replaces the order contents after «Сохранить изменения». */
  setCart: (cart: Cart) => void;
  /** Cancels the whole order: the prototype starts over with the initial cart. */
  cancelOrder: () => void;
  /** Sum of the items only, as on the cart button in the catalog. */
  itemsTotal: number;
  /** Goods + packing, before bonuses and delivery. */
  goodsTotal: number;
  /** What the cart and the «Всё сразу» checkout show: goods minus bonuses. */
  cartTotal: number;
  storesInCart: Set<StoreId>;
  itemCount: number;
};

const STORAGE_KEY = 'samokat-prototype';

const defaults: PersistedState = {
  cart: initialCart,
  favorites: [],
  leaveAtDoor: true,
  orderForOther: false,
  useBonus: true,
  scenario: DEFAULT_SCENARIO,
  paidScenario: null,
  trackBase: 0,
  trackRunningSince: null,
  delayDecision: null,
};

function load(): PersistedState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...(JSON.parse(raw) as Partial<PersistedState>) };
  } catch {
    return defaults;
  }
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(load);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable in private mode; the prototype still works in memory.
    }
  }, [state]);

  const add = useCallback((id: ProductId) => {
    setState((s) => ({ ...s, cart: { ...s.cart, [id]: (s.cart[id] ?? 0) + 1 } }));
  }, []);

  const remove = useCallback((id: ProductId) => {
    setState((s) => {
      const next = { ...s.cart };
      const count = (next[id] ?? 0) - 1;
      if (count > 0) next[id] = count;
      else delete next[id];
      return { ...s, cart: next };
    });
  }, []);

  const toggleFavorite = useCallback((id: ProductId) => {
    setState((s) => ({
      ...s,
      favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id],
    }));
  }, []);

  const value = useMemo<Store>(() => {
    const entries = Object.entries(state.cart) as [ProductId, number][];
    const goods = entries.reduce((sum, [id, count]) => sum + products[id].price * count, 0);
    const itemCount = entries.reduce((sum, [, count]) => sum + count, 0);
    const goodsTotal = itemCount > 0 ? goods + cartCopy.packingPrice : 0;
    const bonus = state.useBonus && itemCount > 0 ? Math.min(cartCopy.bonusAmount, goodsTotal) : 0;
    return {
      ...state,
      add,
      remove,
      toggleFavorite,
      setLeaveAtDoor: (leaveAtDoor) => setState((s) => ({ ...s, leaveAtDoor })),
      setOrderForOther: (orderForOther) => setState((s) => ({ ...s, orderForOther })),
      setUseBonus: (useBonus) => setState((s) => ({ ...s, useBonus })),
      setScenario: (scenario) => setState((s) => ({ ...s, scenario })),
      pay: (scenario) =>
        setState((s) => ({
          ...s,
          paidScenario: scenario ?? s.scenario,
          trackBase: 0,
          trackRunningSince: Date.now(),
          delayDecision: null,
        })),
      resumeTracking: () => setState((s) => (s.trackRunningSince === null ? { ...s, trackRunningSince: Date.now() } : s)),
      pauseTracking: () =>
        setState((s) =>
          s.trackRunningSince === null
            ? s
            : { ...s, trackBase: s.trackBase + Date.now() - s.trackRunningSince, trackRunningSince: null },
        ),
      setDelayDecision: (delayDecision) => setState((s) => ({ ...s, delayDecision })),
      setCart: (cart) => setState((s) => ({ ...s, cart })),
      cancelOrder: () =>
        setState((s) => ({ ...s, cart: initialCart, paidScenario: null, trackBase: 0, trackRunningSince: null, delayDecision: null })),
      itemsTotal: goods,
      goodsTotal,
      cartTotal: goodsTotal - bonus,
      storesInCart: new Set(entries.map(([id]) => products[id].store)),
      itemCount,
    };
  }, [state, add, remove, toggleFavorite]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
