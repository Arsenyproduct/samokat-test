import { images, products, type ProductId, type StoreId } from '../data/catalog';
import { Icon } from '../components/Icon';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import { IconButton, Skeleton, StatusBar, StoreLogo, useEnterLoading } from '../components/ui';
import { useRouter } from '../state/router';
import { Screen, screenStyles } from './Screen';
import s from './Catalog.module.css';

type Tile = { label: string; image: string; logo?: StoreId; tight?: boolean };

// Copy and images from frame 374:12.
const own: Tile[] = [
  { label: 'Продукты', image: products.milk.image },
  { label: 'Товары', image: images.bar },
  { label: 'Часто заказывают', image: products.ice.image, tight: true },
];

const evening: ProductId[] = ['nurofen', 'buckwheat', 'ice'];

const partners: Tile[] = [
  { label: 'Аптеки', image: products.nurofen.image, logo: 'eapteka' },
  { label: 'Зоомагазины', image: products.toy.image, logo: '4lapy' },
  { label: 'Рестораны', image: products.combo.image, logo: 'shokoladnitsa' },
  { label: 'Гипермаркеты', image: products.buckwheat.image, logo: 'lenta' },
];

export function Catalog() {
  const { navigate, back } = useRouter();
  const loading = useEnterLoading();

  const renderTiles = (tiles: Tile[]) =>
    loading
      ? tiles.map((tile) => <Skeleton key={tile.label} width="100%" height={0} radius={14} className={s.skeletonTile} />)
      : tiles.map((tile) => (
          <button
            key={tile.label}
            type="button"
            className={`${s.tile} ${screenStyles.reveal}`}
            onClick={() => navigate({ name: 'collection' })}
          >
            <img className={s.tileImage} src={tile.image} alt="" />
            <span className={s.fade} />
            <span className={`${s.tileLabel} ${tile.tight ? s.tileLabelTight : ''}`}>{tile.label}</span>
            {tile.logo && <StoreLogo store={tile.logo} size={34} className={s.tileLogo} />}
          </button>
        ));

  return (
    <Screen label="Каталог" className={s.screen}>
      <div className={screenStyles.scroll}>
        <div className={s.header}>
          <IconButton icon="back" label="Назад" className={s.back} onClick={back} />
          <h1 className={`t-h2 ${s.title}`}>Каталог</h1>
        </div>

        <div className={s.content}>
          <button type="button" className={s.sectionLink} onClick={() => navigate({ name: 'collection' })}>
            <h2 className="t-h1">Подборка на вечер</h2>
            <Icon name="chevR" size={20} className={s.sectionChev} />
          </button>
          <div className={s.products} aria-busy={loading}>
            {evening.map((id) =>
              loading ? (
                <ProductCardSkeleton key={id} compact />
              ) : (
                <div key={id} className={screenStyles.reveal}>
                  <ProductCard id={id} compact onOpen={() => navigate({ name: 'product', id })} />
                </div>
              ),
            )}
          </div>

          <h2 className="t-h1">От Самоката</h2>
          <div className={s.grid}>{renderTiles(own)}</div>

          <div className={s.partnersHead}>
            <h2 className="t-h1">Партнёры</h2>
            <p className={`t-body-s ${s.note}`}>
              Привозят сами, поэтому срок доставки может отличаться. Он указан на карточке товара.
            </p>
          </div>
          <div className={s.grid} aria-busy={loading}>
            {renderTiles(partners)}
          </div>
        </div>
      </div>
      <StatusBar tone="dark" background="var(--bg-card)" />
    </Screen>
  );
}
