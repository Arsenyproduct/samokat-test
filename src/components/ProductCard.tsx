import { products, type ProductId } from '../data/catalog';
import { useStore } from '../state/store';
import { Icon } from './Icon';
import { PartnerTag, PriceChip, Skeleton } from './ui';
import s from './ProductCard.module.css';

/** Product card (360:150). `compact` is the three-in-a-row version for the catalog. */
export function ProductCard({ id, onOpen, compact = false }: { id: ProductId; onOpen?: () => void; compact?: boolean }) {
  const product = products[id];
  const { cart, add, remove, favorites, toggleFavorite } = useStore();
  const count = cart[id] ?? 0;
  const favorite = favorites.includes(id);

  const photo = <img src={product.image} alt="" draggable={false} />;

  return (
    <article className={`${s.card} ${compact ? s.compact : ''}`} aria-label={product.title}>
      <div className={s.photoWrap}>
        {onOpen ? (
          <button type="button" className={s.photo} onClick={onOpen} aria-label={`Открыть: ${product.title}`}>
            {photo}
          </button>
        ) : (
          <div className={s.photo}>{photo}</div>
        )}
        {product.store !== 'samokat' && <PartnerTag store={product.store} className={s.tag} />}
        <button
          type="button"
          className={`${s.heart} ${favorite ? s.heartOn : ''}`}
          aria-label="В сохранёнки"
          aria-pressed={favorite}
          onClick={() => toggleFavorite(id)}
        >
          <Icon name="heart" size={16} />
        </button>
      </div>
      <p className={`t-body-s ${s.title}`}>{product.title}</p>
      <p className={`t-body-s ${s.amount}`}>
        {product.hint ? (
          <>
            {`${product.amount} · `}
            <span className={s.hint}>{product.hint}</span>
          </>
        ) : (
          product.amount
        )}
      </p>
      <div>
        <PriceChip
          price={product.price}
          count={count}
          label={product.title}
          onAdd={() => add(id)}
          onRemove={() => remove(id)}
        />
      </div>
    </article>
  );
}

export function ProductCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className={`${s.skeleton} ${s.compact}`} aria-hidden="true">
        <Skeleton width="100%" height={0} radius={20} className={s.skeletonPhoto} />
        <div className={s.skeletonText}>
          <Skeleton width="90%" height={12} radius={6} />
          <Skeleton width="60%" height={12} radius={6} />
          <Skeleton width={84} height={32} radius={16} style={{ marginTop: 'auto' }} />
        </div>
      </div>
    );
  }
  return (
    <div className={s.skeleton} aria-hidden="true">
      <Skeleton width="100%" height={180} radius={24} className={s.skeletonPhoto} />
      <Skeleton width={170} height={12} radius={6} />
      <Skeleton width={120} height={12} radius={6} />
      <Skeleton width={84} height={32} radius={16} />
    </div>
  );
}
