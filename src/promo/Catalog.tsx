import { flavors, rub, type FlavorId } from './data';
import { totals, useStore } from './store';
import { Bar, Icons, Roll } from './ui';
import { Tray } from './Tray';
import s from './Catalog.module.css';

type Card = { kind: 'single'; flavor: FlavorId } | { kind: 'set' };

// E1 grid, in the order of the frame
const cards: Card[] = [
  { kind: 'single', flavor: 'les' },
  { kind: 'single', flavor: 'arahis' },
  { kind: 'single', flavor: 'bel' },
  { kind: 'set' },
  { kind: 'single', flavor: 'arahis' },
  { kind: 'single', flavor: 'les' },
];

type Props = {
  hidden: boolean;
  onOpen: (flavor: FlavorId) => void;
  onOpenSet: () => void;
  /** «178 ₽ +» on the «3 любых вкуса» tile */
  onAddSet: () => void;
  onBuildSet: () => void;
  onCart: () => void;
};

/** E1 · Каталог «Сладкое» (642:3734) */
export function Catalog({ hidden, onOpen, onOpenSet, onAddSet, onBuildSet, onCart }: Props) {
  const { state, dispatch } = useStore();
  const t = totals(state);
  // The cart button shows up with the first Snickers (E1 has none)
  const fabShown = t.items > 0;

  const fav = (flavor: FlavorId | null) => {
    const active = flavor !== null && state.favorites.includes(flavor);
    return (
      <button
        type="button"
        className={`${s.fav} ${active ? s.favActive : ''}`}
        aria-label="В избранное"
        aria-pressed={active}
        onClick={() => flavor && dispatch({ type: 'favorite', flavor })}
      >
        <Icons.heartSmall size={16} />
      </button>
    );
  };

  return (
    <section className={s.screen} aria-label="Сладкое" inert={hidden}>
      <div className={s.scroll}>
        <div className={s.grid}>
          {cards.map((card, i) =>
            card.kind === 'set' ? (
              <article key={i} className={s.card}>
                <button type="button" className={s.cardHit} onClick={onOpenSet} aria-label="3 любых вкуса, набор за 178 ₽" />
                <div className={s.photo} />
                <p className={s.name}>
                  3 любых вкуса
                  <br />
                  <span className={s.secondary}>Если сложно определиться</span>
                </p>
                <p className={`${s.weight} ${s.invisible}`}>81 г · </p>
                <button type="button" className={s.chip} onClick={onAddSet} aria-label="Добавить набор за 178 ₽">
                  {rub(178)}
                  <Icons.plus size={16} className={s.chipPlus} />
                </button>
                <span className={s.setBars}>
                  <Bar flavor="arahis" left={2.04} top={8.77} boxW={146.57} boxH={42.51} w={146.57} h={42.51} rotate={0} />
                  <Bar flavor="bel" left={2.04} top={43.48} boxW={146.57} boxH={42.51} w={146.57} h={42.51} rotate={0} />
                  <Bar flavor="les" left={2.04} top={76.69} boxW={146.57} boxH={42.51} w={146.57} h={42.51} rotate={0} />
                </span>
                {fav(null)}
                <span className={`${s.tag} ${s.tagDark}`}>-33%</span>
              </article>
            ) : (
              <article key={i} className={s.card}>
                <button
                  type="button"
                  className={s.cardHit}
                  onClick={() => onOpen(card.flavor)}
                  aria-label={`Шоколадный батончик Snickers, ${flavors[card.flavor].lower}`}
                />
                <div className={s.photo} />
                <p className={s.name}>Шоколадный батончик Snickers, {flavors[card.flavor].lower}</p>
                <p className={s.weight}>
                  81 г · <span className={s.green}>Любые вкусы</span>
                </p>
                {state.singles[card.flavor] > 0 ? (
                  <span className={`${s.chip} ${s.chipCount}`}>
                    <button
                      type="button"
                      className={s.chipStep}
                      aria-label={`Убрать: ${flavors[card.flavor].name}`}
                      onClick={() => dispatch({ type: 'single', flavor: card.flavor, delta: -1 })}
                    >
                      <Icons.minus size={16} />
                    </button>
                    <Roll value={state.singles[card.flavor]} className={s.chipNum} />
                    <button
                      type="button"
                      className={s.chipStep}
                      aria-label={`Добавить: ${flavors[card.flavor].name}`}
                      onClick={() => dispatch({ type: 'single', flavor: card.flavor, delta: 1 })}
                    >
                      <Icons.plus size={16} />
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={s.chip}
                    aria-label={`В корзину: ${flavors[card.flavor].name}, 89 ₽`}
                    onClick={() => dispatch({ type: 'single', flavor: card.flavor, delta: 1 })}
                  >
                    {rub(89)}
                    <Icons.plus size={16} className={s.chipPlus} />
                  </button>
                )}
                <Bar flavor={card.flavor} left={6} top={66} boxW={168} boxH={49} w={168} h={49} rotate={0} />
                {fav(card.flavor)}
                <span className={`${s.tag} ${i === 2 ? s.tagLeft10 : ''}`}>3 по цене 2</span>
              </article>
            ),
          )}
        </div>
      </div>

      <header className={s.header}>
        <button type="button" className={s.back} aria-label="Назад">
          <Icons.back size={22} />
        </button>
        <h1 className={s.title}>Сладкое</h1>
      </header>

      {/* The same tray as on the card: it shows up after the first bar */}
      <Tray
        className={s.trayPlace}
        open={!hidden && state.units.length > 0}
        units={state.units}
        onEmpty={onBuildSet}
      />

      <button type="button" className={s.search}>
        <Icons.search size={22} />
        <span>Поиск</span>
      </button>

      <button
        type="button"
        className={`${s.fab} ${fabShown ? s.fabShown : ''}`}
        onClick={onCart}
        aria-label={`Корзина, ${rub(t.items)}`}
        inert={!fabShown}
        aria-hidden={!fabShown || undefined}
      >
        <Roll value={rub(t.items)} className={s.fabPrice} />
        <span className={s.fabTime}>15 минут</span>
      </button>
    </section>
  );

}
