import { formatPrice, products, type ProductId } from '../data/catalog';
import { Icon } from '../components/Icon';
import { IconButton, PartnerTag, StatusBar } from '../components/ui';
import { useRouter } from '../state/router';
import { useStore } from '../state/store';
import { Screen, screenStyles } from './Screen';
import s from './Product.module.css';

export function ProductSheet({ id }: { id: ProductId }) {
  const product = products[id];
  const { back } = useRouter();
  const { cart, add, remove, favorites, toggleFavorite } = useStore();
  const count = cart[id] ?? 0;
  const favorite = favorites.includes(id);

  return (
    <Screen label={product.title} className={screenStyles.overlay} animate={false}>
      <StatusBar tone="light" />
      <div className={`${s.sheet} ${screenStyles.sheetEnter}`}>
        <div className={s.body}>
          <div className={s.photo}>
            <img src={product.image} alt="" />
            <div className={s.actions}>
              <IconButton
                icon="heartOutline"
                label="В сохранёнки"
                aria-pressed={favorite}
                className={favorite ? s.heartOn : undefined}
                onClick={() => toggleFavorite(id)}
              />
              <IconButton icon="close" label="Закрыть" onClick={back} />
            </div>
            {product.store !== 'samokat' && <PartnerTag store={product.store} className={s.tag} />}
          </div>

          <div className={s.info}>
            <h1 className="t-h2">{product.title}</h1>
            <p className={`t-body-m ${s.amount}`}>
              {product.hint ? (
                <>
                  {`${product.amount} · `}
                  <span className={s.hint}>{product.hint}</span>
                </>
              ) : (
                product.amount
              )}
            </p>
            {product.detail && (
              <div className={s.delivery}>
                <p className={s.deliveryHead}>
                  <Icon name="clock" size={20} />
                  <span className="t-h3">{product.detail.delivery}</span>
                </p>
                <p className="t-body-s">{product.detail.note}</p>
              </div>
            )}
            <div className={s.more}>
              <span className="t-h3">Подробнее о товаре</span>
              <Icon name="chevR" size={20} className={s.chev} />
            </div>
          </div>
        </div>

        {count === 0 ? (
          <button type="button" className={s.addBar} onClick={() => add(id)} aria-label={`Добавить в корзину: ${product.title}`}>
            <span className="t-price-l">{formatPrice(product.price)}</span>
            <Icon name="plus" size={26} stroke={2.2} />
          </button>
        ) : (
          <div className={s.addBar}>
            <button type="button" className={s.countButton} onClick={() => remove(id)} aria-label={`Убрать: ${product.title}`}>
              <Icon name="minus" size={26} stroke={2.2} />
            </button>
            <span className={`t-price-l ${s.countValue}`} aria-live="polite">
              {formatPrice(product.price * count)}
            </span>
            <button type="button" className={s.countButton} onClick={() => add(id)} aria-label={`Добавить: ${product.title}`}>
              <Icon name="plus" size={26} stroke={2.2} />
            </button>
          </div>
        )}
      </div>
    </Screen>
  );
}
