import { formatPrice } from '../data/catalog';
import { useRouter, type Route } from '../state/router';
import { useStore } from '../state/store';
import { Icon } from './Icon';
import s from './BottomBar.module.css';

/** «Поиск» on the left, the cart button on the right while the cart has items. */
export function BottomBar({ searchTo }: { searchTo: Route }) {
  const { navigate } = useRouter();
  const { itemsTotal, itemCount } = useStore();
  return (
    <div className={s.bar}>
      <button type="button" className={s.search} onClick={() => navigate(searchTo)}>
        <Icon name="search" size={22} />
        <span className="t-button-l">Поиск</span>
      </button>
      {itemCount > 0 && (
        <button
          type="button"
          className={s.fab}
          onClick={() => navigate({ name: 'cart' })}
          aria-label={`Корзина, ${formatPrice(itemsTotal)}`}
        >
          <span className="t-price-l">{formatPrice(itemsTotal)}</span>
          <span className={`t-caption ${s.fabTime}`}>15 минут</span>
        </button>
      )}
    </div>
  );
}
