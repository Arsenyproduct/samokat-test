import type { CSSProperties, ReactNode } from 'react';
import { useRouter } from '../state/router';
import s from './screen.module.css';

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Overlay sheets animate the sheet itself, not the whole screen. */
  animate?: boolean;
  label: string;
};

export function Screen({ children, className, style, animate = true, label }: Props) {
  const { direction } = useRouter();
  const enter = animate ? (direction === 'back' ? s.back : s.forward) : '';
  return (
    <section className={[s.screen, enter, className].filter(Boolean).join(' ')} style={style} aria-label={label}>
      {children}
    </section>
  );
}

export { s as screenStyles };
