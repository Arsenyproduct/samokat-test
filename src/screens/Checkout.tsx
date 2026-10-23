import { useEffect, useRef, useState } from 'react';
import { formatPrice, products, stores } from '../data/catalog';
import { checkoutCopy, scenarios } from '../data/delivery';
import { DeliverySlider } from '../components/DeliverySlider';
import { OrderSettings } from '../components/OrderSettings';
import { Button, IconButton, LOADING_MS, Skeleton, StatusBar, StoreLogo, useEnterLoading } from '../components/ui';
import { useFlip } from '../components/useFlip';
import { useRouter } from '../state/router';
import { useStore } from '../state/store';
import { buildTrips, latestTime, type BuiltTrip } from '../state/trips';
import { Screen, screenStyles } from './Screen';
import s from './Checkout.module.css';

/** Same box as the trip card (14 + 28 + 10 + 44 + 14, plus the note chip). */
function TripSkeleton({ trip }: { trip: BuiltTrip }) {
  return (
    <div className={`${s.card} ${s.skeleton}`} style={{ height: trip.note ? 146 : 110 }} aria-hidden="true">
      <Skeleton width={150} height={16} radius={6} />
      <Skeleton width={110} height={12} radius={6} />
      <Skeleton width="100%" height={6} radius={3} />
    </div>
  );
}

function TripCard({ trip }: { trip: BuiltTrip }) {
  return (
    <div className={`${s.card} ${s.trip}`}>
      <div className={s.tripHead}>
        <span className="t-num-24">{trip.time}</span>
        <span className={`t-body-s ${s.tripStores}`}>{trip.stores.map((id) => stores[id].name).join(', ')}</span>
        <span className={s.logos}>
          {trip.stores.map((id) => (
            <StoreLogo key={id} store={id} size={21} />
          ))}
        </span>
      </div>
      <div className={s.thumbs}>
        {trip.productIds.map((id) => (
          <img key={id} data-flip={id} className={s.thumb} src={products[id].image} alt={products[id].cartTitle} />
        ))}
      </div>
      {trip.note && <span className={`t-caption ${s.note}`}>{trip.note}</span>}
    </div>
  );
}

export function Checkout() {
  const { navigate, back } = useRouter();
  const { cart, scenario, setScenario, cartTotal, pay } = useStore();
  const loading = useEnterLoading();
  const [paying, setPaying] = useState(false);
  const tripsRef = useRef<HTMLDivElement>(null);

  const current = scenarios[scenario];
  const trips = buildTrips(scenario, cart);
  const total = cartTotal + current.delivery;

  useFlip(tripsRef, loading ? 'loading' : scenario);

  useEffect(() => {
    if (!paying) return;
    const timer = window.setTimeout(() => {
      pay();
      navigate({ name: 'tracking' });
    }, LOADING_MS);
    return () => window.clearTimeout(timer);
  }, [paying, pay, navigate]);

  return (
    <Screen label={checkoutCopy.title}>
      <div className={screenStyles.scroll}>
        <div className={screenStyles.header}>
          <IconButton icon="back" label="Назад" className={screenStyles.headerBack} onClick={back} />
          <h1 className={screenStyles.headerTitle}>{checkoutCopy.title}</h1>
        </div>

        <div className={s.content}>
          <section className={`${s.card} ${s.how}`}>
            <h2 className="t-h1">{checkoutCopy.question}</h2>
            <p className={`t-body-s ${s.muted}`}>{checkoutCopy.hint}</p>
            <DeliverySlider value={scenario} onChange={setScenario} />
            <div className={s.stats} aria-live="polite">
              <div className={s.stat}>
                <span key={trips.length} className={`t-num-20 ${s.statValue}`}>
                  {trips.length}
                </span>
                <span className={`t-caption ${s.muted}`}>{checkoutCopy.arrivalsLabel(trips.length)}</span>
              </div>
              <div className={s.stat}>
                <span key={latestTime(trips)} className={`t-num-20 ${s.statValue}`}>
                  {latestTime(trips)}
                </span>
                <span className={`t-caption ${s.muted}`}>{checkoutCopy.lastLabel}</span>
              </div>
              <div className={s.stat}>
                <span key={current.delivery} className={`t-num-20 ${s.statValue}`}>
                  {formatPrice(current.delivery)}
                </span>
                <span className={`t-caption ${s.muted}`}>{checkoutCopy.deliveryLabel}</span>
              </div>
            </div>
          </section>

          <div className={s.trips} ref={tripsRef} aria-busy={loading}>
            {trips.map((trip) => (loading ? <TripSkeleton key={trip.id} trip={trip} /> : <TripCard key={trip.id} trip={trip} />))}
          </div>

          <OrderSettings variant="checkout" promoNote={checkoutCopy.promoNote} bonusNote={checkoutCopy.bonusNote} />

          <section className={`${s.card} ${s.total}`}>
            <p className={`t-body-m ${s.muted}`}>{checkoutCopy.total}</p>
            <p className={`t-price-xl ${s.totalValue}`}>{formatPrice(total)}</p>
            <Button loading={paying} onClick={() => setPaying(true)}>
              {checkoutCopy.pay}
            </Button>
          </section>
        </div>
      </div>
      <StatusBar tone="dark" background="var(--bg-page)" />
    </Screen>
  );
}
