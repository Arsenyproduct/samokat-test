import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ProductId } from '../data/catalog';

export type Route =
  | { name: 'home' }
  | { name: 'story' }
  | { name: 'catalog' }
  | { name: 'collection' }
  | { name: 'product'; id: ProductId }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'tracking' };

const productIds: ProductId[] = ['milk', 'ice', 'cookie', 'nurofen', 'toy', 'combo', 'buckwheat'];

export function routeToHash(route: Route) {
  return route.name === 'product' ? `#/product/${route.id}` : `#/${route.name}`;
}

export function parseHash(hash: string): Route {
  const [name, id] = hash.replace(/^#\/?/, '').split('/');
  switch (name) {
    case 'story':
    case 'catalog':
    case 'collection':
    case 'cart':
    case 'checkout':
    case 'tracking':
      return { name };
    case 'product':
      return productIds.includes(id as ProductId) ? { name: 'product', id: id as ProductId } : { name: 'collection' };
    default:
      return { name: 'home' };
  }
}

/** Where the in-app back button leads when there is no history to go back to (opened by link). */
function parentOf(route: Route): Route {
  switch (route.name) {
    case 'story':
    case 'catalog':
      return { name: 'home' };
    case 'collection':
      return { name: 'catalog' };
    case 'product':
    case 'cart':
      return { name: 'collection' };
    case 'checkout':
      return { name: 'cart' };
    default:
      return { name: 'home' };
  }
}

type HistoryState = { depth: number };

const readDepth = () => (window.history.state as HistoryState | null)?.depth ?? 0;

type Router = {
  route: Route;
  /** Navigation direction of the last change, for the enter animation. */
  direction: 'forward' | 'back';
  navigate: (to: Route, options?: { replace?: boolean }) => void;
  back: () => void;
};

const RouterContext = createContext<Router | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const [direction, setDirection] = useState<Router['direction']>('forward');
  const depthRef = useRef(readDepth());

  useEffect(() => {
    if (window.history.state === null) {
      window.history.replaceState({ depth: 0 } satisfies HistoryState, '', window.location.hash || '#/home');
    }
    depthRef.current = readDepth();
    const sync = () => {
      const nextDepth = readDepth();
      setDirection(nextDepth < depthRef.current ? 'back' : 'forward');
      depthRef.current = nextDepth;
      setRoute(parseHash(window.location.hash));
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const navigate = useCallback<Router['navigate']>((to, options) => {
    const depth = readDepth();
    if (options?.replace) {
      window.history.replaceState({ depth } satisfies HistoryState, '', routeToHash(to));
    } else {
      window.history.pushState({ depth: depth + 1 } satisfies HistoryState, '', routeToHash(to));
    }
    depthRef.current = readDepth();
    setDirection('forward');
    setRoute(to);
  }, []);

  const back = useCallback(() => {
    if (readDepth() > 0) {
      window.history.back();
      return;
    }
    const parent = parentOf(parseHash(window.location.hash));
    window.history.replaceState({ depth: 0 } satisfies HistoryState, '', routeToHash(parent));
    setDirection('back');
    setRoute(parent);
  }, []);

  const value = useMemo(() => ({ route, direction, navigate, back }), [route, direction, navigate, back]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const router = useContext(RouterContext);
  if (!router) throw new Error('useRouter must be used inside RouterProvider');
  return router;
}
