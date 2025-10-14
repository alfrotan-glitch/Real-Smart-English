// components/Loader.tsx
// Minimal re-renders, accessible, and themable.

import React, { memo, useMemo } from 'react';

type Tone = 'brand' | 'neutral';
type Size = 'sm' | 'md' | 'lg';

interface LoaderProps {
  message?: string;
  subMessage?: string;
  className?: string;
  tone?: Tone;
  size?: Size;
  /** For test runners */
  'data-testid'?: string;
}

const SIZE_MAP: Record<Size, string> = {
  sm: 'w-8 h-8 border-2',
  md: 'w-12 h-12 border-4',
  lg: 'w-16 h-16 border-4',
};

const LoaderComponent: React.FC<LoaderProps> = ({
  message = 'Generating...',
  subMessage = 'This may take a moment.',
  className = '',
  tone = 'brand',
  size = 'md',
  'data-testid': testId,
}) => {
  const ringClasses = useMemo(() => {
    const base = SIZE_MAP[size];
    const palette =
      tone === 'brand'
        ? 'border-t-accent border-r-accent border-b-white/20 border-l-white/20'
        : 'border-t-slate-500 border-r-slate-500 border-b-slate-300/30 border-l-slate-300/30';
    return `${base} ${palette}`;
  }, [size, tone]);

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center h-full animate-fade-in ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid={testId}
    >
      <div
        className={`${ringClasses} rounded-full animate-spin motion-reduce:animate-none`}
        aria-hidden="true"
      />
      <p className="mt-4 text-lg font-semibold text-text-primary">{message}</p>
      <p className="text-sm text-text-secondary">{subMessage}</p>
      {/* Screen reader friendly fallback */}
      <span className="sr-only">{`${message} ${subMessage}`}</span>
    </div>
  );
};

export default memo(
  LoaderComponent,
  (prev, next) =>
    prev.message === next.message &&
    prev.subMessage === next.subMessage &&
    prev.className === next.className &&
    prev.tone === next.tone &&
    prev.size === next.size &&
    prev['data-testid'] === next['data-testid']
);
