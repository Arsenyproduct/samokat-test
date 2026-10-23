// Icons drawn from the vector layers in Figma (icon/* on the frames).
// Paths keep their Figma geometry; strokes do not scale, so `stroke` is the
// on-screen width from the mockup (2.4 by default, 2.2 and 1.92 where noted).
// Colors come from currentColor so the parent sets them.

import type { CSSProperties } from 'react';

type Shape = { box: number; d: string[]; fill?: boolean };

const shapes = {
  chevD: { box: 20, d: ['M5 7.5L10 12.5L15 7.5'] },
  chevR: { box: 20, d: ['M7.5 5L12.5 10L7.5 15'] },
  user: {
    box: 20,
    d: [
      'M10 10C11.84 10 13.33 8.51 13.33 6.67C13.33 4.83 11.84 3.33 10 3.33C8.16 3.33 6.67 4.83 6.67 6.67C6.67 8.51 8.16 10 10 10Z',
      'M3.33 16.67C4.17 13.33 6.67 11.67 10 11.67C13.33 11.67 15.83 13.33 16.67 16.67',
    ],
  },
  grid: {
    box: 24,
    fill: true,
    d: [
      'M9 4H6C4.9 4 4 4.9 4 6V9C4 10.1 4.9 11 6 11H9C10.1 11 11 10.1 11 9V6C11 4.9 10.1 4 9 4Z',
      'M18 4H15C13.9 4 13 4.9 13 6V9C13 10.1 13.9 11 15 11H18C19.1 11 20 10.1 20 9V6C20 4.9 19.1 4 18 4Z',
      'M9 13H6C4.9 13 4 13.9 4 15V18C4 19.1 4.9 20 6 20H9C10.1 20 11 19.1 11 18V15C11 13.9 10.1 13 9 13Z',
      'M18 13H15C13.9 13 13 13.9 13 15V18C13 19.1 13.9 20 15 20H18C19.1 20 20 19.1 20 18V15C20 13.9 19.1 13 18 13Z',
    ],
  },
  pct: {
    box: 24,
    d: [
      'M18 6L6 18',
      'M7.5 9.5C8.6 9.5 9.5 8.6 9.5 7.5C9.5 6.4 8.6 5.5 7.5 5.5C6.4 5.5 5.5 6.4 5.5 7.5C5.5 8.6 6.4 9.5 7.5 9.5Z',
      'M16.5 18.5C17.6 18.5 18.5 17.6 18.5 16.5C18.5 15.4 17.6 14.5 16.5 14.5C15.4 14.5 14.5 15.4 14.5 16.5C14.5 17.6 15.4 18.5 16.5 18.5Z',
    ],
  },
  flame: {
    box: 24,
    d: [
      'M12 3C13 6 17 8 17 13C17 14.33 16.47 15.6 15.54 16.54C14.6 17.47 13.33 18 12 18C10.67 18 9.4 17.47 8.46 16.54C7.53 15.6 7 14.33 7 13C7 11 8 10 9 9C9 11 10 12 11 12C11 9 10 6 12 3Z',
    ],
  },
  redo: {
    box: 24,
    d: [
      'M19 12C18.99 13.59 18.44 15.13 17.44 16.37C16.44 17.61 15.04 18.46 13.49 18.8C11.93 19.14 10.31 18.94 8.88 18.23C7.46 17.52 6.32 16.35 5.65 14.9C4.98 13.46 4.82 11.83 5.2 10.28C5.59 8.74 6.48 7.37 7.75 6.4C9.01 5.44 10.57 4.93 12.16 4.96C13.75 5 15.28 5.58 16.5 6.6M19 4V8H15',
    ],
  },
  heart: {
    box: 24,
    fill: true,
    d: [
      'M12 20C12 20 5 15.6 5 10C5.03 9.2 5.3 8.43 5.77 7.78C6.24 7.13 6.9 6.65 7.65 6.38C8.41 6.11 9.22 6.07 10 6.27C10.77 6.47 11.47 6.9 12 7.5C12.53 6.9 13.23 6.47 14 6.27C14.78 6.07 15.59 6.11 16.35 6.38C17.1 6.65 17.76 7.13 18.23 7.78C18.7 8.43 18.97 9.2 19 10C19 15.6 12 20 12 20Z',
    ],
  },
  heartOutline: {
    box: 22,
    d: [
      'M11 18.33C11 18.33 4.58 14.3 4.58 9.17C4.61 8.43 4.86 7.72 5.29 7.13C5.72 6.54 6.32 6.09 7.01 5.84C7.71 5.6 8.45 5.56 9.17 5.75C9.88 5.93 10.52 6.32 11 6.87C11.48 6.32 12.12 5.93 12.83 5.75C13.55 5.56 14.29 5.6 14.99 5.84C15.68 6.09 16.28 6.54 16.71 7.13C17.14 7.72 17.39 8.43 17.42 9.17C17.42 14.3 11 18.33 11 18.33Z',
    ],
  },
  search: {
    box: 22,
    d: [
      'M10.08 16.04C13.37 16.04 16.04 13.37 16.04 10.08C16.04 6.79 13.37 4.13 10.08 4.13C6.79 4.13 4.13 6.79 4.13 10.08C4.13 13.37 6.79 16.04 10.08 16.04Z',
      'M18.33 18.33L14.21 14.21',
    ],
  },
  close: { box: 20, d: ['M5 5L15 15M15 5L5 15'] },
  back: { box: 22, d: ['M17.42 11H4.58M10.08 16.5L4.58 11L10.08 5.5'] },
  plus: { box: 16, d: ['M8 3.33V12.67M3.33 8H12.67'] },
  minus: { box: 16, d: ['M3.33 8H12.67'] },
  clock: {
    box: 20,
    d: [
      'M10 17.08C13.91 17.08 17.08 13.91 17.08 10C17.08 6.09 13.91 2.92 10 2.92C6.09 2.92 2.92 6.09 2.92 10C2.92 13.91 6.09 17.08 10 17.08Z',
      'M10 6.25V10L12.5 11.67',
    ],
  },
  swap: { box: 22, d: ['M6.42 7.33L2.75 11L6.42 14.67M15.58 7.33L19.25 11L15.58 14.67'] },
  warn: { box: 20, d: ['M10 3.33L2.5 16.67H17.5L10 3.33Z', 'M10 8.33V11.67M10 14.17H10.01'] },
  sliders: { box: 24, d: ['M6 8H18M6 16H18M10 5V11M14 13V19'] },
  /** Thin chevron of the action rows in frame 4.1 (5×10). */
  chevThin: { box: 12, d: ['M3.5 1L8.5 6L3.5 11'] },
  /** Back chevron inside the 36 px round back button of frames 4.x. */
  chevL: { box: 36, d: ['M20.5 13L15.5 18L20.5 23'] },
  exclaim: { box: 96, d: ['M48 38.5V51.5M48 56.5V57.5'] },
  courier: {
    box: 15,
    d: [
      'M3.44 13.13C4.65 13.13 5.63 12.15 5.63 10.94C5.63 9.73 4.65 8.75 3.44 8.75C2.23 8.75 1.25 9.73 1.25 10.94C1.25 12.15 2.23 13.13 3.44 13.13Z',
      'M11.56 13.13C12.77 13.13 13.75 12.15 13.75 10.94C13.75 9.73 12.77 8.75 11.56 8.75C10.35 8.75 9.38 9.73 9.38 10.94C9.38 12.15 10.35 13.13 11.56 13.13Z',
      'M9.38 3.88C9.79 3.88 10.13 3.54 10.13 3.13C10.13 2.71 9.79 2.38 9.38 2.38C8.96 2.38 8.63 2.71 8.63 3.13C8.63 3.54 8.96 3.88 9.38 3.88Z',
      'M7.5 10.94V8.75L5.63 6.88L8.13 5L9.38 6.88H10.63',
    ],
  },
} satisfies Record<string, Shape>;

export type IconName = keyof typeof shapes;

type Props = {
  name: IconName;
  size: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
};

export function Icon({ name, size, stroke = 2.4, className, style }: Props) {
  const shape: Shape = shapes[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${shape.box} ${shape.box}`}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
      fill={shape.fill ? 'currentColor' : 'none'}
      stroke={shape.fill ? 'none' : 'currentColor'}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shape.d.map((d) => (
        <path key={d} d={d} strokeWidth={stroke} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
