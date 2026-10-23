import { useEffect, useRef, useState } from 'react';
import { stores, type StoreId } from '../data/catalog';
import { delayCopy, scenarios, trackingCopy, type TrackRow } from '../data/delivery';
import { DeliverySlider } from '../components/DeliverySlider';
import { Icon } from '../components/Icon';
import { TrackingMap } from '../components/TrackingMap';
import { Button, Grabber, Skeleton, StatusBar, StoreLogo, useEnterLoading } from '../components/ui';
import { useFlip } from '../components/useFlip';
import { useStore } from '../state/store';
import { Screen, screenStyles } from './Screen';
import s from './Tracking.module.css';

const TICK_MS = 500;

type Decision = 'merged' | 'kept' | null;

/**
 * When a row arrives, in ms after tracking opens. Later ETAs arrive later, but
 * the whole order is delivered within about half a minute so the screen keeps moving.
 */
function arrivalMs(time: string) {
  const [h = 0, m = 0] = time.split(':').map(Number);
  const minutes = Math.max(1, h * 60 + m - (14 * 60 + 16));
  return 8000 + Math.sqrt(minutes) * 1600;
}

/** Share of the way already driven, 0..1. */
function shareOf(row: TrackRow, elapsed: number) {
  return Math.min(1, elapsed / arrivalMs(row.time));
}

function progressOf(row: TrackRow, elapsed: number) {
  const start = row.progress[0];
  return start + (1 - start) * shareOf(row, elapsed);
}

function chipOf(row: TrackRow, elapsed: number) {
  if (!row.chip) return null;
  if (row.chip.kind === 'static') return { text: row.chip.text, tone: row.chip.tone };
  const minutes = Math.max(1, Math.ceil(row.chip.from * (1 - shareOf(row, elapsed))));
  return { text: `${minutes} мин`, tone: 'green' as const };
}

function TrackRowCard({ row, elapsed, inCart, isNew }: { row: TrackRow; elapsed: number; inCart: Set<StoreId>; isNew: boolean }) {
  const title = row.title ?? row.stores.filter((id) => inCart.has(id)).map((id) => stores[id].name).join(', ');
  const delivered = shareOf(row, elapsed) >= 1;
  const chip = chipOf(row, elapsed);
  return (
    <div className={`${s.row} ${isNew ? s.rowNew : screenStyles.reveal}`} data-flip={row.id}>
      <div className={s.rowHead}>
        <div className={s.rowStore}>
          <StoreLogo store={row.logo} size={17} />
          <span className="t-h3">{title}</span>
        </div>
        {!delivered && <span className="t-num-17">{row.time}</span>}
      </div>
      {delivered ? (
        <div className={`${s.rowStatus} ${s.delivered}`}>
          <span className={`${s.chip} ${s.green}`}>{trackingCopy.delivered}</span>
        </div>
      ) : (
        <>
          <div className={s.rowStatus}>
            <span className={`t-body-s ${s.muted}`}>{row.status}</span>
            {chip && <span className={`${s.chip} ${chip.tone === 'amber' ? s.amber : s.green}`}>{chip.text}</span>}
          </div>
          <div className={s.track}>
            <div
              className={s.progress}
              style={{ width: `${progressOf(row, elapsed) * 100}%`, background: stores[row.logo].color }}
            />
          </div>
        </>
      )}
    </div>
  );
}

/** Skeleton/Tracker row (405:54) at the height of the real row. */
function TrackRowSkeleton({ row }: { row: TrackRow }) {
  return (
    <div className={s.skeleton} style={{ height: row.chip ? 88 : 85 }} aria-hidden="true">
      <Skeleton width={150} height={16} radius={6} />
      <Skeleton width={110} height={12} radius={6} />
      <Skeleton width="100%" height={6} radius={3} />
    </div>
  );
}

export function Tracking() {
  const { paidScenario, scenario: chosen, storesInCart } = useStore();
  const scenario = scenarios[paidScenario ?? chosen];
  const loading = useEnterLoading();
  const [elapsed, setElapsed] = useState(0);
  const [decision, setDecision] = useState<Decision>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    const started = performance.now();
    const timer = window.setInterval(() => setElapsed(performance.now() - started), TICK_MS);
    return () => window.clearInterval(timer);
  }, [loading]);

  const delay = scenario.delay;
  const canDelay =
    !!delay && storesInCart.has('4lapy') && storesInCart.has('lenta') && scenario.tracking.rows.some((r) => r.id === delay.splitRowId && r.stores.includes('4lapy'));
  const delayed = canDelay && !loading && elapsed >= delayCopy.afterMs;

  const visible = (row: TrackRow) => row.stores.some((id) => storesInCart.has(id));

  let rows: TrackRow[] = scenario.tracking.rows;
  if (delayed && delay) {
    rows = rows.flatMap((row) => {
      const updated = { ...row, ...delay.rowUpdates[row.id] };
      if (row.id === delay.splitRowId) return decision === 'merged' ? [updated] : [updated, delayCopy.delayedRow];
      if (row.id === delay.joinRowId && decision === 'merged') {
        return [{ ...row, stores: ['4lapy', ...row.stores] as StoreId[], status: delayCopy.mergedStatus }];
      }
      return [updated];
    });
  }
  rows = rows.filter(visible);

  useFlip(sheetRef, `${loading}-${delayed}-${decision}`);

  // Each courier drives from its store to home together with its row.
  const couriers: Partial<Record<Exclude<StoreId, 'shokoladnitsa'>, number>> = {};
  for (const row of rows) {
    for (const store of row.stores) {
      if (store !== 'shokoladnitsa') couriers[store] = 0.5 + 0.5 * shareOf(row, elapsed);
    }
  }

  const allDelivered = !loading && rows.length > 0 && rows.every((row) => shareOf(row, elapsed) >= 1);
  const title = allDelivered ? trackingCopy.allDelivered : delayed ? delayCopy.title : scenario.tracking.title;
  const subtitle = allDelivered
    ? undefined
    : delayed
      ? decision === 'merged'
        ? undefined
        : delayCopy.subtitle
      : scenario.tracking.subtitle;

  return (
    <Screen label="Трекинг заказа">
      <div className={screenStyles.scroll}>
        <div className={s.map}>
          <TrackingMap couriers={couriers} />
        </div>

        <div className={s.sheet} ref={sheetRef} aria-busy={loading}>
          <Grabber top={8} />
          <div className={s.head} data-flip="head" aria-live="polite">
            <h1 key={title} className={`t-h1 ${s.headText}`}>
              {title}
            </h1>
            {subtitle && (
              <p key={subtitle} className={`t-body-s ${s.muted} ${s.headText}`}>
                {subtitle}
              </p>
            )}
          </div>

          {delayed && decision === null && delay && !allDelivered && (
            <div className={s.proposal} role="region" aria-label={delayCopy.proposalTitle}>
              <p className={s.proposalHead}>
                <Icon name="warn" size={20} className={s.warn} />
                <span className="t-h3">{delayCopy.proposalTitle}</span>
              </p>
              <p className="t-body-s">{delayCopy.proposalText(delay.tripsAfterMerge)}</p>
              <DeliverySlider value={scenario.id} readOnly />
              <div className={s.actions}>
                <Button height={52} onClick={() => setDecision('merged')}>
                  {delayCopy.merge}
                </Button>
                <Button height={52} variant="secondary" onClick={() => setDecision('kept')}>
                  {delayCopy.keep}
                </Button>
              </div>
            </div>
          )}

          <div className={s.rows}>
            {rows.map((row) =>
              loading ? (
                <TrackRowSkeleton key={row.id} row={row} />
              ) : (
                <TrackRowCard key={row.id} row={row} elapsed={elapsed} inCart={storesInCart} isNew={row.id === delayCopy.delayedRow.id} />
              ),
            )}
          </div>
        </div>
      </div>
      <StatusBar tone="dark" />
    </Screen>
  );
}
