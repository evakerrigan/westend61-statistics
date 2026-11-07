import { type ReactNode, type RefObject, useEffect, useRef } from 'react';
import styles from './table.module.scss';

/**
 * Keeps the table header pinned to the top of the window while the table
 * scrolls past. `position: sticky` can't do it here: the wrapper scrolls
 * horizontally, which makes it the sticky container instead of the page.
 * So the header cells are shifted down by hand (via the `--sticky-offset`
 * variable on `thead`), never past the last row.
 */
const usePinnedHeader = (wrapRef: RefObject<HTMLDivElement | null>) => {
  useEffect(() => {
    const table = wrapRef.current?.querySelector('table');
    const thead = table?.querySelector('thead');
    if (!table || !thead) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const top = table.getBoundingClientRect().top;
      const max = table.offsetHeight - thead.offsetHeight;
      const offset = Math.max(0, Math.min(-top, max));
      thead.style.setProperty('--sticky-offset', `${offset}px`);
      thead.toggleAttribute('data-stuck', offset > 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Rows expanding or a re-sort change the table height without a scroll.
    const observer = new ResizeObserver(schedule);
    observer.observe(table);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    };
  }, [wrapRef]);
};

/**
 * A horizontal scrollbar that sticks to the bottom of the window while the
 * table is on screen, so a wide table can be scrolled sideways without first
 * scrolling down to its end. It mirrors the wrapper's own (hidden) scrollbar
 * and only shows up when the table doesn't fit.
 */
const useFloatingScrollbar = (
  wrapRef: RefObject<HTMLDivElement | null>,
  barRef: RefObject<HTMLDivElement | null>,
  spacerRef: RefObject<HTMLDivElement | null>
) => {
  useEffect(() => {
    const wrap = wrapRef.current;
    const bar = barRef.current;
    const spacer = spacerRef.current;
    const table = wrap?.querySelector('table');
    if (!wrap || !bar || !spacer || !table) return;

    // Marks the wrapper once scrolled sideways: the pinned column gets a
    // shadow then.
    const markScrolled = () =>
      wrap.toggleAttribute('data-scrolled', wrap.scrollLeft > 0);
    const measure = () => {
      const hidden = wrap.scrollWidth - wrap.clientWidth;
      bar.hidden = hidden < 1;
      // Same scroll range as the wrapper, even though widths differ by the
      // wrapper's border.
      spacer.style.width = `${bar.clientWidth + hidden}px`;
      bar.scrollLeft = wrap.scrollLeft;
      markScrolled();
    };
    // The tolerance stops the two from bouncing fractional offsets back
    // and forth.
    const follow = (from: HTMLElement, to: HTMLElement) => () => {
      if (Math.abs(to.scrollLeft - from.scrollLeft) > 1) {
        to.scrollLeft = from.scrollLeft;
      }
    };
    const followWrap = follow(wrap, bar);
    const onWrapScroll = () => {
      followWrap();
      markScrolled();
    };
    const onBarScroll = follow(bar, wrap);

    measure();
    wrap.addEventListener('scroll', onWrapScroll, { passive: true });
    bar.addEventListener('scroll', onBarScroll, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    observer.observe(table);
    return () => {
      wrap.removeEventListener('scroll', onWrapScroll);
      bar.removeEventListener('scroll', onBarScroll);
      observer.disconnect();
    };
  }, [wrapRef, barRef, spacerRef]);
};

/** Card around a table: pinned header and an always-reachable scrollbar. */
export const TableWrap = ({ children }: { children: ReactNode }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  usePinnedHeader(wrapRef);
  useFloatingScrollbar(wrapRef, barRef, spacerRef);

  return (
    <div className={styles.tableBox}>
      <div ref={wrapRef} className={styles.tableWrap}>
        {children}
      </div>
      <div ref={barRef} className={styles.tableScrollbar} hidden>
        <div ref={spacerRef} className={styles.tableScrollbar__spacer} />
      </div>
    </div>
  );
};
