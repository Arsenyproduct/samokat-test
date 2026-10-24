import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { images, products } from '../data/catalog';
import { Icon, type IconName } from '../components/Icon';
import { Button, StatusBar } from '../components/ui';
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

const newsTitle = 'Аптека, зоомагазин, кафе и гипермаркеты теперь в Самокате';

/** How far the closed sheet has to be pulled up to return home. */
const PULL_TO_CLOSE = 56;

/**
 * Главная / C. Фото партнёров (465:197) and Новость / C. История (465:280) in one
 * screen: opening the story drops the main sheet down to a handle and grows the
 * photo into the story card, pulling the handle up brings the home back.
 */
export function Home() {
  const { route, navigate, back } = useRouter();
  const storyOpen = route.name === 'story';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState<{ start: number; dy: number } | null>(null);
  // Releasing a pull fires a click on whatever is under the pointer, the news included.
  const pullEndedAt = useRef(0);

  // The photo lives at the top of the scroll, so the story always starts from there.
  useLayoutEffect(() => {
    if (storyOpen) scrollRef.current?.scrollTo({ top: 0 });
  }, [storyOpen]);

  // The card and the closed sheet are placed from the bottom, so they need the screen height.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => el.style.setProperty('--screen-h', `${el.clientHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!storyOpen) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPull({ start: e.clientY, dy: 0 });
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (pull) setPull({ start: pull.start, dy: e.clientY - pull.start });
  };
  const onPointerUp = () => {
    if (!pull) return;
    // A tap or a pull up returns home; a short drag springs back.
    if (Math.abs(pull.dy) < 6 || -pull.dy >= PULL_TO_CLOSE) back();
    pullEndedAt.current = Date.now();
    setPull(null);
  };

  const openStory = () => {
    if (Date.now() - pullEndedAt.current > 400) navigate({ name: 'story' });
  };

  const lift = pull ? Math.max(0, -pull.dy) : 0;
  const sheetStyle = lift > 0 ? { transform: `translateY(calc(var(--sheet-closed) - ${lift}px))`, transition: 'none' } : undefined;

  return (
    <Screen label={storyOpen ? 'История' : 'Главная'} className={`${s.screen} ${storyOpen ? s.story : ''}`}>
      <div className={`${screenStyles.scroll} ${s.scroll}`} ref={scrollRef}>
        <div className={s.hero}>
          <div className={s.card}>
            <img className={s.photo} src={images.partners} alt="" />
            <div className={s.scrimTop} />
            <div className={s.scrim} />
            <div className={s.scrimBottom} />

            <div className={s.homeLayer} inert={storyOpen}>
              <button type="button" className={s.news} onClick={openStory}>
                <span className={`t-h2 ${s.newsTitle}`}>{newsTitle}</span>
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

            <div className={s.storyLayer} inert={!storyOpen}>
              <div className={s.progress} aria-hidden="true">
                <span className={s.segment}>
                  <span className={s.segmentFill} />
                </span>
                <span className={s.segment} />
                <span className={s.segment} />
                <span className={s.segment} />
                <button type="button" className={s.close} aria-label="Закрыть" onClick={back}>
                  <Icon name="close" size={16} stroke={2.2} />
                </button>
              </div>
              <p className={s.label}>Новое в Самокате</p>
              <h1 className={s.storyTitle}>{newsTitle}</h1>
              <p className={s.subtitle}>
                Один заказ и одна оплата. У партнёров свой срок доставки, он виден на карточке товара.
              </p>
              <Button className={s.toCatalog} onClick={() => navigate({ name: 'catalog' })}>
                К товарам
              </Button>
            </div>
          </div>
        </div>

        <div
          className={s.sheet}
          style={sheetStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setPull(null)}
        >
          <div className={s.handle} aria-hidden={!storyOpen}>
            <svg className={s.chevron} width="19" height="10" viewBox="0 0 19 10" fill="none" aria-hidden="true">
              <path d="M1.1 8.1 9.1 1.1l8 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={s.hint}>Тяните вверх, чтобы вернуться</span>
          </div>

          <div className={s.sheetBody} inert={storyOpen}>
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
      </div>

      <StatusBar tone="light" time="14:15" />

      <button
        type="button"
        className={s.search}
        inert={storyOpen}
        onClick={() => navigate({ name: 'catalog' })}
      >
        <Icon name="search" size={22} />
        <span className="t-button-l">Поиск</span>
      </button>
    </Screen>
  );
}
