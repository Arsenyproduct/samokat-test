import { useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import type { FlavorId } from './data';
import { Bar, Roll, useLatest, usePresence } from './ui';
import s from './Tray.module.css';

type Props = {
  open: boolean;
  /** Bars added towards the next free one (1 or 2) */
  units: FlavorId[];
  onEmpty: () => void;
  /** Swiped to the left: not everyone needs it */
  onDismiss: () => void;
  className?: string;
};

/**
 * Лоток (651:988): dark pill with three cells. It shows up after the first bar,
 * filled cells show the bars added so far, the third one is free; a tap on an
 * empty cell opens the set with the missing slot.
 */
export function Tray({ open, units, onEmpty, onDismiss, className }: Props) {
  const { mounted, shown } = usePresence(open, 320);
  const last = useLatest(open ? units : null) ?? units;
  const swipe = useSwipeAway(onDismiss);
  if (!mounted) return null;
  const left = 3 - last.length;
  return (
    <div
      className={`${s.tray} ${shown ? s.trayShown : ''} ${swipe.gone ? s.trayGone : ''} ${className ?? ''}`}
      style={swipe.style}
      role="group"
      aria-label="Набор: 3 по цене 2. Смахните влево, чтобы скрыть"
      {...swipe.handlers}
    >
      {[0, 1, 2].map((i) => {
        const f = last[i];
        return f ? (
          <span key={`${i}-${f}`} className={`${s.cell} ${s.cellFilled}`}>
            <Bar flavor={f} left={4} top={19} boxW={42} boxH={12} w={42} h={12} rotate={0} />
          </span>
        ) : (
          <button key={i} type="button" className={s.cell} onClick={onEmpty} aria-label={i === 2 ? 'Выбрать вкус за 0 ₽' : 'Выбрать вкус'}>
            {i === 2 && <span className={s.cellFree}>0 ₽</span>}
          </button>
        );
      })}
      <p className={s.trayText}>
        <Roll value={left === 1 ? 'Ещё 1, и он за 0 ₽' : 'Ещё 2, и третий за 0 ₽'} />
      </p>
    </div>
  );
}

/** Swipe to the left: the tray follows the finger and flies off past 80 px */
function useSwipeAway(onDismiss: () => void) {
  const [dx, setDx] = useState(0);
  const [gone, setGone] = useState(false);
  const start = useRef<{ x: number; y: number; t: number; id: number } | null>(null);
  const moved = useRef(false);

  const scale = (el: Element) => {
    const device = el.closest('[data-device]') as HTMLElement | null;
    return device ? device.getBoundingClientRect().width / device.offsetWidth || 1 : 1;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (gone || e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
    moved.current = false;
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const st = start.current;
    if (!st || st.id !== e.pointerId) return;
    const x = (e.clientX - st.x) / scale(e.currentTarget);
    const y = (e.clientY - st.y) / scale(e.currentTarget);
    if (!moved.current) {
      if (Math.abs(x) > 8 && Math.abs(x) > Math.abs(y)) {
        moved.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      } else if (Math.abs(y) > 8) {
        start.current = null;
        return;
      } else return;
    }
    // To the left it follows the finger, to the right it resists
    setDx(x < 0 ? x : x / 4);
  };
  const end = (e: PointerEvent<HTMLDivElement>) => {
    const st = start.current;
    start.current = null;
    if (!st || !moved.current) return;
    const x = (e.clientX - st.x) / scale(e.currentTarget);
    const v = x / Math.max(1, performance.now() - st.t);
    if (x < -80 || (v < -0.5 && x < -24)) {
      setGone(true);
      window.setTimeout(() => {
        onDismiss();
        setGone(false);
        setDx(0);
      }, 240);
    } else setDx(0);
  };
  const onClickCapture = (e: MouseEvent) => {
    if (moved.current) {
      e.stopPropagation();
      e.preventDefault();
      moved.current = false;
    }
  };

  const dragging = start.current !== null && moved.current;
  const style = gone
    ? undefined
    : dx !== 0
      ? { transform: `translateX(${dx}px)`, opacity: Math.max(0.3, 1 + dx / 300), transition: dragging ? 'none' : undefined }
      : undefined;
  return { gone, style, handlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end, onClickCapture } };
}
