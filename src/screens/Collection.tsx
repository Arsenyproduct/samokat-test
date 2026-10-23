import { collection, formatPrice, products } from '../data/catalog';
import { Icon } from '../components/Icon';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import { IconButton, StatusBar, useEnterLoading } from '../components/ui';
import { useRouter } from '../state/router';
import { useStore } from '../state/store';
import { Screen, screenStyles } from './Screen';
import s from './Collection.module.css';

export function Collection() {
  const { navigate, back } = useRouter();
  const { itemsTotal, itemCount } = useStore();
  const loading = useEnterLoading();

  return (
    <Screen label="Подборка на вечер">
      <div className={screenStyles.scroll}>
        <div className={screenStyles.header}>
          <IconButton icon="back" label="Назад" className={screenStyles.headerBack} onClick={back} />
          <h1 className={screenStyles.headerTitle}>Подборка на вечер</h1>
        </div>

        <div className={s.grid} aria-busy={loading}>
          {collection.map((id) =>
            loading ? (
              <ProductCardSkeleton key={id} />
            ) : (
              <div key={id} className={screenStyles.reveal}>
                <ProductCard
                  id={id}
                  onOpen={products[id].detail ? () => navigate({ name: 'product', id }) : undefined}
                />
              </div>
            ),
          )}
        </div>
      </div>

      <StatusBar tone="dark" background="var(--bg-page)" />

      <div className={s.bar}>
        <button type="button" className={s.search} onClick={() => navigate({ name: 'catalog' })}>
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
    </Screen>
  );
}
