import { useEffect, useRef, type RefObject } from 'react';

const CLOSE_AT = 110;
const ENGAGE_AT = 6;

/**
 * Pull a bottom sheet down to close it. Works with touch and with a mouse drag.
 * The pull starts only when the sheet content is scrolled to the very top, so
 * normal scrolling inside the sheet is untouched.
 */
export function useSwipeDown(
  sheetRef: RefObject<HTMLElement | null>,
  scrollRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const sheet = sheetRef.current;
    const scroller = scrollRef.current ?? sheet;
    if (!sheet || !scroller) return;

    let startY = 0;
    let dy = 0;
    let tracking = false;
    let engaged = false;
    let closing = false;

    // The device is scaled on desktop: move the sheet in its own units.
    const scale = () => sheet.getBoundingClientRect().height / sheet.offsetHeight || 1;

    const begin = (y: number) => {
      if (closing || scroller.scrollTop > 0) return;
      startY = y;
      dy = 0;
      tracking = true;
      engaged = false;
    };

    const move = (y: number, event: Event) => {
      if (!tracking) return;
      dy = (y - startY) / scale();
      if (!engaged) {
        if (dy < 0 || scroller.scrollTop > 0) {
          tracking = false;
          return;
        }
        if (dy < ENGAGE_AT) return;
        engaged = true;
        sheet.style.transition = 'none';
      }
      if (event.cancelable) event.preventDefault();
      sheet.style.transform = `translateY(${Math.max(0, dy)}px)`;
    };

    const end = () => {
      if (!tracking) return;
      tracking = false;
      if (!engaged) return;
      sheet.style.transition = 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)';
      if (dy > CLOSE_AT) {
        closing = true;
        sheet.style.transform = 'translateY(100%)';
        window.setTimeout(() => close.current(), 200);
      } else {
        sheet.style.transform = '';
      }
    };

    const onTouchStart = (e: TouchEvent) => e.touches[0] && begin(e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => e.touches[0] && move(e.touches[0].clientY, e);
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      begin(e.clientY);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp, { once: true });
    };
    const onPointerMove = (e: PointerEvent) => move(e.clientY, e);
    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      // A drag should not also count as a click on whatever was under the cursor.
      if (engaged) window.addEventListener('click', swallow, { capture: true, once: true });
      end();
    };
    const swallow = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };

    sheet.addEventListener('touchstart', onTouchStart, { passive: true });
    sheet.addEventListener('touchmove', onTouchMove, { passive: false });
    sheet.addEventListener('touchend', end);
    sheet.addEventListener('touchcancel', end);
    sheet.addEventListener('pointerdown', onPointerDown);
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart);
      sheet.removeEventListener('touchmove', onTouchMove);
      sheet.removeEventListener('touchend', end);
      sheet.removeEventListener('touchcancel', end);
      sheet.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('click', swallow, { capture: true });
    };
  }, [sheetRef, scrollRef]);
}
