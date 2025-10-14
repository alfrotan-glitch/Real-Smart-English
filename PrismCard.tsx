// components/PrismCard.tsx
// Smooth, throttled glow; a11y-friendly; SSR-safe; consistent with UI system.

import React, { memo, useEffect, useRef } from 'react';

export interface PrismCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Hide interactive prism effect for static contexts */
  disablePrism?: boolean;
  /** Optional aria description id */
  'aria-describedby'?: string;
}

const PrismCard: React.FC<PrismCardProps> = ({
  title,
  icon,
  children,
  className = '',
  disablePrism = false,
  'aria-describedby': ariaDescribedBy,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || disablePrism) return;

    // Respect reduced motion users
    const mql =
      typeof window !== 'undefined'
        ? window.matchMedia?.('(prefers-reduced-motion: reduce)')
        : null;
    if (mql?.matches) return;

    let pendingX = 0;
    let pendingY = 0;
    let hasPending = false;

    const update = () => {
      rafRef.current = null;
      if (!hasPending || !card) return;
      hasPending = false;

      const rect = card.getBoundingClientRect();
      const x = pendingX - rect.left;
      const y = pendingY - rect.top;
      const angle =
        Math.atan2(y - rect.height / 2, x - rect.width / 2) * (180 / Math.PI) +
        180;

      // Avoid layout thrash; set only a CSS var
      card.style.setProperty('--angle', `${angle}deg`);
    };

    const onMove = (e: MouseEvent) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (rafRef.current == null) {
        rafRef.current = window.requestAnimationFrame(update);
      }
      hasPending = true;
    };

    // Passive for smoother scroll; safe here since we don't call preventDefault
    card.addEventListener('mousemove', onMove, { passive: true });

    return () => {
      card.removeEventListener('mousemove', onMove as EventListener);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [disablePrism]);

  return (
    <section
      ref={cardRef}
      className={[
        'prism-card rounded-card bg-glass/70 backdrop-blur-card border border-white/10',
        'shadow-card transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'hover:shadow-glow',
        disablePrism ? 'pointer-events-auto' : '',
        className,
      ].join(' ')}
      role="region"
      aria-labelledby="prismcard-title"
      aria-describedby={ariaDescribedBy}
      // Touch screens don't need the prism effect anyway
      data-prism-disabled={disablePrism ? 'true' : 'false'}
    >
      <header className="p-4 border-b border-white/10 flex items-center gap-3">
        {icon}
        <h2 id="prismcard-title" className="text-text-primary text-md font-bold tracking-wide">
          {title}
        </h2>
      </header>

      <div className="p-4 space-y-4">{children}</div>
    </section>
  );
};

export default memo(PrismCard);
