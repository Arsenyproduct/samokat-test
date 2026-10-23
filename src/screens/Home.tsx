import { images, products } from '../data/catalog';
import { Icon, type IconName } from '../components/Icon';
import { StatusBar } from '../components/ui';
import { useRouter, type Route } from '../state/router';
import { Screen, screenStyles } from './Screen';
import s from './Home.module.css';

const quickLinks: { label: string; icon: IconName; to: Route; muted?: boolean }[] = [
  { label: 'Каталог', icon: 'grid', to: { name: 'catalog' } },
  { label: 'Скидки', icon: 'pct', to: { name: 'collection' } },
  { label: 'Что нового', icon: 'flame', to: { name: 'collection' } },
  { label: 'Заказывали', icon: 'redo', to: { name: 'collection' } },
  { label: 'Сохранёнки', icon: 'heart', to: { name: 'collection' }, muted: true },
];

const collections = [
  { label: 'Готовая еда', image: products.combo.image },
  { label: 'Всё горячее', image: products.cookie.image },
  { label: 'Наш бренд', image: products.milk.image },
  { label: 'Цены ниже', image: products.ice.image },
];

export function Home() {
  const { navigate } = useRouter();

  return (
    <Screen label="Главная">
      <div className={`${screenStyles.scroll} ${s.scroll}`}>
        <div className={s.hero}>
          <img className={s.heroImage} src={images.island} alt="" />
          <div className={s.scrim} />
          <button type="button" className={s.news} onClick={() => navigate({ name: 'story' })}>
            <span className={`t-h1 ${s.newsTitle}`}>Аптека, зоомагазин и кафе теперь в Самокате</span>
            <span className={`t-button-l ${s.newsCta}`}>Смотреть</span>
          </button>
          <div className={s.address}>
            <span className={s.addressLine}>
              <span className="t-h3">Зеленоград, к828</span>
              <Icon name="chevD" size={18} />
            </span>
            <span className="t-body-s">Доставка от 15 минут</span>
          </div>
          <div className={s.avatar} aria-hidden="true">
            <Icon name="user" size={20} />
          </div>
          <div className={s.dots} aria-hidden="true">
            <span className={`${s.dot} ${s.dotActive}`} />
            <span className={s.dot} />
            <span className={s.dot} />
            <span className={s.dot} />
            <span className={s.dot} />
          </div>
        </div>

        <div className={s.sheet}>
          <div className={s.games}>
            <span className={`t-caption ${s.secondary}`}>Игры и задания</span>
            <span className="t-h3">Ооооострова с призами</span>
          </div>

          <nav className={s.quick} aria-label="Разделы">
            {quickLinks.map((link) => (
              <button key={link.label} type="button" className={s.quickItem} onClick={() => navigate(link.to)}>
                <span className={s.quickIcon}>
                  <Icon
                    name={link.icon}
                    size={24}
                    stroke={2.2}
                    className={link.muted ? s.iconMuted : undefined}
                  />
                </span>
                <span className="t-caption">{link.label}</span>
              </button>
            ))}
          </nav>

          <h2 className="t-h1">Подборки</h2>
          <div className={s.tiles}>
            {collections.map((item) => (
              <button key={item.label} type="button" className={s.tile} onClick={() => navigate({ name: 'collection' })}>
                <img className={s.tileImage} src={item.image} alt="" />
                <span className="t-caption">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <StatusBar tone="light" time="14:15" />

      <button type="button" className={s.search} onClick={() => navigate({ name: 'catalog' })}>
        <Icon name="search" size={22} />
        <span className="t-button-l">Поиск</span>
      </button>
    </Screen>
  );
}
