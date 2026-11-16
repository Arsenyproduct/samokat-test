import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { defaultSet, type FlavorId } from './data';
import { StoreProvider, useStore } from './store';
import { Catalog } from './Catalog';
import { Product, type ProductView } from './Product';
import { SetSheet, type SetSheetView } from './SetSheet';
import { Cart } from './Cart';
import { StatusBar } from './ui';
import stage from './Stage.module.css';

const DEVICE_W = 390;
const DEVICE_H = 844;

/* Timeline of «Добавить за 178 ₽» on the set card */
const FLIGHT = 560; // the set flies from the photo into the add bar
const TO_CART = 260; // the card slides away, the cart comes up

function Flow({ phone }: { phone: boolean }) {
  const { state, dispatch } = useStore();
  const [product, setProduct] = useState<ProductView | null>(null);
  const [sheet, setSheet] = useState<SetSheetView | null>(null);
  const [sheetSetId, setSheetSetId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [flying, setFlying] = useState(false);
  const timers = useRef<number[]>([]);
  const counter = useRef(0);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const nextId = () => {
    counter.current += 1;
    return `set-${counter.current}`;
  };

  const openProduct = (flavor: FlavorId, mode: ProductView['mode'] = 'single') =>
    setProduct({ flavor, mode, setFlavors: defaultSet(flavor) });

  /** Card → cart: the card goes down, the cart comes up */
  const toCart = () => {
    setSheet(null);
    setProduct(null);
    later(() => setCartOpen(true), TO_CART);
  };

  /** Сценарий 1: «Добавить за 178 ₽» on the set card */
  const addFromCard = () => {
    if (!product || flying) return;
    const flavors = product.setFlavors;
    setFlying(true);
    later(() => {
      dispatch({ type: 'addSet', id: nextId(), flavors });
      setFlying(false);
      toCart();
    }, FLIGHT);
  };

  /** Сценарий 2: the bars from the tray and the chosen third become one set */
  const buildSet = () => {
    if (!sheet) return;
    const flavors = sheet.flavors.filter((f): f is FlavorId => f !== null);
    const take = state.units.length % 3;
    dispatch({ type: 'merge', id: nextId(), flavors, take });
    toCart();
  };

  // A sheet over a cart set follows the set in the store
  const cartSet = sheetSetId ? state.sets.find((x) => x.id === sheetSetId) : undefined;
  const sheetView = sheet && cartSet ? { ...sheet, flavors: cartSet.flavors } : sheet;
  useEffect(() => {
    if (sheet && sheetSetId && !cartSet) setSheet(null);
  }, [sheet, sheetSetId, cartSet]);

  const statusLight = product !== null || cartOpen;

  return (
    <>
      <Catalog
        hidden={product !== null || cartOpen}
        onOpen={(flavor) => openProduct(flavor)}
        onOpenSet={() => {
          // «3 любых вкуса»: the card opens and turns into the set
          openProduct('les');
          later(() => setProduct((p) => (p ? { ...p, mode: 'set' } : p)), 420);
        }}
        onCart={() => setCartOpen(true)}
      />
      <Product
        view={product}
        flying={flying}
        onClose={() => {
          setProduct(null);
          setSheet(null);
        }}
        onFlavor={(flavor) => setProduct((p) => (p ? { ...p, flavor, setFlavors: defaultSet(flavor) } : p))}
        onShowSet={() => setProduct((p) => (p ? { ...p, mode: 'set' } : p))}
        onEditSetFlavor={(index) => {
          if (!product) return;
          setSheetSetId(null);
          setSheet({ context: 'card', flavors: product.setFlavors, view: 'replace', index, direct: true });
        }}
        onAddSet={addFromCard}
        onBuildSet={() => {
          const rest = state.units.length % 3;
          const picked = state.units.slice(state.units.length - rest);
          const flavors: (FlavorId | null)[] = [...picked, ...Array<null>(3 - picked.length).fill(null)];
          setSheetSetId(null);
          setSheet({ context: 'build', flavors, view: 'positions', index: 0 });
        }}
      />
      <Cart
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onReplaceFlavor={(id, index) => {
          const set = state.sets.find((x) => x.id === id);
          if (!set) return;
          setSheetSetId(id);
          setSheet({ context: 'cart', flavors: set.flavors, view: 'replace', index, direct: true });
        }}
        onOpenSet={(id) => {
          const set = state.sets.find((x) => x.id === id);
          if (!set) return;
          setSheetSetId(id);
          setSheet({ context: 'cart', flavors: set.flavors, view: 'positions', index: 0 });
        }}
      />
      <SetSheet
        sheet={sheetView}
        onChange={setSheet}
        onReplace={(index, flavor) => {
          if (sheet?.context === 'cart' && sheetSetId) dispatch({ type: 'replace', id: sheetSetId, index, flavor });
          // The set card shows the new flavour right away
          if (sheet?.context === 'card') {
            setProduct((p) => (p ? { ...p, setFlavors: p.setFlavors.map((f, i) => (i === index ? flavor : f)) } : p));
          }
        }}
        onPrimary={() => (sheet?.context === 'build' ? buildSet() : setSheet(null))}
        onClose={() => setSheet(null)}
      />
      {/* A phone has its own status bar */}
      {!phone && <StatusBar light={statusLight} dim={sheet !== null} />}
    </>
  );
}

/**
 * Desktop: the 390×844 device fits the stage. Phone: the 390-wide layout is
 * scaled to the screen width and is as tall as the screen.
 */
function useDevice(introRef: RefObject<HTMLDivElement | null>) {
  const [device, setDevice] = useState({ scale: 1, height: DEVICE_H, phone: false });
  useLayoutEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w <= 480) {
        const scale = w / DEVICE_W;
        setDevice({ scale, height: h / scale, phone: true });
        document.documentElement.style.setProperty('--device-scale', String(scale));
        return;
      }
      const stacked = w <= 1100;
      const introHeight = stacked ? (introRef.current?.offsetHeight ?? 0) + 28 : 0;
      const free = h - 48 - introHeight - (stacked ? 16 : 0);
      setDevice({ scale: Math.max(0.5, Math.min(1, free / DEVICE_H, (w - 48) / DEVICE_W)), height: DEVICE_H, phone: false });
    };
    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, [introRef]);
  return device;
}

export function App() {
  const introRef = useRef<HTMLDivElement>(null);
  const { scale, height, phone } = useDevice(introRef);
  return (
    <StoreProvider>
      <main className={stage.stage}>
        <div className={stage.intro} ref={introRef}>
          <h1 className={stage.introTitle}>3 по цене 2</h1>
          <p className={stage.introText}>
            Snickers: любые три вкуса за 178 ₽. Каталог, карточка с набором, замена вкусов и корзина.
          </p>
        </div>
        <div className={stage.deviceBox} style={{ width: DEVICE_W * scale, height: height * scale }}>
          <div
            className={stage.device}
            data-device
            style={{ height, transform: scale === 1 ? undefined : `scale(${scale})` }}
          >
            <Flow phone={phone} />
          </div>
        </div>
      </main>
    </StoreProvider>
  );
}
