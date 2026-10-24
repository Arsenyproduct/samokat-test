import { useLayoutEffect, useRef, useState } from 'react';
import { RouterProvider, routeToHash, useRouter } from './state/router';
import { StoreProvider } from './state/store';
import { Home } from './screens/Home';
import { Catalog } from './screens/Catalog';
import { Collection } from './screens/Collection';
import { ProductSheet } from './screens/Product';
import { Cart } from './screens/Cart';
import { Checkout } from './screens/Checkout';
import { Tracking } from './screens/Tracking';
import { EditOrder } from './screens/EditOrder';
import { EditItems } from './screens/EditItems';
import { CancelBlocked, Cancelled } from './screens/OrderResult';
import s from './App.module.css';

const DEVICE_W = 390;
const DEVICE_H = 844;

function Screens() {
  const { route } = useRouter();
  // The key remounts a screen on every route change, so enter animations and
  // the 300 ms skeletons run each time a screen opens.
  const key = routeToHash(route);
  switch (route.name) {
    case 'home':
    case 'story':
      // One screen for both: the story opens and closes as a transition of the home.
      return <Home key="home" />;
    case 'catalog':
      return <Catalog key={key} />;
    case 'collection':
      return <Collection key={key} />;
    case 'product':
      return <ProductSheet key={key} id={route.id} />;
    case 'cart':
      return <Cart key={key} />;
    case 'checkout':
      return <Checkout key={key} />;
    case 'tracking':
      return <Tracking key={key} />;
    case 'edit':
      return <EditOrder key={key} />;
    case 'cancel':
      return <EditOrder key={key} cancelOpen />;
    case 'edit-items':
      return <EditItems key={key} />;
    case 'cancel-blocked':
      return <CancelBlocked key={key} />;
    case 'cancelled':
      return <Cancelled key={key} />;
  }
}

/** Fits the 390×844 device into the free space of the stage on desktop. */
function useDeviceScale(introRef: React.RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w <= 480) {
        setScale(1);
        return;
      }
      const stacked = w <= 1100;
      const introHeight = stacked ? (introRef.current?.offsetHeight ?? 0) + 28 : 0;
      const free = h - 48 - introHeight - (stacked ? 16 : 0);
      setScale(Math.max(0.5, Math.min(1, free / DEVICE_H, (w - 48) / DEVICE_W)));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [introRef]);
  return scale;
}

export function App() {
  const introRef = useRef<HTMLDivElement>(null);
  const scale = useDeviceScale(introRef);

  return (
    <StoreProvider>
      <RouterProvider>
        <main className={s.stage}>
          <div className={s.intro} ref={introRef}>
            <h1 className={s.introTitle}>Самокат, тестовое задание</h1>
            <p className={s.introText}>
              Одна корзина для нескольких магазинов с разным сроком доставки. Прототип сценария «Ползунок»: от главной
              и каталога до трекинга и задержки.
            </p>
          </div>
          <div className={s.deviceBox} style={{ width: DEVICE_W * scale, height: DEVICE_H * scale }}>
            <div className={s.device} style={{ transform: scale === 1 ? undefined : `scale(${scale})` }}>
              <Screens />
            </div>
          </div>
        </main>
      </RouterProvider>
    </StoreProvider>
  );
}
