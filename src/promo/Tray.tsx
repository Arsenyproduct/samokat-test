import type { FlavorId } from './data';
import { Bar, Roll, useLatest, usePresence } from './ui';
import s from './Tray.module.css';

type Props = {
  open: boolean;
  /** Bars added towards the next free one (1 or 2) */
  units: FlavorId[];
  onEmpty: () => void;
  className?: string;
};

/**
 * Лоток (651:988): dark pill with three cells. It shows up after the first bar,
 * filled cells show the bars added so far, the third one is free; a tap on an
 * empty cell opens the set with the missing slot.
 */
export function Tray({ open, units, onEmpty, className }: Props) {
  const { mounted, shown } = usePresence(open, 320);
  const last = useLatest(open ? units : null) ?? units;
  if (!mounted) return null;
  const left = 3 - last.length;
  return (
    <div className={`${s.tray} ${shown ? s.trayShown : ''} ${className ?? ''}`} role="group" aria-label="Набор: 3 по цене 2">
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
