import { useLayoutEffect, useRef, type RefObject } from 'react';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * FLIP animation for elements marked with data-flip="<key>" inside the
 * container: when `trigger` changes, each element glides from its previous
 * place to the new one. Product thumbnails use it to move between trips.
 */
export function useFlip(containerRef: RefObject<HTMLElement | null>, trigger: unknown) {
  const last = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const box = container.getBoundingClientRect();
    // The device may be scaled on desktop; measure in its own units.
    const scale = box.width / container.offsetWidth || 1;
    const next = new Map<string, DOMRect>();
    const animate = !reducedMotion();

    container.querySelectorAll<HTMLElement>('[data-flip]').forEach((el) => {
      const key = el.dataset.flip;
      if (!key) return;
      const rect = el.getBoundingClientRect();
      const relative = new DOMRect((rect.left - box.left) / scale, (rect.top - box.top) / scale, rect.width / scale, rect.height / scale);
      next.set(key, relative);
      const prev = last.current.get(key);
      if (!animate) return;
      if (prev) {
        const dx = prev.left - relative.left;
        const dy = prev.top - relative.top;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
            duration: 360,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          });
        }
      } else if (last.current.size > 0) {
        el.animate([{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'none' }], {
          duration: 240,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        });
      }
    });

    last.current = next;
  }, [containerRef, trigger]);
}
