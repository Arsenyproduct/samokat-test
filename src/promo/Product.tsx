import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { details, facts, flavorList, flavorOrder, flavors, img, PRICE, productTitle, rub, SET_FULL, SET_PRICE, type FlavorId } from './data';
import { singlesTotals, useStore } from './store';
import { Icons, Roll, SetThumb104, useLatest, usePresence, useScrollSheetDrag } from './ui';
import s from './Product.module.css';

export type ProductView = {
  flavor: FlavorId;
  mode: 'single' | 'set';
  /** Cart set this card shows in the set mode */
  setId: string | null;
  setFlavors: FlavorId[];
};

type Props = {
  view: ProductView | null;
  flying: boolean;
  tooltip: boolean;
  onCloseTooltip: () => void;
  onClose: () => void;
  onFlavor: (flavor: FlavorId) => void;
  onOpenSet: () => void;
  onEditSetFlavor: (index: number) => void;
  onAddSetAgain: () => void;
};

/** E2 · Карточка: набор как комбо (642:3783), with the stepper of 642:3838 */
export function Product(props: Props) {
  const { view: liveView, flying, tooltip, onCloseTooltip, onClose, onFlavor, onOpenSet, onEditSetFlavor, onAddSetAgain } = props;
  const { mounted, shown } = usePresence(liveView !== null, 480);
  const view = useLatest(liveView);
  const { state, dispatch } = useStore();
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useScrollSheetDrag(sheetRef, scrollRef, onClose, mounted);
  const isSet = view?.mode === 'set';

  // The set takes shape on the photo, so the card scrolls back to the top
  useEffect(() => {
    if (isSet) scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isSet]);
  // A new product opens from the top
  useLayoutEffect(() => {
    if (liveView === null) return;
    scrollRef.current?.scrollTo({ top: 0 });
  }, [liveView === null]); // eslint-disable-line react-hooks/exhaustive-deps

  // The flight ends on the add bar, whatever the screen height
  const [flyY, setFlyY] = useState(554);
  useLayoutEffect(() => {
    if (flying && sheetRef.current) setFlyY(sheetRef.current.clientHeight - 96 + 36 - 182);
  }, [flying]);

  if (!mounted || !view) return null;

  const { flavor } = view;
  const setMode = view.mode === 'set';
  const cartSet = view.setId ? state.sets.find((x) => x.id === view.setId) : undefined;
  const setFlavors = cartSet?.flavors ?? view.setFlavors;
  const setQty = cartSet?.qty ?? 0;
  const qty = state.singles[flavor];
  const singles = singlesTotals(state.singles);
  const fav = state.favorites.includes(flavor);

  // Add bar: «89 ₽ +», then «2 х 89 ₽» with − / + and the hint under it
  const stepper = setMode ? setQty > 0 && !flying : qty > 0;
  const left = 3 - (singles.count % 3);
  const caption = setMode
    ? 'Набор в корзине'
    : left === 3
      ? 'Скидка сработала'
      : `Еще ${left} до скидки`;

  const sheetStyle = drag.dragging
    ? { transform: `translateY(${drag.dy}px)`, transition: 'none' }
    : drag.dy > 0
      ? { transform: `translateY(${drag.dy}px)` }
      : undefined;

  return (
    <div className={`${s.layer} ${shown ? s.shown : ''}`} inert={!liveView}>
      <div className={s.backdrop} onClick={onClose} />
      <div ref={sheetRef} className={s.sheet} style={sheetStyle} role="dialog" aria-label={setMode ? 'Набор Snickers' : productTitle(flavor)}>
        <div ref={scrollRef} className={s.scroll}>
        {/* Photo 370×330 at (10,10), r22 */}
        <div className={`${s.photo} ${setMode ? s.setMode : ''}`}>
          {flavorOrder.map((f) => (
            <img
              key={f}
              className={s.heroImg}
              src={img.hero(f)}
              alt=""
              draggable={false}
              style={{ opacity: !setMode && f === flavor ? 1 : 0 }}
            />
          ))}
          <div className={s.bars} aria-hidden="true">
            <img className={`${s.heroBar} ${s.barTop}`} src={img.bar(setFlavors[2]!)} alt="" draggable={false} />
            <img className={`${s.heroBar} ${s.barBottom}`} src={img.bar(setFlavors[1]!)} alt="" draggable={false} />
            <img className={`${s.heroBar} ${s.barMid}`} src={img.bar(setMode ? setFlavors[0]! : flavor)} alt="" draggable={false} />
          </div>
        </div>

        <span className={s.promoTag}>3 по цене 2</span>
        <button type="button" className={`${s.iconButton} ${s.heart} ${fav ? s.heartOn : ''}`} aria-label="В избранное" aria-pressed={fav} onClick={() => dispatch({ type: 'favorite', flavor })}>
          <Icons.heart size={22} filled={fav} />
        </button>
        <button type="button" className={`${s.iconButton} ${s.close}`} aria-label="Закрыть" onClick={onClose}>
          <Icons.close size={22} />
        </button>

        {/* Content at (0,356), px20, gap14 */}
        <div className={s.content}>
          <div key={setMode ? 'set' : 'single'} className={`${s.swap} ${setMode ? s.swapSet : ''}`}>
            <h2 className={s.title}>{setMode ? 'Snickers, 3 вкуса по цене 2' : productTitle(flavor)}</h2>
            <p className={s.weight}>{setMode ? '3 × 81 г' : '81 г'}</p>
            <div className={s.flavors}>
              <p className={s.label}>{setMode ? 'Вкусы в наборе' : 'Вкус'}</p>
              <div className={s.chips}>
                {setMode
                  ? setFlavors.map((f, i) => (
                      <button key={i} type="button" className={s.chip} onClick={() => onEditSetFlavor(i)}>
                        <span key={f} className={s.chipName}>
                          {flavors[f].name}
                        </span>
                      </button>
                    ))
                  : [
                      ...flavorOrder.map((f) => (
                        <button
                          key={f}
                          type="button"
                          className={`${s.chip} ${f === flavor ? s.chipOn : ''}`}
                          aria-pressed={f === flavor}
                          onClick={() => onFlavor(f)}
                        >
                          {flavors[f].name}
                        </button>
                      )),
                      <span key="espresso" className={`${s.chip} ${s.chipStatic}`}>
                        Эспрессо
                      </span>,
                    ]}
              </div>
            </div>
          </div>

          {/* Набор · как комбо */}
          <div className={`${s.setBlock} ${setMode ? s.setBlockHidden : ''}`} inert={setMode}>
            <div className={s.setInner}>
              <div className={s.divider} />
              <button type="button" className={s.setRow} onClick={onOpenSet}>
                <span className={s.setPhoto}>
                  <SetThumb104 flavors={view.setFlavors} />
                  <span className={s.setTag}>−33%</span>
                </span>
                <span className={s.setText}>
                  <span className={s.setTitle}>3 вкуса по цене 2</span>
                  <span className={s.setSub}>{flavorList(view.setFlavors)}</span>
                  <span className={s.setSpacer} />
                  <span className={s.setPrice}>
                    <b>{rub(SET_PRICE)}</b>
                    <s>{rub(SET_FULL)}</s>
                    <span className={s.arrow}>→</span>
                  </span>
                </span>
              </button>
              <div className={s.divider} />
            </div>
          </div>
                  <Details setMode={setMode} flavor={flavor} setFlavors={setFlavors} />
        </div>
        </div>

        {/* Add bar, #ff335f, h96 at 700 */}
        <div className={`${s.addBar} ${stepper ? s.addStepper : ''}`} data-landed={setMode && setQty > 0 ? setQty : undefined}>
          <button
            type="button"
            className={s.addSimple}
            tabIndex={stepper ? -1 : 0}
            onClick={() => (setMode ? onAddSetAgain() : dispatch({ type: 'single', flavor, delta: 1 }))}
          >
            <Roll value={rub(setMode ? SET_PRICE : PRICE)} />
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
              <path d="M13 5.42V20.58M5.42 13H20.58" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className={s.addStep} inert={!stepper}>
            <div className={s.stepRow}>
              <button
                type="button"
                className={`${s.stepButton} ${s.stepMinus}`}
                aria-label="Убрать одну"
                onClick={() =>
                  setMode && view.setId
                    ? dispatch({ type: 'setQty', id: view.setId, delta: -1 })
                    : dispatch({ type: 'single', flavor, delta: -1 })
                }
              >
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                  <path d="M5.42 13H20.58" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
              <Roll
                className={s.stepLabel}
                value={setMode ? `${Math.max(1, setQty)} х ${rub(SET_PRICE)}` : `${Math.max(1, qty)} х ${rub(PRICE)}`}
              />
              <button
                type="button"
                className={`${s.stepButton} ${s.stepPlus}`}
                aria-label="Добавить ещё"
                onClick={() =>
                  setMode && view.setId
                    ? dispatch({ type: 'setQty', id: view.setId, delta: 1 })
                    : dispatch({ type: 'single', flavor, delta: 1 })
                }
              >
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                  <path d="M13 5.42V20.58M5.42 13H20.58" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className={s.caption}>
              <Roll value={caption} />
            </p>
          </div>
        </div>

        {/* The set leaves the photo for the add bar */}
        {flying && (
          <div className={`${s.ghost} ${s.setMode}`} style={{ ['--fly-y' as string]: `${flyY}px` }} aria-hidden="true">
            <div className={s.bars}>
              <img className={`${s.heroBar} ${s.barTop}`} src={img.bar(setFlavors[2]!)} alt="" />
              <img className={`${s.heroBar} ${s.barBottom}`} src={img.bar(setFlavors[1]!)} alt="" />
              <img className={`${s.heroBar} ${s.barMid}`} src={img.bar(setFlavors[0]!)} alt="" />
            </div>
          </div>
        )}

        <Tooltip open={tooltip && !setMode && qty > 0} onClose={onCloseTooltip} />
      </div>
    </div>
  );
}

/** DS Tooltip (641:226), Arrow=Bottom, above the add bar (top 633) */
function Tooltip({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mounted, shown } = usePresence(open, 220);
  if (!mounted) return null;
  return (
    <div className={`${s.tooltip} ${shown ? s.tooltipShown : ''}`} role="status">
      <div className={s.tooltipBody}>
        <p>
          Любые 3 вкуса —
          <br />и скидка сработает
        </p>
        <button type="button" className={s.tooltipClose} aria-label="Скрыть подсказку" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <svg className={s.tooltipArrow} width="18" height="9" viewBox="0 0 18 9" fill="none" aria-hidden="true">
        <path d="M0 0H18L11.83 6.17C10.27 7.73 7.73 7.73 6.17 6.17L0 0Z" fill="currentColor" />
      </svg>
    </div>
  );
}

/** Below the fold: nutrition, description, composition and facts */
function Details({ setMode, flavor, setFlavors }: { setMode: boolean; flavor: FlavorId; setFlavors: FlavorId[] }) {
  if (setMode) {
    return (
      <div key="set" className={`${s.details} ${s.swap} ${s.swapSet}`}>
        <div className={s.divider} />
        <section className={s.section}>
          <h3 className={s.h3}>Описание</h3>
          <p className={s.text}>Три батончика Snickers по 81 г. Вкусы меняются до оформления заказа.</p>
        </section>
        {setFlavors.map((f, i) => (
          <section key={`${i}-${f}`} className={s.section}>
            <h3 className={s.h3}>Состав: {flavors[f].lower}</h3>
            <p className={s.text}>{details[f].composition}</p>
          </section>
        ))}
        <Facts />
      </div>
    );
  }
  const d = details[flavor];
  const n = d.nutrition;
  return (
    <div key={flavor} className={`${s.details} ${s.swap}`}>
      <section className={s.section}>
        <p className={s.label}>В 100 граммах</p>
        <div className={s.nutrition}>
          {[
            [n.kcal, 'ккал'],
            [n.protein, 'белки'],
            [n.fat, 'жиры'],
            [n.carbs, 'углеводы'],
          ].map(([value, label]) => (
            <div key={label} className={s.nutrient}>
              <b>{String(value).replace('.', ',')}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className={s.section}>
        <h3 className={s.h3}>Описание</h3>
        <p className={s.text}>{d.about}</p>
      </section>
      <section className={s.section}>
        <h3 className={s.h3}>Состав</h3>
        <p className={s.text}>{d.composition}</p>
      </section>
      <Facts />
    </div>
  );
}

function Facts() {
  return (
    <dl className={s.facts}>
      {facts.map(([term, value]) => (
        <div key={term} className={s.fact}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
