import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BONUS, flavorOrder, flavors, PRICE, productTitle, rub, SET_FULL, SET_PRICE, type FlavorId } from './data';
import { totals, useStore, type CartSet } from './store';
import { Bar, Icons, Roll, SetThumb72, Stepper, Toggle, useDragToClose, useLatest, usePresence } from './ui';
import s from './Cart.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenSet: (id: string) => void;
  /** A flavour chip of a set: the replace list opens as a popup */
  onReplaceFlavor: (id: string, index: number) => void;
};

/** E4 · Корзина: набор одной строкой (642:3993); a flavour is replaced in the popup list (642:4476) */
export function Cart({ open, onClose, onOpenSet, onReplaceFlavor }: Props) {
  const { mounted, shown } = usePresence(open, 480);
  const { state, dispatch } = useStore();
  const drag = useDragToClose(onClose);
  const sets = useKeepRemoved(state.sets);

  if (!mounted) return null;

  const t = totals(state);
  let freeLeft = Math.floor((state.singles.les + state.singles.arahis + state.singles.bel) / 3);
  const singles = [...flavorOrder]
    // The free bars go to the last rows
    .reverse()
    .map((f) => {
      const free = Math.min(freeLeft, state.singles[f]);
      freeLeft -= free;
      return { flavor: f, qty: state.singles[f], free };
    })
    .reverse();

  const sheetStyle = drag.dy > 0 ? { transform: `translateY(${drag.dy}px)`, ...(drag.dragging ? { transition: 'none' } : null) } : undefined;

  return (
    <div className={`${s.layer} ${shown ? s.shown : ''}`} inert={!open}>
      <div className={s.backdrop} onClick={onClose} />
      <div className={s.sheet} style={sheetStyle} role="dialog" aria-label="Корзина">
        <div className={s.scroll}>
          <div className={s.grabZone} {...drag.handlers}>
            <span className={s.grabber} />
            {/* Address and avatar, pt14 px6 */}
            <div className={s.head}>
              <div className={s.address}>
                <p className={s.addressLine}>
                  Зеленоград, к828
                  <Icons.chevD size={20} className={s.chev} />
                </p>
                <p className={s.addressNote}>Оставить у двери</p>
              </div>
              <span className={s.avatar} />
            </div>
          </div>

          <div className={s.card}>
            <div className={s.toggleRow}>
              <p className={s.rowTitle}>Оставить у двери</p>
              <Toggle checked={state.leaveAtDoor} onChange={() => dispatch({ type: 'toggle', key: 'leaveAtDoor' })} label="Оставить у двери" />
            </div>
            <div className={s.divider} />
            <div className={s.toggleRow}>
              <p className={s.rowTitle}>Заказать другому</p>
              <Toggle checked={state.forOther} onChange={() => dispatch({ type: 'toggle', key: 'forOther' })} label="Заказать другому" />
            </div>
          </div>

          <div className={s.card}>
            <p className={s.h1}>Доставка 15 минут</p>

            {sets.map(({ set, removed }) => (
              <Collapse key={set.id} open={!removed}>
                <SetRow
                  set={set}
                  onPick={(index) => onReplaceFlavor(set.id, index)}
                  onOpen={() => onOpenSet(set.id)}
                  onQty={(delta) => dispatch({ type: 'setQty', id: set.id, delta })}
                />
              </Collapse>
            ))}

            {singles.map((row) => (
              <Collapse key={row.flavor} open={row.qty > 0}>
                <SingleRow
                  flavor={row.flavor}
                  qty={row.qty}
                  free={row.free}
                  onQty={(delta) => dispatch({ type: 'single', flavor: row.flavor, delta })}
                />
              </Collapse>
            ))}

            <Collapse open={t.lines === 0}>
              <p className={s.empty}>В корзине пусто</p>
            </Collapse>

            <div className={s.divider} />
            <div className={s.packing}>
              <p>Сборка и упаковка</p>
              <b>{rub(t.items > 0 ? 49 : 0)}</b>
            </div>
          </div>

          <div className={`${s.card} ${s.cardSettings}`}>
            <div className={s.listRow}>
              <div className={s.listText}>
                <p className={s.listTitle}>Скидка или промокод</p>
                <p className={s.listDesc}>Один промокод на все товары, включая партнёров</p>
              </div>
              <span className={s.badge}>Весь заказ</span>
              <Icons.chevR size={20} className={s.chev} />
            </div>
            <div className={s.divider} />
            <div className={s.bonusRow}>
              <div>
                <p className={s.rowTitle}>СберСпасибо</p>
                <p className={s.listDesc}>{BONUS} бонуса, списываем на весь заказ</p>
              </div>
              <Toggle checked={state.useBonus} onChange={() => dispatch({ type: 'toggle', key: 'useBonus' })} label="СберСпасибо" />
            </div>
            <div className={s.divider} />
            <div className={s.listRow}>
              <div className={s.listText}>
                <p className={s.listTitle}>Оплата SberPay ••• 5801</p>
              </div>
              <Icons.chevR size={20} className={s.chev} />
            </div>
          </div>

          <div className={`${s.card} ${s.cardTotal}`}>
            <p className={s.totalNote}>
              {t.discount > 0 ? (
                <>
                  Итого, со скидкой <Roll value={rub(t.discount)} />
                </>
              ) : (
                'Итого'
              )}
            </p>
            <Roll className={`t-price-xl ${s.total}`} value={rub(t.total)} />
            <button type="button" className={s.checkout} disabled={t.items === 0}>
              Перейти к оформлению
            </button>
            <p className={s.footnote}>Бонусы и промокод действуют на всю корзину, ничего считать по магазинам не нужно</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Набор · строка корзины ---------- */

type SetRowProps = {
  set: CartSet;
  onPick: (index: number) => void;
  onOpen: () => void;
  onQty: (delta: 1 | -1) => void;
};

function SetRow({ set, onPick, onOpen, onQty }: SetRowProps) {
  return (
    <div className={s.setRow}>
      <button type="button" className={s.setThumb} onClick={onOpen} aria-label="Открыть набор">
        <SetThumb72 flavors={set.flavors} />
      </button>
      <div className={s.setInfo}>
        <button type="button" className={s.setTitle} onClick={onOpen}>
          Snickers, 3 вкуса по цене 2
        </button>
        <div className={s.setFlavors}>
          {set.flavors.map((f, i) => (
            <button key={i} type="button" className={s.flavorChip} onClick={() => onPick(i)} aria-label={`Заменить «${flavors[f].name}»`}>
              <span key={f} className={s.flavorName}>
                {flavors[f].name}
              </span>
              {i === 2 && <b className={s.free}>0 ₽</b>}
            </button>
          ))}
        </div>
        <Stepper count={set.qty} label="набор Snickers" onMinus={() => onQty(-1)} onPlus={() => onQty(1)} />
      </div>
      <div className={s.setPrice}>
        <Roll className={s.struck} value={rub(SET_FULL * set.qty)} />
        <Roll value={rub(SET_PRICE * set.qty)} />
      </div>
    </div>
  );
}

/** Rows fold away instead of jumping; the content stays while it folds. */
function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={`${s.collapse} ${open ? '' : s.collapsed}`} inert={!open}>
      <div className={s.collapseInner}>{children}</div>
    </div>
  );
}

function SingleRow({ flavor, qty, free, onQty }: { flavor: FlavorId; qty: number; free: number; onQty: (delta: 1 | -1) => void }) {
  // Keeps the last count while the row folds away
  const shownQty = useLatest(qty > 0 ? qty : null) ?? 1;
  const shownFree = qty > 0 ? free : 0;
  return (
    <div className={s.cartRow}>
      <span className={s.rowTile}>
        <Bar flavor={flavor} left={3} top={26.5} boxW={66} boxH={19} w={66} h={19} rotate={0} />
      </span>
      <div className={s.rowInfo}>
        <p className={s.rowName}>{productTitle(flavor)}, 81 г</p>
        <Stepper count={shownQty} label={flavors[flavor].name} onMinus={() => onQty(-1)} onPlus={() => onQty(1)} />
      </div>
      <span className={s.rowPrice}>
        <Roll className={`${s.struck} ${shownFree > 0 ? '' : s.struckHidden}`} value={rub(shownQty * PRICE)} />
        <Roll value={rub((shownQty - shownFree) * PRICE)} />
      </span>
    </div>
  );
}

/** Removed sets stay in the list for the fold animation. */
function useKeepRemoved(sets: CartSet[]) {
  const [gone, setGone] = useState<CartSet[]>([]);
  const prev = useRef(sets);
  useEffect(() => {
    const removed = prev.current.filter((p) => !sets.some((x) => x.id === p.id));
    prev.current = sets;
    if (removed.length === 0) return;
    setGone((g) => [...g, ...removed]);
    const t = window.setTimeout(() => setGone((g) => g.filter((x) => !removed.includes(x))), 460);
    return () => window.clearTimeout(t);
  }, [sets]);
  const all = [...sets.map((set) => ({ set, removed: false })), ...gone.map((set) => ({ set, removed: true }))];
  return all;
}
