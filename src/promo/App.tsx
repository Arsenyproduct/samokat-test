import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
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

/* Timeline of «Добавить за 178 ₽» */
const SHEET_AWAY = 240; // the set sheet slides down
const SPREAD = 880; // two bars slide out from under the middle one
const FLIGHT = 560; // the set flies into the add bar

function Flow({ phone }: { phone: boolean }) {
  const { state, dispatch } = useStore();
  const [product, setProduct] = useState<ProductView | null>(null);
  const [sheet, setSheet] = useState<SetSheetView | null>(null);
  const [sheetSetId, setSheetSetId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [flying, setFlying] = useState(false);
  const [tooltipClosed, setTooltipClosed] = useState(false);
  const timers = useRef<number[]>([]);
  const counter = useRef(0);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const openProduct = (flavor: FlavorId) =>
    setProduct({ flavor, mode: 'single', setId: null, setFlavors: defaultSet(flavor) });

  const openNewSet = (flavor: FlavorId) => {
    setSheetSetId(null);
    setSheet({ context: 'new', flavors: defaultSet(flavor), view: 'positions', index: 0 });
  };

  /** The flight from the photo, then the set lands in the cart */
  const flyIntoCart = useCallback((flavors: FlavorId[]) => {
    counter.current += 1;
    const id = `set-${counter.current}`;
    setFlying(true);
    setProduct((p) => (p ? { ...p, mode: 'set', setId: id, setFlavors: flavors } : p));
    later(() => {
      dispatch({ type: 'addSet', id, flavors });
      setFlying(false);
    }, FLIGHT - 80);
  }, [dispatch]);

  const addNewSet = () => {
    if (!sheet || !product) return;
    const flavors = sheet.flavors;
    setSheet(null);
    // The card turns into the set: text and photo change, the bars spread out
    later(() => setProduct((p) => (p ? { ...p, mode: 'set', setId: null, setFlavors: flavors } : p)), SHEET_AWAY);
    later(() => flyIntoCart(flavors), SHEET_AWAY + SPREAD);
  };

  // The sheet keeps its own copy of the flavours; a set in the cart changes in the store
  const replaceInSheet = (index: number, flavor: FlavorId) => {
    if (sheetSetId) dispatch({ type: 'replace', id: sheetSetId, index, flavor });
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
        onOpen={openProduct}
        onOpenSet={() => {
          openProduct('les');
          later(() => openNewSet('les'), 260);
        }}
        onCart={() => setCartOpen(true)}
      />
      <Product
        view={product}
        flying={flying}
        tooltip={!tooltipClosed}
        onCloseTooltip={() => setTooltipClosed(true)}
        onClose={() => {
          setProduct(null);
          setSheet(null);
        }}
        onFlavor={(flavor) => setProduct((p) => (p ? { ...p, flavor, setFlavors: defaultSet(flavor) } : p))}
        onOpenSet={() => product && openNewSet(product.flavor)}
        onEditSetFlavor={(index) => {
          if (!product) return;
          const id = product.setId && state.sets.some((x) => x.id === product.setId) ? product.setId : null;
          setSheetSetId(id);
          setSheet({ context: id ? 'cart' : 'new', flavors: product.setFlavors, view: 'replace', index, direct: true });
        }}
        onAddSetAgain={() => product && flyIntoCart(product.setFlavors)}
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
          replaceInSheet(index, flavor);
          // The card shows the same set while it is open
          setProduct((p) =>
            p && p.mode === 'set' ? { ...p, setFlavors: p.setFlavors.map((f, i) => (i === index ? flavor : f)) } : p,
          );
        }}
        onPrimary={() => (sheet?.context === 'new' ? addNewSet() : setSheet(null))}
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
