import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { img, type FlavorId } from './data';
import s from './ui.module.css';

/* ---------- Status bar «14:16» (every frame) ---------- */

export function StatusBar({ light, dim }: { light: boolean; dim?: boolean }) {
  return (
    <div className={`${s.status} ${light ? s.statusLight : ''} ${dim ? s.statusDim : ''}`} aria-hidden="true">
      <span className={s.time}>14:16</span>
      <span className={s.battery} />
      <span className={s.batteryFill} />
    </div>
  );
}

/* ---------- Icons, geometry exported from the Figma vectors ---------- */

type IconProps = { size: number; className?: string; style?: CSSProperties };

export const Icons = {
  back: ({ size, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className} aria-hidden="true">
      <path d="M17.42 11H4.58M10.08 16.5L4.58 11L10.08 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  close: ({ size, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className} aria-hidden="true">
      <path d="M5.5 5.5L16.5 16.5M16.5 5.5L5.5 16.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  heart: ({ size, className, filled }: IconProps & { filled?: boolean }) => (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className} aria-hidden="true">
      <path
        d="M11 18.33C11 18.33 4.58 14.3 4.58 9.17C4.61 8.43 4.86 7.72 5.29 7.13C5.72 6.54 6.32 6.09 7.01 5.84C7.71 5.6 8.45 5.56 9.17 5.75C9.88 5.93 10.52 6.32 11 6.88C11.48 6.32 12.12 5.93 12.83 5.75C13.55 5.56 14.29 5.6 14.99 5.84C15.68 6.09 16.28 6.54 16.71 7.13C17.14 7.72 17.39 8.43 17.42 9.17C17.42 14.3 11 18.33 11 18.33Z"
        stroke="currentColor"
        fill={filled ? 'currentColor' : 'none'}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  /** Filled 16 px heart of the catalog card */
  heartSmall: ({ size, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 13.33C8 13.33 3.33 10.4 3.33 6.67C3.35 6.13 3.53 5.62 3.85 5.19C4.16 4.76 4.6 4.43 5.1 4.25C5.6 4.07 6.15 4.05 6.67 4.18C7.18 4.31 7.65 4.6 8 5C8.35 4.6 8.82 4.31 9.33 4.18C9.85 4.05 10.4 4.07 10.9 4.25C11.4 4.43 11.84 4.76 12.15 5.19C12.47 5.62 12.65 6.13 12.67 6.67C12.67 10.4 8 13.33 8 13.33Z"
        fill="currentColor"
      />
    </svg>
  ),
  plus: ({ size, className, stroke = 1.92 }: IconProps & { stroke?: number }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M8 3.33V12.67M3.33 8H12.67" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  ),
  minus: ({ size, className, stroke = 1.92 }: IconProps & { stroke?: number }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M3.33 8H12.67" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  ),
  search: ({ size, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className} aria-hidden="true">
      <path d="M10.08 16.04C13.37 16.04 16.04 13.37 16.04 10.08C16.04 6.79 13.37 4.13 10.08 4.13C6.79 4.13 4.13 6.79 4.13 10.08C4.13 13.37 6.79 16.04 10.08 16.04Z" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.33 18.33L14.21 14.21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chevD: ({ size, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chevR: ({ size, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/* ---------- Snickers bar: a rotated layer inside its Figma bounding box ---------- */

type BarProps = {
  flavor: FlavorId;
  /** Bounding box of the rotated layer, as Figma exports it */
  left: number;
  top: number;
  boxW: number;
  boxH: number;
  /** Size of the bar itself and its rotation (CSS degrees) */
  w: number;
  h: number;
  rotate: number;
  className?: string;
};

export function Bar({ flavor, left, top, boxW, boxH, w, h, rotate, className }: BarProps) {
  return (
    <span className={`${s.barBox} ${className ?? ''}`} style={{ left, top, width: boxW, height: boxH }} aria-hidden="true">
      <img
        className={s.bar}
        src={img.bar(flavor)}
        alt=""
        draggable={false}
        style={{ width: w, height: h, transform: rotate ? `rotate(${rotate}deg)` : undefined }}
      />
    </span>
  );
}

/** Three bars as the set thumbnail (E2 «Фото · набор», 104 px) */
export function SetThumb104({ flavors }: { flavors: FlavorId[] }) {
  return (
    <>
      <Bar flavor={flavors[2]!} left={5.91} top={14.18} boxW={92.188} boxH={38.195} w={89.44} h={26} rotate={8} />
      <Bar flavor={flavors[1]!} left={6.48} top={35.91} boxW={91.036} boxH={32.176} w={89.44} h={26} rotate={-4} />
      <Bar flavor={flavors[0]!} left={6.66} top={55.4} boxW={90.678} boxH={30.645} w={89.44} h={26} rotate={3} />
    </>
  );
}

/** Three bars of the cart row (E4 «Фото · набор», 72 px) */
export function SetThumb72({ flavors }: { flavors: FlavorId[] }) {
  return (
    <>
      <Bar flavor={flavors[2]!} left={7.37} top={5.92} boxW={61.256} boxH={36.154} w={59} h={17} rotate={20} />
      <Bar flavor={flavors[1]!} left={5.98} top={27.46} boxW={60.042} boxH={21.074} w={59} h={17} rotate={4} />
      <Bar flavor={flavors[0]!} left={3.47} top={38.51} boxW={61.056} boxH={26.987} w={59} h={17} rotate={-10} />
    </>
  );
}

/* ---------- Stepper (DS «Stepper»: 6/8 padding, 16 px glyphs, Bold 15/22) ---------- */

export function Stepper({ count, onMinus, onPlus, label }: { count: number; onMinus: () => void; onPlus: () => void; label: string }) {
  return (
    <div className={s.stepper}>
      <button type="button" className={s.stepperButton} aria-label={`Убрать: ${label}`} onClick={onMinus}>
        <Icons.minus size={16} />
      </button>
      <Roll value={count} className={s.stepperCount} />
      <button type="button" className={s.stepperButton} aria-label={`Добавить: ${label}`} onClick={onPlus}>
        <Icons.plus size={16} />
      </button>
    </div>
  );
}

/**
 * A value that rolls when it changes: the old one leaves upwards (downwards
 * when the number drops), the new one comes in from the other side.
 */
type RollItem = { key: number; value: number | string; phase: 'idle' | 'in' | 'out'; dir: number };

export function Roll({ value, className }: { value: number | string; className?: string }) {
  const [items, setItems] = useState<RollItem[]>([{ key: 0, value, phase: 'idle', dir: -1 }]);
  const prev = useRef(value);
  const counter = useRef(0);
  useEffect(() => {
    if (prev.current === value) return;
    const dir = typeof value === 'number' && typeof prev.current === 'number' && value < prev.current ? 1 : -1;
    prev.current = value;
    counter.current += 1;
    const key = counter.current;
    setItems((list) => [
      ...list.filter((i) => i.phase !== 'out').map((i) => ({ ...i, phase: 'out' as const, dir })),
      { key, value, phase: 'in', dir },
    ]);
    const t = window.setTimeout(() => setItems((list) => list.filter((i) => i.phase !== 'out')), 280);
    return () => window.clearTimeout(t);
  }, [value]);
  return (
    <span className={`${s.roll} ${className ?? ''}`}>
      {items.map((item) => (
        <span
          key={item.key}
          className={`${s.rollItem} ${item.phase === 'in' ? s.rollIn : item.phase === 'out' ? s.rollOut : ''}`}
          style={{ ['--dir' as string]: item.dir }}
          aria-hidden={item.phase === 'out' || undefined}
        >
          {item.value}
        </span>
      ))}
    </span>
  );
}

/* ---------- Toggle (DS «Toggle», 52×32) ---------- */

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={s.toggle} onClick={onChange} />;
}

/* ---------- Mount/unmount with an exit transition ---------- */

export function usePresence(open: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      // Two frames: the closed state paints first, then the transition runs.
      let r2 = 0;
      const r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(r1);
        cancelAnimationFrame(r2);
      };
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(t);
  }, [open, exitMs]);
  return { mounted, shown };
}

/** Keeps the last non-null value, so a closing sheet still has its content. */
export function useLatest<T>(value: T | null): T | null {
  const ref = useRef(value);
  if (value !== null) ref.current = value;
  return ref.current;
}

/* ---------- Pull a sheet down to close it ---------- */

export function useDragToClose(onClose: () => void, threshold = 110) {
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ y: number; t: number; id: number } | null>(null);
  const moved = useRef(false);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    start.current = { y: e.clientY, t: performance.now(), id: e.pointerId };
    moved.current = false;
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const st = start.current;
    if (!st || st.id !== e.pointerId) return;
    const d = e.clientY - st.y;
    if (!moved.current && d > 8) {
      moved.current = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // The device may be scaled on desktop, so read the scale from the layout.
    if (moved.current) setDy(Math.max(0, d / deviceScale(e.currentTarget)));
  };
  const end = (e: ReactPointerEvent<HTMLElement>) => {
    const st = start.current;
    start.current = null;
    if (!st || !moved.current) return;
    const d = (e.clientY - st.y) / deviceScale(e.currentTarget);
    const v = d / Math.max(1, performance.now() - st.t);
    setDragging(false);
    setDy(0);
    if (d > threshold || (v > 0.6 && d > 30)) onClose();
  };
  // A drag must not end as a tap on whatever is under the finger.
  const onClickCapture = (e: ReactMouseEvent) => {
    if (moved.current) {
      e.stopPropagation();
      e.preventDefault();
      moved.current = false;
    }
  };
  return {
    dy,
    dragging,
    handlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end, onClickCapture },
  };
}

function deviceScale(el: Element) {
  const device = el.closest('[data-device]') as HTMLElement | null;
  if (!device) return 1;
  return device.getBoundingClientRect().width / device.offsetWidth || 1;
}

/**
 * Pull-to-close for a sheet whose content scrolls: the drag starts only when the
 * content is at the top and the finger moves down; otherwise the content scrolls.
 * Native listeners, because touchmove must be cancelable.
 */
export function useScrollSheetDrag(
  sheet: RefObject<HTMLElement | null>,
  scroller: RefObject<HTMLElement | null>,
  onClose: () => void,
  active: boolean,
) {
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const el = sheet.current;
    const sc = scroller.current;
    if (!active || !el || !sc) return;
    let start: { y: number; t: number } | null = null;
    let on = false;
    let last = 0;
    const begin = (y: number) => {
      start = { y, t: performance.now() };
      on = false;
    };
    const move = (y: number, e: Event) => {
      if (!start) return;
      const d = (y - start.y) / deviceScale(el);
      if (!on) {
        if (sc.scrollTop <= 0 && d > 8) {
          on = true;
          setDragging(true);
        } else if (d < -4 || sc.scrollTop > 0) {
          start = null;
          return;
        } else return;
      }
      if (e.cancelable) e.preventDefault();
      last = Math.max(0, d);
      setDy(last);
    };
    const end = () => {
      if (!start) return;
      const wasOn = on;
      const v = last / Math.max(1, performance.now() - start.t);
      start = null;
      on = false;
      if (!wasOn) return;
      setDragging(false);
      setDy(0);
      if (last > 110 || (v > 0.6 && last > 30)) close.current();
      // The release must not click whatever is under the finger
      const stop = (ev: Event) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      el.addEventListener('click', stop, { capture: true, once: true });
      window.setTimeout(() => el.removeEventListener('click', stop, { capture: true }), 50);
    };
    const ts = (e: TouchEvent) => begin(e.touches[0]!.clientY);
    const tm = (e: TouchEvent) => move(e.touches[0]!.clientY, e);
    const md = (e: MouseEvent) => {
      if (e.button === 0) begin(e.clientY);
    };
    const mm = (e: MouseEvent) => move(e.clientY, e);
    el.addEventListener('touchstart', ts, { passive: true });
    el.addEventListener('touchmove', tm, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    el.addEventListener('mousedown', md);
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', end);
    return () => {
      el.removeEventListener('touchstart', ts);
      el.removeEventListener('touchmove', tm);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
      el.removeEventListener('mousedown', md);
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', end);
    };
  }, [sheet, scroller, active]);

  return { dy, dragging };
}
