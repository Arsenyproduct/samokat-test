import { cartCopy } from '../data/catalog';
import { useStore } from '../state/store';
import { Icon } from './Icon';
import { Divider, Toggle } from './ui';
import s from './OrderSettings.module.css';

/** «Скидка или промокод», «СберСпасибо», «Оплата SberPay» (List row + Toggle). */
export function OrderSettings({ variant, promoNote, bonusNote }: { variant: 'cart' | 'checkout'; promoNote: string; bonusNote: string }) {
  const { useBonus, setUseBonus } = useStore();
  return (
    <div className={`${s.card} ${variant === 'cart' ? s.cart : s.checkout}`}>
      <div className={s.listRow}>
        <div className={s.listText}>
          <span className="t-h3">{cartCopy.promoTitle}</span>
          <span className={`t-body-s ${s.muted}`}>{promoNote}</span>
        </div>
        <span className={s.badge}>{cartCopy.promoBadge}</span>
        <Icon name="chevR" size={20} className={s.chev} />
      </div>
      <Divider />
      <div className={s.bonusRow}>
        <div className={s.bonusText}>
          <span className={s.bonusTitle}>{cartCopy.bonusTitle}</span>
          <span className={`t-body-s ${s.muted}`}>{bonusNote}</span>
        </div>
        <Toggle checked={useBonus} onChange={setUseBonus} label={cartCopy.bonusTitle} />
      </div>
      <Divider />
      <div className={s.listRow}>
        <div className={s.listText}>
          <span className="t-h3">{cartCopy.payment}</span>
        </div>
        <Icon name="chevR" size={20} className={s.chev} />
      </div>
    </div>
  );
}
