// components/Toast.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 3000;
const TRANSITION_FALLBACK_MS = 400;

const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  const hideTimerRef = useRef<number | null>(null);
  const fallbackDismissRef = useRef<number | null>(null);
  const isHoveringRef = useRef(false);
  const dismissedRef = useRef(false);
  const reduceMotionRef = useRef<boolean>(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const clearFallbackTimer = () => {
    if (fallbackDismissRef.current) {
      window.clearTimeout(fallbackDismissRef.current);
      fallbackDismissRef.current = null;
    }
  };

  const safeDismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    clearHideTimer();
    clearFallbackTimer();
    onDismiss();
  }, [onDismiss]);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    if (!message) return;

    if (reduceMotionRef.current) {
      setVisible(false);
      clearFallbackTimer();
      fallbackDismissRef.current = window.setTimeout(safeDismiss, 50);
      return;
    }

    hideTimerRef.current = window.setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
  }, [message, safeDismiss]);

  useEffect(() => {
    dismissedRef.current = false;
    clearHideTimer();
    clearFallbackTimer();

    const mql =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    const onMotionChange = (e: MediaQueryListEvent) => {
      reduceMotionRef.current = e.matches;
    };
    mql?.addEventListener('change', onMotionChange);

    if (message) {
      setVisible(true);
      if (!isHoveringRef.current) scheduleHide();
    } else {
      setVisible(false);
    }

    return () => {
      mql?.removeEventListener('change', onMotionChange);
      clearHideTimer();
      clearFallbackTimer();
    };
  }, [message, scheduleHide]);

  useEffect(() => {
    clearFallbackTimer();
    if (!visible && message && !reduceMotionRef.current) {
      fallbackDismissRef.current = window.setTimeout(safeDismiss, TRANSITION_FALLBACK_MS);
    }
    return clearFallbackTimer;
  }, [visible, message, safeDismiss]);

  const handleTransitionEnd = () => {
    if (!visible && message && !reduceMotionRef.current) {
      clearFallbackTimer();
      safeDismiss();
    }
  };

  const onMouseEnter = () => {
    isHoveringRef.current = true;
    clearHideTimer();
  };

  const onMouseLeave = () => {
    isHoveringRef.current = false;
    scheduleHide();
  };

  const isError = !!message && /^error:/i.test(message);

  if (!message) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1000]">
      <div
        className={[
          'pointer-events-auto',
          'absolute top-20 right-6 max-w-sm',
          'p-4 rounded-lg shadow-xl text-white',
          'ring-1 ring-black/10',
          'transition transform duration-300 ease-in-out motion-reduce:transition-none',
          visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
          isError ? 'bg-red-600' : 'bg-gray-900',
        ].join(' ')}
        role={isError ? 'alert' : 'status'}
        aria-live={isError ? 'assertive' : 'polite'}
        aria-atomic="true"
        onTransitionEnd={handleTransitionEnd}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setVisible(false);
        }}
        tabIndex={0}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 whitespace-pre-wrap">{message}</div>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="ml-2 inline-flex rounded-md p-1 text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-label="Dismiss notification"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Toast);
