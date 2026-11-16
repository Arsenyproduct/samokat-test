import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { BONUS, PRICE, SET_FULL, SET_PRICE, type FlavorId } from './data';

export type CartSet = { id: string; flavors: FlavorId[]; qty: number };

export type State = {
  singles: Record<FlavorId, number>;
  /** Single bars in the order they were added: the tray of the card shows the last ones */
  units: FlavorId[];
  sets: CartSet[];
  leaveAtDoor: boolean;
  forOther: boolean;
  useBonus: boolean;
  favorites: FlavorId[];
};

type Action =
  | { type: 'single'; flavor: FlavorId; delta: 1 | -1 }
  | { type: 'addSet'; id: string; flavors: FlavorId[] }
  /** The last `take` single bars and the chosen third become one set */
  | { type: 'merge'; id: string; flavors: FlavorId[]; take: number }
  | { type: 'setQty'; id: string; delta: 1 | -1 }
  | { type: 'replace'; id: string; index: number; flavor: FlavorId }
  | { type: 'toggle'; key: 'leaveAtDoor' | 'forOther' | 'useBonus' }
  | { type: 'favorite'; flavor: FlavorId };

const initial: State = {
  singles: { les: 0, arahis: 0, bel: 0 },
  units: [],
  sets: [],
  leaveAtDoor: true,
  forOther: false,
  // Bonuses are off until the buyer turns them on
  useBonus: false,
  favorites: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'single': {
      if (action.delta > 0) {
        return {
          ...state,
          singles: { ...state.singles, [action.flavor]: state.singles[action.flavor] + 1 },
          units: [...state.units, action.flavor],
        };
      }
      const at = state.units.lastIndexOf(action.flavor);
      if (at < 0) return state;
      return {
        ...state,
        singles: { ...state.singles, [action.flavor]: state.singles[action.flavor] - 1 },
        units: state.units.filter((_, i) => i !== at),
      };
    }
    case 'merge': {
      const taken = state.units.slice(state.units.length - action.take);
      const singles = { ...state.singles };
      taken.forEach((f) => (singles[f] -= 1));
      return {
        ...state,
        singles,
        units: state.units.slice(0, state.units.length - action.take),
        sets: [...state.sets, { id: action.id, flavors: action.flavors, qty: 1 }],
      };
    }
    case 'addSet': {
      if (state.sets.some((s) => s.id === action.id)) {
        return { ...state, sets: state.sets.map((s) => (s.id === action.id ? { ...s, qty: s.qty + 1 } : s)) };
      }
      return { ...state, sets: [...state.sets, { id: action.id, flavors: action.flavors, qty: 1 }] };
    }
    case 'setQty':
      return {
        ...state,
        sets: state.sets
          .map((s) => (s.id === action.id ? { ...s, qty: s.qty + action.delta } : s))
          .filter((s) => s.qty > 0),
      };
    case 'replace':
      return {
        ...state,
        sets: state.sets.map((s) =>
          s.id === action.id ? { ...s, flavors: s.flavors.map((f, i) => (i === action.index ? action.flavor : f)) } : s,
        ),
      };
    case 'toggle':
      return { ...state, [action.key]: !state[action.key] };
    case 'favorite':
      return {
        ...state,
        favorites: state.favorites.includes(action.flavor)
          ? state.favorites.filter((f) => f !== action.flavor)
          : [...state.favorites, action.flavor],
      };
  }
}

/** Singles count towards the same «3 по цене 2»: every third bar is free. */
export function singlesTotals(singles: Record<FlavorId, number>) {
  const count = singles.les + singles.arahis + singles.bel;
  const free = Math.floor(count / 3);
  return { count, free, paid: (count - free) * PRICE };
}

export function totals(state: State) {
  const s = singlesTotals(state.singles);
  const setsQty = state.sets.reduce((sum, set) => sum + set.qty, 0);
  const items = setsQty * SET_PRICE + s.paid;
  const promo = setsQty * (SET_FULL - SET_PRICE) + s.free * PRICE;
  const bonus = state.useBonus ? Math.min(BONUS, items) : 0;
  return {
    items,
    promo,
    bonus,
    discount: promo + bonus,
    total: items > 0 ? items + 49 - bonus : 0,
    lines: setsQty + s.count,
  };
}

type Store = { state: State; dispatch: (action: Action) => void };
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('StoreProvider is missing');
  return store;
}
