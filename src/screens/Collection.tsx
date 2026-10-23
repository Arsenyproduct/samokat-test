import { collection } from '../data/catalog';
import { BottomBar } from '../components/BottomBar';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import { IconButton, StatusBar, useEnterLoading } from '../components/ui';
import { useRouter } from '../state/router';
import { Screen, screenStyles } from './Screen';
import s from './Collection.module.css';

export function Collection() {
  const { navigate, back } = useRouter();
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
                  onOpen={() => navigate({ name: 'product', id })}
                />
              </div>
            ),
          )}
        </div>
      </div>

      <StatusBar tone="dark" background="var(--bg-page)" />

      <BottomBar searchTo={{ name: 'catalog' }} />
    </Screen>
  );
}
