// components/Starfield.tsx
// Parallax starfield with rAF throttling, reduced-motion support, and safe cleanup.
// Backward-compatible: works without props.

import React, { useRef, useEffect, memo } from 'react';

type Props = {
  /** Parallax strength in px (default 5) */
  intensity?: number;
  /** Extra class names for the wrapper */
  className?: string;
};

const Starfield: React.FC<Props> = ({ intensity = 5, className = '' }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    // Media query for motion preferences
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = mq.matches;

    const onMQChange = (e: MediaQueryListEvent) => {
      reduced = e.matches;
      if (reduced) {
        // Reset transform if user prefers less motion
        el.style.transform = '';
      }
    };
    mq.addEventListener('change', onMQChange);

    // rAF throttling
    const rafId = { current: 0 as number | 0 };
    const target = { x: 0, y: 0 };

    const schedule = () => {
      if (rafId.current) return;
      rafId.current = window.requestAnimationFrame(() => {
        rafId.current = 0;
        if (reduced) return;
        const tx = -target.x * intensity;
        const ty = -target.y * intensity;
        // GPU-friendly
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    };

    // Keep window size snapshot to avoid layout reads per event
    let ww = window.innerWidth;
    let wh = window.innerHeight;

    const onResize = () => {
      ww = window.innerWidth;
      wh = window.innerHeight;
    };

    // Use pointermove to cover mouse + pen
    const onPointerMove = (e: PointerEvent) => {
      if (reduced) return;
      // normalize to [-1, 1]
      const nx = (e.clientX / ww - 0.5) * 2;
      const ny = (e.clientY / wh - 0.5) * 2;
      target.x = nx;
      target.y = ny;
      schedule();
    };

    // Pause when hidden
    const onVisibility = () => {
      if (document.hidden) {
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
          rafId.current = 0;
        }
        // Optional: reset transform on hide to avoid jumping when returning
        el.style.transform = '';
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      mq.removeEventListener('change', onMQChange);
    };
  }, [intensity]);

  return (
    <div
      ref={rootRef}
      className={`starfield will-change-transform ${className}`}
      aria-hidden="true"
      data-component="starfield"
    >
      <div id="stars1" aria-hidden="true" />
      <div id="stars2" aria-hidden="true" />
      <div id="stars3" aria-hidden="true" />
    </div>
  );
};

export default memo(Starfield);
