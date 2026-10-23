import { useEffect, useState, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import { stores, formatPrice, type StoreId } from '../data/catalog';
import { Icon, type IconName } from './Icon';
import s from './ui.module.css';

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');

/* ---------- Status bar ---------- */

/** Fake iOS status bar of the frames; `background` keeps scrolled content from showing under it. */
export function StatusBar({ tone, time = '14:16', background }: { tone: 'light' | 'dark'; time?: string; background?: string }) {
  return (
    <div className={cx(s.statusbar, tone === 'light' ? s.sbLight : s.sbDark)} style={{ background }} aria-hidden="true">
      <span className={s.statusbarTime}>{time}</span>
      <span className={s.statusbarBattery} />
    </div>
  );
}

/* ---------- Store logo (Store logo, sizes S/M/L/XL = 13/17/21/34) ---------- */

export function StoreLogo({ store, size, className, style }: { store: StoreId; size: 13 | 17 | 21 | 34; className?: string; style?: CSSProperties }) {
  return (
    <img
      className={cx(s.logo, className)}
      style={style}
      src={stores[store].logo}
      width={size}
      height={size}
      alt=""
      draggable={false}
    />
  );
}

/* ---------- Icon button ---------- */

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  label: string;
  iconSize?: number;
};

export function IconButton({ icon, label, iconSize = 22, className, ...rest }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} className={cx(s.iconButton, className)} {...rest}>
      <Icon name={icon} size={iconSize} />
    </button>
  );
}

/* ---------- Loader/Spinner ---------- */

export function Spinner({ size = 24, onAccent = false }: { size?: 16 | 24 | 40 | 21; onAccent?: boolean }) {
  return (
    <svg className={s.spinner} width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {!onAccent && <circle cx="8" cy="8" r="7" stroke="var(--line-divider)" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
      <path
        d="M8 1a7 7 0 1 1-6.66 9.16"
        stroke={onAccent ? 'var(--text-on-accent)' : 'var(--brand-red)'}
        strokeWidth={onAccent ? 3 : 2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ---------- Button/Primary, Button/Secondary, Button/Primary loading ---------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'dark';
  loading?: boolean;
  height?: 52 | 56;
};

export function Button({ variant = 'primary', loading = false, height = 56, className, children, style, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      type="button"
      className={cx(
        s.button,
        variant === 'primary' && s.primary,
        variant === 'secondary' && s.secondary,
        variant === 'dark' && s.buttonDark,
        loading && s.buttonLoading,
        className,
      )}
      style={{ height, ...style }}
      aria-busy={loading || undefined}
      disabled={loading || rest.disabled}
    >
      {loading ? (
        <>
          <Spinner size={21} onAccent />
          <span className="visually-hidden">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

/* ---------- Toggle ---------- */

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={s.toggle}
      onClick={() => onChange(!checked)}
    />
  );
}

/* ---------- Stepper ---------- */

export function Stepper({ count, onMinus, onPlus, label }: { count: number; onMinus: () => void; onPlus: () => void; label: string }) {
  return (
    <div className={s.stepper}>
      <button type="button" className={s.stepperButton} aria-label={`Убрать: ${label}`} onClick={onMinus}>
        <Icon name="minus" size={16} stroke={1.92} />
      </button>
      <span className={s.stepperCount} aria-live="polite">
        {count}
      </span>
      <button type="button" className={s.stepperButton} aria-label={`Добавить: ${label}`} onClick={onPlus}>
        <Icon name="plus" size={16} stroke={1.92} />
      </button>
    </div>
  );
}

/* ---------- Chip/Add → Chip/Count ---------- */

export function PriceChip({ price, count, onAdd, onRemove, label }: { price: number; count: number; onAdd: () => void; onRemove: () => void; label: string }) {
  if (count === 0) {
    return (
      <button type="button" className={s.chipAdd} onClick={onAdd} aria-label={`Добавить в корзину: ${label}`}>
        {formatPrice(price)}
        <Icon name="plus" size={16} stroke={1.92} className={s.chipAddPlus} />
      </button>
    );
  }
  return (
    <div className={s.chipCount}>
      <button type="button" className={s.chipCountButton} onClick={onRemove} aria-label={`Убрать: ${label}`}>
        <Icon name="minus" size={16} stroke={1.92} />
      </button>
      <span aria-live="polite">{formatPrice(price * count)}</span>
      <button type="button" className={s.chipCountButton} onClick={onAdd} aria-label={`Добавить: ${label}`}>
        <Icon name="plus" size={16} stroke={1.92} />
      </button>
    </div>
  );
}

/* ---------- Partner tag (в каталоге) ---------- */

export function PartnerTag({ store, className, style }: { store: StoreId; className?: string; style?: CSSProperties }) {
  return (
    <span className={cx(s.partnerTag, className)} style={style}>
      <StoreLogo store={store} size={13} />
      {stores[store].name}
    </span>
  );
}

export function Divider() {
  return <div className={s.divider} />;
}

/* ---------- Sheet grabber ---------- */

export function Grabber({ top, onClose }: { top: number; onClose?: () => void }) {
  return (
    <>
      <div className={s.grabber} style={{ top }} aria-hidden="true" />
      {onClose && <button type="button" className={s.grabberButton} aria-label="Закрыть" onClick={onClose} />}
    </>
  );
}

/* ---------- Skeleton block ---------- */

export function Skeleton({ width, height, radius, className, style }: { width: number | string; height: number; radius: number; className?: string; style?: CSSProperties }) {
  return <div className={cx(s.skeleton, className)} style={{ width, height, borderRadius: radius, flex: 'none', ...style }} aria-hidden="true" />;
}

/* ---------- 300 ms loading state on screen enter ---------- */

export const LOADING_MS = 300;

export function useEnterLoading(ms = LOADING_MS) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), ms);
    return () => window.clearTimeout(timer);
  }, [ms]);
  return loading;
}
