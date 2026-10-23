import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { scenarioOrder, scenarios, type ScenarioId } from '../data/delivery';
import { Icon } from './Icon';
import s from './DeliverySlider.module.css';

type Props = {
  value: ScenarioId;
  /** Called as soon as the nearest stop changes, also while dragging. */
  onChange: (value: ScenarioId) => void;
};

const last = scenarioOrder.length - 1;

export function DeliverySlider({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const index = scenarioOrder.indexOf(value);
  const [drag, setDrag] = useState<number | null>(null);
  const position = drag ?? index / last;

  const pick = (next: number) => {
    const clamped = Math.max(0, Math.min(last, next));
    const id = scenarioOrder[clamped];
    if (id && id !== value) onChange(id);
  };

  // The device can be scaled on desktop, so convert from screen to slider units.
  const positionAt = (clientX: number) => {
    const el = ref.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const scale = rect.width / el.offsetWidth || 1;
    const inset = 22 * scale;
    return Math.max(0, Math.min(1, (clientX - rect.left - inset) / (rect.width - inset * 2)));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = positionAt(event.clientX);
    setDrag(p);
    pick(Math.round(p * last));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag === null) return;
    const p = positionAt(event.clientX);
    setDrag(p);
    pick(Math.round(p * last));
  };

  const onPointerEnd = () => {
    if (drag === null) return;
    pick(Math.round(drag * last));
    setDrag(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
    if (step !== undefined) {
      event.preventDefault();
      pick(index + step);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      pick(event.key === 'Home' ? 0 : last);
    }
  };

  const className = [s.slider, drag === null && s.animated, drag !== null && s.dragging]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={ref}
      className={className}
      style={{ '--p': position } as CSSProperties}
      role="slider"
      tabIndex={0}
      aria-label="Как привезти"
      aria-valuemin={0}
      aria-valuemax={last}
      aria-valuenow={index}
      aria-valuetext={scenarios[value].label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
    >
      <div className={s.track} />
      <div className={s.fill} />
      {scenarioOrder.map((id, i) => (
        <span
          key={id}
          className={`${s.dot} ${i <= index ? s.dotOn : ''}`}
          style={{ left: `calc(22px + (100% - 44px) * ${i / last})` }}
        />
      ))}
      <div className={s.thumb}>
        <Icon name="swap" size={22} stroke={2.2} />
      </div>
      {scenarioOrder.map((id, i) => (
        <span key={id} className={`${s.label} ${s[`label${i}`]} ${i === index ? s.labelOn : ''}`}>
          {scenarios[id].label}
        </span>
      ))}
    </div>
  );
}
