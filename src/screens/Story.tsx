import type { StoreId } from '../data/catalog';
import { Button, IconButton, StoreLogo } from '../components/ui';
import { useRouter } from '../state/router';
import { Screen, screenStyles } from './Screen';
import s from './Story.module.css';

// Copy from frame 372:130.
const rows: { value: string; unit: string; title: string; note: string; logo: StoreId }[] = [
  { value: '10', unit: 'мин', title: 'еАптека', note: 'Лекарства, уход', logo: 'eapteka' },
  { value: '15', unit: 'мин', title: 'Самокат', note: 'Продукты на каждый день', logo: 'samokat' },
  { value: '1', unit: 'час', title: 'Шоколадница, 4 лапы', note: 'Готовые блюда и зоотовары', logo: '4lapy' },
  { value: '3+', unit: 'часа', title: 'Лента', note: 'Крупные закупки', logo: 'lenta' },
];

export function Story() {
  const { navigate, back } = useRouter();

  return (
    <Screen label="История" className={s.screen}>
      <div className={`${screenStyles.scroll} ${s.scroll}`}>
        <div className={s.progress} aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={s.segment}>
              {i === 0 && <span className={s.segmentFill} style={{ display: 'block' }} />}
            </span>
          ))}
        </div>

        <IconButton icon="close" iconSize={20} label="Закрыть" className={s.close} onClick={back} />

        <h1 className={`t-story ${s.title}`}>Что привезём первым</h1>
        <p className={`t-body-m ${s.subtitle}`}>Одним заказом, но каждому товару свой срок доставки</p>

        <ul className={s.timeline} role="list" style={{ listStyle: 'none', padding: 0 }}>
          {rows.map((row) => (
            <li key={row.title} className={s.row}>
              <span className={s.time}>
                <span className="t-num-24">{row.value}</span>
                <span className={`t-caption ${s.unit}`}>{row.unit}</span>
              </span>
              <span className={s.text}>
                <span className="t-h3">{row.title}</span>
                <span className={`t-body-s ${s.unit}`}>{row.note}</span>
              </span>
              <StoreLogo store={row.logo} size={17} />
            </li>
          ))}
        </ul>

        <div className={s.spacer} />

        <div className={s.bottom}>
          <p className={`t-body-s ${s.unit}`}>
            Срок доставки виден на карточке каждого партнёрского товара. Оплата одна за всё.
          </p>
          <Button onClick={() => navigate({ name: 'catalog' })}>К товарам</Button>
        </div>
      </div>
    </Screen>
  );
}
