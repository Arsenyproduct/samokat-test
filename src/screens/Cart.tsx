import { cartCopy, cartOrder, formatPrice, partnerOrder, products, stores, type ProductId, type StoreId } from '../data/catalog';
import { Icon } from '../components/Icon';
import { OrderSettings } from '../components/OrderSettings';
import { Button, Divider, Grabber, Skeleton, StatusBar, Stepper, StoreLogo, Toggle, useEnterLoading } from '../components/ui';
import { useRouter } from '../state/router';
import { useStore } from '../state/store';
import { Screen, screenStyles } from './Screen';
import s from './Cart.module.css';

function CartRow({ id }: { id: ProductId }) {
  const { cart, add, remove } = useStore();
  const product = products[id];
  const count = cart[id] ?? 0;
  return (
    <div className={`${s.row} ${screenStyles.reveal}`}>
      <img className={s.rowPhoto} src={product.image} alt="" />
      <div className={s.rowBody}>
        <p className="t-body-s">{product.cartTitle}</p>
        <Stepper count={count} label={product.cartTitle} onMinus={() => remove(id)} onPlus={() => add(id)} />
      </div>
      <span className={`t-price-l ${s.rowPrice}`}>{formatPrice(product.price * count)}</span>
    </div>
  );
}

/** Skeleton/Cart row (405:48), centered in the 84 px row so nothing moves. */
function CartRowSkeleton() {
  return (
    <div className={s.skeletonRow} aria-hidden="true">
      <Skeleton width={72} height={72} radius={16} />
      <div className={s.skeletonText}>
        <Skeleton width={190} height={12} radius={6} style={{ maxWidth: '100%' }} />
        <Skeleton width={130} height={12} radius={6} />
        <Skeleton width={70} height={32} radius={16} />
      </div>
    </div>
  );
}

export function Cart() {
  const { navigate, back } = useRouter();
  const store = useStore();
  const loading = useEnterLoading();

  const idsOf = (storeId: StoreId) => cartOrder.filter((id) => products[id].store === storeId && (store.cart[id] ?? 0) > 0);
  const rows = (ids: ProductId[]) =>
    loading ? ids.map((id) => <CartRowSkeleton key={id} />) : ids.map((id) => <CartRow key={id} id={id} />);

  const samokatIds = idsOf('samokat');
  const partners = partnerOrder.map((id) => ({ id, ids: idsOf(id) })).filter((p) => p.ids.length > 0);
  const empty = store.itemCount === 0;

  return (
    <Screen label="Корзина" className={screenStyles.overlay} animate={false}>
      <StatusBar tone="light" />
      <button type="button" className={s.dismiss} aria-label="Закрыть корзину" onClick={back} />

      <div className={`${s.sheet} ${screenStyles.sheetEnter}`}>
        <div className={s.content} aria-busy={loading}>
          <Grabber top={6} onClose={back} />

          <div className={s.head}>
            <div className={s.headText}>
              <div className={s.address}>
                <h1 className="t-h1">{cartCopy.address}</h1>
                <Icon name="chevD" size={20} className={s.muted} />
              </div>
              {store.leaveAtDoor && <p className={`t-body-s ${s.muted} ${s.leave}`}>{cartCopy.leaveAtDoor}</p>}
            </div>
            <div className={s.avatar} aria-hidden="true" />
          </div>

          <div className={s.card}>
            <div className={s.optionRow}>
              <span>{cartCopy.leaveAtDoor}</span>
              <Toggle checked={store.leaveAtDoor} onChange={store.setLeaveAtDoor} label={cartCopy.leaveAtDoor} />
            </div>
            <Divider />
            <div className={s.optionRow}>
              <span>{cartCopy.orderForOther}</span>
              <Toggle checked={store.orderForOther} onChange={store.setOrderForOther} label={cartCopy.orderForOther} />
            </div>
          </div>

          {!empty && (
            <div className={s.card}>
              <h2 className="t-h1">{cartCopy.samokatTitle}</h2>
              {rows(samokatIds)}
              {samokatIds.length > 0 && <Divider />}
              <div className={s.packing}>
                <span>{cartCopy.packing}</span>
                <b>{formatPrice(cartCopy.packingPrice)}</b>
              </div>
            </div>
          )}

          {partners.length > 0 && (
            <>
              <div className={s.partnersHead}>
                <h2 className="t-h1">{cartCopy.partnersTitle}</h2>
                <p className={`t-body-s ${s.muted}`}>{cartCopy.partnersNote}</p>
              </div>
              {partners.map((partner) => (
                <div key={partner.id} className={s.card}>
                  <div className={s.storeHead}>
                    <div className={s.store}>
                      <StoreLogo store={partner.id} size={17} />
                      <h3 className="t-h2">{stores[partner.id].name}</h3>
                    </div>
                    <div className={s.eta}>
                      <Icon name="clock" size={18} />
                      <span className="t-h3">{stores[partner.id].cartEta}</span>
                    </div>
                  </div>
                  {rows(partner.ids)}
                </div>
              ))}
            </>
          )}

          <OrderSettings variant="cart" promoNote={cartCopy.promoNote} bonusNote={cartCopy.bonusNote} />

          <div className={`${s.card} ${s.total}`}>
            <p className={`t-body-m ${s.muted}`}>{store.useBonus && !empty ? cartCopy.totalWithBonus : cartCopy.total}</p>
            <p className={`t-price-xl ${s.totalValue}`}>{formatPrice(store.cartTotal)}</p>
            {empty ? (
              <Button onClick={() => navigate({ name: 'catalog' })}>{cartCopy.emptyCta}</Button>
            ) : (
              <Button onClick={() => navigate({ name: 'checkout' })}>{cartCopy.cta}</Button>
            )}
            <p className={`t-caption ${s.footnote}`}>{cartCopy.footnote}</p>
          </div>
        </div>
      </div>
    </Screen>
  );
}
