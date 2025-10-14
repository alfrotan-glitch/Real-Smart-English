// components/GrowthToolsModal.tsx — Accessible, copy-friendly, resilient
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import type { useAppStore } from '../store/appStore';
import type { RocketIcon, SpinnerIcon } from './Icons';

const GrowthToolsModal: React.FC = () => {
  const {
    isGrowthToolsModalOpen,
    setIsGrowthToolsModalOpen,
    isGeneratingGrowthTool,
    growthToolContent,
    generateChannelTrailer,
    generateFeaturedVideo,
    error,
    setToastMessage,
  } = useAppStore();

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    setIsGrowthToolsModalOpen(false);
  }, [setIsGrowthToolsModalOpen]);

  // Close on backdrop click (but not on inner content)
  const onBackdropMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) handleClose();
    },
    [handleClose]
  );

  // Trap focus + close on Esc
  useEffect(() => {
    if (!isGrowthToolsModalOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const container = dialogRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first focusable or container itself
    const focusables = container ? getFocusable(container) : [];
    (focusables[0] ?? container)?.focus?.();

    const onKeyDown = (e: KeyboardEvent) => {
      if (!container) return;

      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
        return;
      }

      if (e.key === 'Tab') {
        const nodes = getFocusable(container);
        if (nodes.length === 0) {
          // Keep focus on container when nothing else is focusable
          e.preventDefault();
          container.focus();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];

        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isGrowthToolsModalOpen, handleClose]);

  const canCopyOrDownload = useMemo(
    () => Boolean(growthToolContent && !isGeneratingGrowthTool && !error),
    [growthToolContent, isGeneratingGrowthTool, error]
  );

  const handleCopy = useCallback(async () => {
    if (!canCopyOrDownload || !growthToolContent) return;
    try {
      await navigator.clipboard.writeText(growthToolContent);
      setToastMessage('Copied to clipboard.');
    } catch {
      setToastMessage('Copy failed.');
    }
  }, [canCopyOrDownload, growthToolContent, setToastMessage]);

  const handleDownload = useCallback(() => {
    if (!canCopyOrDownload || !growthToolContent) return;
    const blob = new Blob([growthToolContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `growth-tool-${stamp}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [canCopyOrDownload, growthToolContent]);

  if (!isGrowthToolsModalOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="growth-tools-title"
      aria-describedby="growth-tools-desc"
      onMouseDown={onBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-gradient-to-br from-slate-50 to-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col outline-none animate-fade-in"
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <RocketIcon className="w-7 h-7 text-purple-600" />
            <h2 id="growth-tools-title" className="text-xl font-bold text-slate-800">
              Channel Growth Tools
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-300"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main id="growth-tools-desc" className="flex-grow p-6 overflow-y-auto">
          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={generateChannelTrailer}
              disabled={isGeneratingGrowthTool}
              className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg text-left hover:bg-indigo-100 hover:border-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <h3 className="text-lg font-bold text-indigo-800">Generate Channel Trailer</h3>
              <p className="text-sm text-indigo-700 mt-1">
                Create a short, exciting script to convert new visitors into subscribers.
              </p>
            </button>
            <button
              onClick={generateFeaturedVideo}
              disabled={isGeneratingGrowthTool}
              className="p-4 bg-teal-50 border-2 border-teal-200 rounded-lg text-left hover:bg-teal-100 hover:border-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              <h3 className="text-lg font-bold text-teal-800">Generate Featured Video</h3>
              <p className="text-sm text-teal-700 mt-1">
                Create a special video to thank returning subscribers and build community.
              </p>
            </button>
          </div>

          {/* Status / Output */}
          <div className="mt-2 space-y-4">
            {isGeneratingGrowthTool && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <SpinnerIcon className="w-12 h-12" />
                <p className="mt-4 text-lg font-semibold text-gray-800">Generating…</p>
                <p className="text-sm text-gray-500">This might take a moment.</p>
              </div>
            )}

            {!isGeneratingGrowthTool && error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!isGeneratingGrowthTool && !error && growthToolContent && (
              <>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={!canCopyOrDownload}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    Copy
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!canCopyOrDownload}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    Download .md
                  </button>
                </div>
                <article className="prose lg:prose-lg max-w-none p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <ReactMarkdown>{growthToolContent}</ReactMarkdown>
                </article>
              </>
            )}

            {!isGeneratingGrowthTool && !error && !growthToolContent && (
              <div className="text-center text-slate-500 p-8 border-2 border-dashed border-slate-300 rounded-lg">
                <p>Select a tool above to generate a strategic video package.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default memo(GrowthToolsModal);

// ---------- helpers ----------
function getFocusable(root: HTMLElement): HTMLElement[] {
  // Exclude disabled/hidden and inert candidates
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));

  return nodes.filter((el) => {
    if (el.hasAttribute('disabled')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    // Heuristic for visibility
    const style = window.getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    // Not in DOM or no size
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    return true;
  });
}
