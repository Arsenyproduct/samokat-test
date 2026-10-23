// Tracking model shared by the tracking screen and the order change screens:
// which rows are on their way, how far they got and what can still be changed.

import { useEffect, useState } from 'react';
import { stores, type StoreId } from '../data/catalog';
import { delayCopy, editCopy, editWindowMs, scenarios, type Scenario, type TrackRow } from '../data/delivery';
import type { DelayDecision } from './store';
import { useStore } from './store';

const TICK_MS = 500;

/**
 * When a row arrives, in ms after payment. Later ETAs arrive later, but the
 * whole order is delivered within about half a minute so the screen keeps moving.
 */
export function arrivalMs(time: string) {
  const [h = 0, m = 0] = time.split(':').map(Number);
  const minutes = Math.max(1, h * 60 + m - (14 * 60 + 16));
  return 8000 + Math.sqrt(minutes) * 1600;
}

/** Share of the way already driven, 0..1. */
export function shareOf(row: TrackRow, elapsed: number) {
  return Math.min(1, elapsed / arrivalMs(row.time));
}

export const isDelivered = (row: TrackRow, elapsed: number) => shareOf(row, elapsed) >= 1;

export function progressOf(row: TrackRow, elapsed: number) {
  const start = row.progress[0];
  return start + (1 - start) * shareOf(row, elapsed);
}

export function chipOf(row: TrackRow, elapsed: number) {
  if (!row.chip) return null;
  if (row.chip.kind === 'static') return { text: row.chip.text, tone: row.chip.tone };
  const minutes = Math.max(1, Math.ceil(row.chip.from * (1 - shareOf(row, elapsed))));
  return { text: `${minutes} мин`, tone: 'green' as const };
}

/** Whether a store can still be changed: its window is open and its trip is not at the door. */
export function canEditStore(store: StoreId, row: TrackRow | undefined, elapsed: number) {
  const window = (editWindowMs as Partial<Record<StoreId, number>>)[store];
  return window !== undefined && elapsed < window && !!row && !isDelivered(row, elapsed);
}

export const rowTitle = (row: TrackRow, inCart: Set<StoreId>) =>
  row.title ?? row.stores.filter((id) => inCart.has(id)).map((id) => stores[id].name).join(', ');

/** Rows of the paid scenario at this moment, with the delay and the merge applied. */
export function buildTracking(scenario: Scenario, inCart: Set<StoreId>, elapsed: number, decision: DelayDecision) {
  const delay = scenario.delay;
  const canDelay =
    !!delay &&
    inCart.has('4lapy') &&
    inCart.has('lenta') &&
    scenario.tracking.rows.some((r) => r.id === delay.splitRowId && r.stores.includes('4lapy'));
  const delayed = canDelay && elapsed >= delayCopy.afterMs;

  let rows: TrackRow[] = scenario.tracking.rows;
  if (delayed && delay) {
    rows = rows.flatMap((row) => {
      const updated = { ...row, ...delay.rowUpdates[row.id] };
      if (row.id === delay.splitRowId) return decision === 'merged' ? [updated] : [updated, delayCopy.delayedRow];
      if (row.id === delay.joinRowId && decision === 'merged') {
        return [
          {
            ...row,
            stores: ['4lapy', ...row.stores] as StoreId[],
            status: delayCopy.mergedStatus,
            doorTitle: delayCopy.mergedDoorTitle,
          },
        ];
      }
      return [updated];
    });
  }
  rows = rows.filter((row) => row.stores.some((id) => inCart.has(id)));
  return { rows, delayed };
}

export type StoreState = { store: StoreId; status: string; canEdit: boolean };

const storeOrder: StoreId[] = ['eapteka', 'samokat', 'shokoladnitsa', '4lapy', 'lenta'];

/** «Что ещё можно менять» (frame 4.1): one line per store in the order. */
export function storeStates(rows: TrackRow[], inCart: Set<StoreId>, elapsed: number): StoreState[] {
  return storeOrder
    .filter((store) => inCart.has(store))
    .map((store) => {
      const row = rows.find((r) => r.stores.includes(store));
      if (row && isDelivered(row, elapsed)) return { store, status: editCopy.storeStatus.atDoor, canEdit: false };
      if (canEditStore(store, row, elapsed)) return { store, status: editCopy.storeStatus.waiting, canEdit: true };
      const onTheWay = row?.chip?.kind === 'countdown';
      return { store, status: onTheWay ? editCopy.storeStatus.onTheWay : editCopy.storeStatus.assembling, canEdit: false };
    });
}

/**
 * Tracking time in ms, ticking while the clock runs. `mode` decides the clock:
 * the tracking screen runs it, the order change screens freeze it.
 */
export function useTrackingClock(mode: 'run' | 'pause') {
  const { trackBase, trackRunningSince, resumeTracking, pauseTracking } = useStore();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (mode === 'run') resumeTracking();
    else pauseTracking();
    // Only the mode matters: the store actions are recreated on every update.
  }, [mode]);

  useEffect(() => {
    if (trackRunningSince === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [trackRunningSince]);

  return trackBase + (trackRunningSince === null ? 0 : Math.max(0, now - trackRunningSince));
}

/** Current tracking state of the paid order. */
export function useOrderTracking(mode: 'run' | 'pause') {
  const { paidScenario, scenario: chosen, storesInCart, delayDecision } = useStore();
  const scenario = scenarios[paidScenario ?? chosen];
  const elapsed = useTrackingClock(mode);
  const { rows, delayed } = buildTracking(scenario, storesInCart, elapsed, delayDecision);
  const canChange = storeStates(rows, storesInCart, elapsed).some((state) => state.canEdit);
  return { scenario, elapsed, rows, delayed, storesInCart, decision: delayDecision, canChange };
}
