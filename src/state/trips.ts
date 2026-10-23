import { cartOrder, products, type ProductId, type StoreId } from '../data/catalog';
import { scenarios, type ScenarioId, type Trip } from '../data/delivery';

export type BuiltTrip = {
  id: string;
  time: string;
  stores: StoreId[];
  productIds: ProductId[];
  note?: string;
};

/** Trips of a slider position, limited to the stores that are actually in the cart. */
export function buildTrips(scenarioId: ScenarioId, cart: Partial<Record<ProductId, number>>): BuiltTrip[] {
  const inCart = cartOrder.filter((id) => (cart[id] ?? 0) > 0);
  const storesInCart = new Set(inCart.map((id) => products[id].store));
  return scenarios[scenarioId].trips
    .map((trip: Trip) => {
      const tripStores = trip.stores.filter((store) => storesInCart.has(store));
      const productIds = tripStores.flatMap((store) => inCart.filter((id) => products[id].store === store));
      const note = trip.note && trip.note.requires.every((store) => storesInCart.has(store)) ? trip.note.text : undefined;
      return { id: trip.id, time: trip.time, stores: tripStores, productIds, note };
    })
    .filter((trip) => trip.stores.length > 0);
}

/** "17:30" style times compare as strings. */
export const latestTime = (trips: BuiltTrip[]) => trips.reduce((max, trip) => (trip.time > max ? trip.time : max), '00:00');
