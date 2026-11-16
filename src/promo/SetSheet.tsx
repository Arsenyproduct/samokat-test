import { useEffect, useState } from 'react';
import { flavorOrder, flavors, productTitle, rub, PRICE, SET_PRICE, type FlavorId } from './data';
import { Bar, useDragToClose, useLatest, usePresence } from './ui';
import s from './SetSheet.module.css';

export type SetSheetView = {
  /** build: сценарий 2, the set is put together from the tray; card: a flavour chip of the set card; cart: a set in the cart */
  context: 'build' | 'card' | 'cart';
  /** null is an empty slot («Выбрать») */
  flavors: (FlavorId | null)[];
  view: 'positions' | 'replace';
  index: number;
  /** Opened straight on the replace list (a flavour chip of the set): one pick closes it */
  direct?: boolean;
};

type Props = {
  sheet: SetSheetView | null;
  onChange: (sheet: SetSheetView) => void;
  onReplace: (index: number, flavor: FlavorId) => void;
  onPrimary: () => void;
  onClose: () => void;
};

const POSITIONS_H = 606;
const ROW_STEP = 86;

/**
 * E3 · Шторка набора (642:3899, 655:1206) and E3 · Замена вкуса (642:4476);
 * from the cart it is the same sheet with «Вернуться в корзину» (642:4060).
 * A flavour chip opens the list straight away (655:1091, 661:1332).
 */
export function SetSheet({ sheet: live, onChange, onReplace, onPrimary, onClose }: Props) {
  const { mounted, shown } = usePresence(live !== null, 480);
  const sheet = useLatest(live);
  const drag = useDragToClose(onClose, 90);
  // The radio fills first, then the list gives way to the positions
  const [picked, setPicked] = useState<FlavorId | null>(null);
  useEffect(() => setPicked(null), [sheet?.view, sheet?.index]);

  if (!mounted || !sheet) return null;

  const replace = sheet.view === 'replace';
  const height = replace ? 14 + flavorOrder.length * ROW_STEP + 22 : POSITIONS_H;
  const current = sheet.flavors[sheet.index] ?? null;
  const free = sheet.index === 2;
  const complete = sheet.flavors.every(Boolean);
  const firstEmpty = sheet.flavors.findIndex((f) => !f);

  const pick = (f: FlavorId) => {
    if (picked) return;
    setPicked(f);
    window.setTimeout(() => {
      onReplace(sheet.index, f);
      if (sheet.direct) onClose();
      else onChange({ ...sheet, flavors: sheet.flavors.map((x, i) => (i === sheet.index ? f : x)), view: 'positions' });
    }, 260);
  };

  const style = {
    // Short screens: the sheet stops under the status bar and its list scrolls
    height: `min(calc(${height}px + var(--safe-bottom)), calc(100% - 60px))`,
    ...(drag.dy > 0 ? { transform: `translateY(${drag.dy}px)` } : null),
    ...(drag.dragging ? { transition: 'none' } : null),
  };

  return (
    <div className={`${s.layer} ${shown ? s.shown : ''}`} inert={!live}>
      <div
        className={s.dim}
        onClick={() => (replace && !sheet.direct ? onChange({ ...sheet, view: 'positions' }) : onClose())}
      />
      <div className={s.sheet} style={style} {...drag.handlers} role="dialog" aria-label="3 вкуса по цене 2">
        <span className={s.grabber} />
        <div className={s.clip}>
        {/* Positions */}
        <div className={`${s.page} ${replace ? s.pageOut : ''}`} inert={replace}>
          <div className={s.cards}>
          <div className={s.cardsInner}>
          <p className={s.title}>3 вкуса по цене 2</p>
          <p className={s.subtitle}>Третий за 0 ₽</p>
          {sheet.flavors.map((f, i) => (
            <div key={i} className={s.position} style={{ top: 106 + i * 122 }}>
              <span className={s.posPhoto}>
                {f && <Bar key={f} className={s.swapIn} flavor={f} left={6} top={36} boxW={84} boxH={24} w={84} h={24} rotate={0} />}
              </span>
              <p key={`n-${f}`} className={`${s.posName} ${s.swapIn}`}>
                {f ? productTitle(f) : i < 2 && sheet.flavors.filter((x) => !x).length > 1 ? 'Выберите второй вкус' : 'Ещё один товар и акция сработает'}
              </p>
              <button type="button" className={s.replaceButton} onClick={() => onChange({ ...sheet, view: 'replace', index: i })}>
                {f ? 'Заменить' : 'Выбрать'}
              </button>
              {i === 2 ? (
                <span className={`${s.posPrice} ${s.posPriceFree}`}>
                  {f && <s>{rub(PRICE)}</s>}
                  <b>0 ₽</b>
                </span>
              ) : (
                <span className={s.posPrice}>
                  <b>{rub(PRICE)}</b>
                </span>
              )}
            </div>
          ))}
          </div>
          </div>
          <button
            type="button"
            className={s.primary}
            onClick={() =>
              // «Добавить набор» with an empty slot opens the list for it first
              sheet.context === 'build' && !complete ? onChange({ ...sheet, view: 'replace', index: firstEmpty }) : onPrimary()
            }
          >
            <span key={sheet.context === 'build' ? String(complete) : 'cart'} className={s.swapIn}>
              {sheet.context === 'cart' ? 'Вернуться в корзину' : complete ? `Добавить за ${rub(SET_PRICE)}` : 'Добавить набор'}
            </span>
          </button>
        </div>

        {/* Replace list */}
        <div className={`${s.page} ${replace ? '' : s.pageNext}`} inert={!replace}>
          {flavorOrder.map((f, i) => {
            const on = (picked ?? current) === f;
            return (
              <button
                key={f}
                type="button"
                className={s.row}
                style={{ top: 14 + i * ROW_STEP }}
                onClick={() => pick(f)}
                aria-pressed={on}
              >
                <span className={s.rowPhoto}>
                  <Bar flavor={f} left={6.69} top={24} boxW={45.63} boxH={13.04} w={45.63} h={13.04} rotate={0} />
                </span>
                <span className={s.rowName}>{productTitle(f)}</span>
                <span className={s.rowPrice}>
                  {free ? (
                    <>
                      <s>{rub(PRICE)}</s>
                      <b>0 ₽</b>
                    </>
                  ) : (
                    <b className={s.rowPricePaid}>{rub(PRICE)}</b>
                  )}
                </span>
                <span className={`${s.radio} ${on ? s.radioOn : ''}`}>
                  <svg width="19" height="19" viewBox="0 0 19 19" fill="none" aria-hidden="true">
                    <path d="M4.8 10.2L8.3 13L14 5.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            );
          })}
          <span className="visually-hidden">{current ? `Выберите вкус вместо «${flavors[current].name}»` : 'Выберите вкус'}</span>
        </div>
        </div>
      </div>
    </div>
  );
}
