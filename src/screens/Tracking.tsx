import { useEffect, useRef, useState } from 'react';
import { stores, type StoreId } from '../data/catalog';
import { delayCopy, scenarios, type TrackRow } from '../data/delivery';
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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Progress share of a row at `elapsed` ms: start → value at the delay, then slowly on. */
function progressOf(row: TrackRow, elapsed: number) {
  const [start, atDelay] = row.progress;
  if (elapsed <= delayCopy.afterMs) return lerp(start, atDelay, elapsed / delayCopy.afterMs);
  if (atDelay === start) return start;
  const after = Math.min(1, (elapsed - delayCopy.afterMs) / 90_000);
  return lerp(atDelay, Math.min(0.96, atDelay + 0.3), after);
}

function chipOf(row: TrackRow, elapsed: number) {
  if (!row.chip) return null;
  if (row.chip.kind === 'static') return { text: row.chip.text, tone: row.chip.tone };
  const { from, to } = row.chip;
  const minutes =
    elapsed <= delayCopy.afterMs
      ? Math.round(lerp(from, to, elapsed / delayCopy.afterMs))
      : Math.max(1, to - Math.floor((elapsed - delayCopy.afterMs) / 20_000));
  return { text: `${minutes} мин`, tone: 'green' as const };
}

function TrackRowCard({ row, elapsed, inCart, isNew }: { row: TrackRow; elapsed: number; inCart: Set<StoreId>; isNew: boolean }) {
  const title = row.title ?? row.stores.filter((id) => inCart.has(id)).map((id) => stores[id].name).join(', ');
  const chip = chipOf(row, elapsed);
  return (
    <div className={`${s.row} ${isNew ? s.rowNew : screenStyles.reveal}`} data-flip={row.id}>
      <div className={s.rowHead}>
        <div className={s.rowStore}>
          <StoreLogo store={row.logo} size={17} />
          <span className="t-h3">{title}</span>
        </div>
        <span className="t-num-17">{row.time}</span>
      </div>
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

  // Couriers of the first trip drive towards home while the rest wait at the halfway mark.
  const firstRow = scenario.tracking.rows[0];
  const drive = firstRow ? progressOf(firstRow, elapsed) : 0;
  const couriers: Partial<Record<Exclude<StoreId, 'shokoladnitsa'>, number>> = {};
  for (const store of ['eapteka', 'samokat', '4lapy', 'lenta'] as const) {
    couriers[store] = firstRow?.chip && firstRow.stores.includes(store) ? 0.5 + (drive - (firstRow.progress[0] ?? 0)) * 0.9 : 0.5;
  }

  const title = delayed ? delayCopy.title : scenario.tracking.title;
  const subtitle = delayed ? (decision === 'merged' ? undefined : delayCopy.subtitle) : scenario.tracking.subtitle;

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

          {delayed && decision === null && delay && (
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
