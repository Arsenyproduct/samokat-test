import { useRef } from 'react';
import { stores, type StoreId } from '../data/catalog';
import { delayCopy, trackingCopy, type TrackRow } from '../data/delivery';
import { Icon } from '../components/Icon';
import { TrackingMap, type MapTrip } from '../components/TrackingMap';
import { Button, Grabber, Skeleton, StatusBar, StoreLogo, useEnterLoading } from '../components/ui';
import { useFlip } from '../components/useFlip';
import { useRouter } from '../state/router';
import { useStore } from '../state/store';
import {
  arrivalMs,
  chipOf,
  isDelivered,
  progressOf,
  rowTitle,
  shareOf,
  useOrderTracking,
} from '../state/tracking';
import { Screen, screenStyles } from './Screen';
import s from './Tracking.module.css';

function TrackRowCard({
  row,
  elapsed,
  inCart,
  isNew,
}: {
  row: TrackRow;
  elapsed: number;
  inCart: Set<StoreId>;
  isNew: boolean;
}) {
  const delivered = isDelivered(row, elapsed);
  const chip = chipOf(row, elapsed);
  return (
    <div className={`${s.row} ${isNew ? s.rowNew : screenStyles.reveal}`} data-flip={row.id}>
      <div className={s.rowHead}>
        <div className={s.rowStore}>
          <StoreLogo store={row.logo} size={17} />
          <span className="t-h3">{rowTitle(row, inCart)}</span>
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
  const { navigate } = useRouter();
  const { setDelayDecision } = useStore();
  const { scenario, elapsed, rows, delayed, storesInCart, decision, canChange } = useOrderTracking('run');
  const loading = useEnterLoading();
  const sheetRef = useRef<HTMLDivElement>(null);
  const delay = scenario.delay;

  useFlip(sheetRef, `${loading}-${delayed}-${decision}-${canChange}-${rows.map((r) => isDelivered(r, elapsed)).join()}`);

  // The map shows only trips still on their way, one point per trip.
  const onTheWay: MapTrip[] = rows
    .filter((row) => !isDelivered(row, elapsed))
    .map((row) => ({ store: row.logo, share: shareOf(row, elapsed) }));

  const arrived = rows.filter((row) => isDelivered(row, elapsed));
  const allDelivered = rows.length > 0 && arrived.length === rows.length;
  const lastArrived = [...arrived].sort((a, b) => arrivalMs(b.time) - arrivalMs(a.time))[0];
  const proposalOpen = delayed && decision === null && !!delay && !allDelivered;

  const title = allDelivered
    ? trackingCopy.allDelivered
    : proposalOpen
      ? delayCopy.title
      : (lastArrived?.doorTitle ?? (delayed ? delayCopy.title : scenario.tracking.title));
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
          <TrackingMap trips={onTheWay} />
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

          {proposalOpen && delay && (
            <div className={s.proposal} role="region" aria-label={delayCopy.proposalTitle}>
              <p className={s.proposalHead}>
                <Icon name="warn" size={20} className={s.warn} />
                <span className="t-h3">{delayCopy.proposalTitle}</span>
              </p>
              <p className="t-body-s">{delayCopy.proposalText(delay.tripsAfterMerge)}</p>
              <div className={s.actions}>
                <Button height={52} onClick={() => setDelayDecision('merged')}>
                  {delayCopy.merge}
                </Button>
                <Button height={52} variant="secondary" onClick={() => setDelayDecision('kept')}>
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
                <TrackRowCard
                  key={row.id}
                  row={row}
                  elapsed={elapsed}
                  inCart={storesInCart}
                  isNew={row.id === delayCopy.delayedRow.id}
                />
              ),
            )}
            {!loading && canChange && (
              <Button variant="secondary" className={s.editOrder} onClick={() => navigate({ name: 'edit' })}>
                {trackingCopy.editOrder}
              </Button>
            )}
          </div>
        </div>
      </div>
      <StatusBar tone="dark" />
    </Screen>
  );
}
