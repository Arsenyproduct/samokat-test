import { useState } from 'react';
import { cartOrder, formatPrice, products, stores, type ProductId, type StoreId } from '../data/catalog';
import { editCopy } from '../data/delivery';
import { Button, StatusBar, Stepper, StoreLogo } from '../components/ui';
import { useRouter } from '../state/router';
import { useStore, type Cart } from '../state/store';
import { storeStates, useOrderTracking, type StoreState } from '../state/tracking';
import { BackButton } from './EditOrder';
import { Screen, screenStyles } from './Screen';
import s from './EditOrder.module.css';

const joinNames = (names: string[]) =>
  names.length < 2 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} и ${names[names.length - 1]}`;

/** 4.2 Состав заказа: steppers for stores that have not started, the rest greyed out. */
export function EditItems() {
  const { backTo } = useRouter();
  const { cart, setCart } = useStore();
  const { rows, storesInCart, elapsed } = useOrderTracking('pause');
  const states = storeStates(rows, storesInCart, elapsed);
  const [draft, setDraft] = useState<Cart>(cart);

  const idsOf = (store: StoreId) => cartOrder.filter((id) => products[id].store === store && (cart[id] ?? 0) > 0);
  const editable = states.filter((state) => state.canEdit);
  const locked = states.filter((state) => !state.canEdit);

  const refund = editable
    .flatMap((state) => idsOf(state.store))
    .reduce((sum, id) => sum + products[id].price * ((cart[id] ?? 0) - (draft[id] ?? 0)), 0);

  // Only lowering is possible here; adding goes through the catalog («Добавить товар»).
  const change = (id: ProductId, delta: number) =>
    setDraft((d) => ({ ...d, [id]: Math.max(0, Math.min(cart[id] ?? 0, (d[id] ?? 0) + delta)) }));

  const save = () => {
    const next: Cart = { ...cart };
    for (const state of editable) {
      for (const id of idsOf(state.store)) {
        const count = draft[id] ?? 0;
        if (count > 0) next[id] = count;
        else delete next[id];
      }
    }
    setCart(next);
    backTo(2, { name: 'tracking' });
  };

  // «Уже собирают» for stores in assembly, otherwise their own status (в пути, у двери).
  const lockedChip = (state: StoreState) =>
    state.status === editCopy.storeStatus.assembling ? editCopy.items.locked : state.status;

  return (
    <Screen label={editCopy.items.title}>
      <div className={screenStyles.scroll}>
        <div className={`${s.content} ${s.withBar}`}>
          <div className={s.header}>
            <h1 className={s.title}>{editCopy.items.title}</h1>
            <p className={s.subtitle}>{editCopy.items.subtitle}</p>
          </div>

          {editable.map((state) => (
            <div key={state.store} className={s.card}>
              <div className={s.storeHead}>
                <StoreLogo store={state.store} size={13} />
                <span className={s.storeHeadName}>{stores[state.store].name}</span>
                <span className={`${s.chip} ${s.chipCan}`}>{editCopy.items.canEdit}</span>
              </div>
              {idsOf(state.store).map((id) => {
                const count = draft[id] ?? 0;
                return (
                  <div key={id} className={`${s.item} ${count === 0 ? s.itemRemoved : ''}`}>
                    <img className={s.itemPhoto} src={products[id].image} alt="" />
                    <span className={s.itemText}>
                      <span className={s.itemName}>{products[id].cartTitle}</span>
                      <span className={s.itemPrice}>{formatPrice(products[id].price)}</span>
                    </span>
                    <Stepper
                      count={count}
                      label={products[id].cartTitle}
                      onMinus={() => change(id, -1)}
                      onPlus={() => change(id, 1)}
                    />
                  </div>
                );
              })}
            </div>
          ))}

          {locked.length > 0 && (
            <div className={`${s.card} ${s.locked}`}>
              {locked.map((state) => (
                <div key={state.store} className={s.lockedStore}>
                  <div className={s.storeHead}>
                    <StoreLogo store={state.store} size={13} />
                    <span className={s.storeHeadName}>{stores[state.store].name}</span>
                    <span className={`${s.chip} ${s.chipOnTile}`}>{lockedChip(state)}</span>
                  </div>
                  {idsOf(state.store).map((id) => (
                    <div key={id} className={s.item}>
                      <img className={s.itemPhoto} src={products[id].image} alt="" />
                      <span className={s.itemText}>
                        <span className={s.itemName}>{products[id].cartTitle}</span>
                        <span className={s.itemPrice}>{formatPrice(products[id].price)}</span>
                      </span>
                      <span className={s.count}>{editCopy.items.pieces(cart[id] ?? 0)}</span>
                    </div>
                  ))}
                </div>
              ))}
              <p className={s.lockedNote}>{editCopy.items.lockedNote(joinNames(locked.map((state) => stores[state.store].name)))}</p>
            </div>
          )}
        </div>
      </div>

      <StatusBar tone="dark" background="var(--bg-page)" />
      <BackButton />

      <div className={s.bottomBar}>
        <div className={s.sum}>
          <span className={s.sumLabel}>{editCopy.items.refund}</span>
          <span className={s.sumValue}>{editCopy.items.refundValue(formatPrice(refund))}</span>
        </div>
        <Button onClick={save}>{editCopy.items.save}</Button>
      </div>
    </Screen>
  );
}
