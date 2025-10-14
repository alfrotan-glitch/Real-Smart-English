// components/PronunciationCoachModal.tsx
// Accessible, focus-trapped, SSR-safe, and consistent with UI system.

import React, { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import type { MicrophoneIcon, SpinnerIcon, StopIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import type { useSpeechRecognition } from '../hooks/useTextToSpeech';
import type { analyzePronunciation, PronunciationFeedback } from '../services/geminiService';

interface PronunciationCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
}

const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const PronunciationCoachModal: React.FC<PronunciationCoachModalProps> = ({
  isOpen,
  onClose,
  originalText,
}) => {
  const titleId = useId();
  const descId = useId();

  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const resetState = useCallback(() => {
    setTranscript('');
    setFeedback(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  const handleResult = useCallback(
    async (result: string) => {
      setTranscript(result);
      setIsAnalyzing(true);
      setError(null);
      try {
        const analysis = await analyzePronunciation(originalText, result);
        // defensively clamp to 0..100
        setFeedback(prev => ({
          ...analysis,
          overallScore: clamp100(analysis?.overallScore ?? 0),
          mispronouncedWords: analysis?.mispronouncedWords ?? [],
          positivePoints: analysis?.positivePoints ?? [],
        }));
      } catch (e) {
        console.error(e);
        setError('Could not analyze pronunciation. Please try again.');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [originalText]
  );

  const { isListening, startListening, stopListening, isSupported } =
    useSpeechRecognition({
      onResult: handleResult,
      onError: (err) => setError(`Speech recognition error: ${err}`),
    });

  // modal lifecycle
  useEffect(() => {
    if (!isOpen) return;

    resetState();

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    // lock scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // focus first focusable
    const container = containerRef.current;
    const focusables = container ? getFocusable(container) : [];
    (focusables[0] ?? container)?.focus?.();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (isListening) stopListening();
        onClose();
        return;
      }
      if (e.key === 'Tab' && container) {
        const nodes = getFocusable(container);
        if (!nodes.length) return;
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
  }, [isOpen, onClose, resetState, isListening, stopListening]);

  if (!isOpen) return null;

  const handleBackdrop = useCallback(() => {
    if (isListening) stopListening();
    onClose();
  }, [isListening, stopListening, onClose]);

  const handleCloseButton = useCallback(() => {
    if (isListening) stopListening();
    onClose();
  }, [isListening, stopListening, onClose]);

  const scoreColor = feedback
    ? feedback.overallScore >= 80
      ? 'text-green-600'
      : feedback.overallScore >= 50
      ? 'text-yellow-600'
      : 'text-red-600'
    : '';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleBackdrop();
      }}
    >
      <div
        ref={containerRef}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col outline-none animate-fade-in"
        onMouseDown={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <MicrophoneIcon className="w-7 h-7 text-indigo-600" />
            <h2 id={titleId} className="text-xl font-bold text-slate-800">
              Pronunciation Coach
            </h2>
          </div>
          <button
            onClick={handleCloseButton}
            className="p-1 rounded-full text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main id={descId} className="p-6 overflow-y-auto space-y-6">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">Sentence to practice:</p>
            <p className="p-4 bg-slate-100 rounded-lg text-slate-800 font-serif text-lg">
              “{originalText}”
            </p>
          </div>

          {isSupported ? (
            <div className="text-center">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isAnalyzing}
                className={[
                  'px-6 py-3 rounded-full text-white font-semibold flex items-center justify-center mx-auto transition-all',
                  'transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed',
                  isListening ? 'bg-red-600' : 'bg-indigo-600',
                ].join(' ')}
              >
                {isListening ? (
                  <>
                    <StopIcon className="w-6 h-6 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <MicrophoneIcon className="w-6 h-6 mr-2" />
                    Start Recording
                  </>
                )}
              </button>
              {isListening && (
                <p className="text-sm text-slate-500 mt-2 animate-pulse">Listening...</p>
              )}
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
              <p>
                Speech recognition isn’t supported in your browser.
              </p>
            </div>
          )}

          {transcript && !feedback && !isAnalyzing && (
            <div className="p-4 bg-slate-50 border rounded-md">
              <p className="text-sm font-medium text-slate-600 mb-1">What I heard:</p>
              <p className="italic text-slate-800">“{transcript}”</p>
            </div>
          )}

          {/* Feedback */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <SpinnerIcon className="w-12 h-12" />
              <p className="mt-4 text-lg font-semibold text-gray-700">Analyzing your speech...</p>
            </div>
          )}

          {!isAnalyzing && error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              <p>{error}</p>
            </div>
          )}

          {!isAnalyzing && !error && feedback && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-slate-100 rounded-lg">
                <p className="text-sm font-medium text-slate-600">Overall Score</p>
                <p className={`text-5xl font-bold ${scoreColor}`}>
                  {feedback.overallScore}
                  <span className="text-2xl text-slate-500">/100</span>
                </p>
              </div>

              <p className="text-slate-700">{feedback.feedback}</p>

              {feedback.mispronouncedWords.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-800">Words to practice:</h4>
                  <ul className="mt-2 space-y-1">
                    {feedback.mispronouncedWords.map((word, i) => (
                      <li key={`${word.expected}-${i}`} className="flex items-center text-sm p-2 bg-red-50 rounded-md">
                        <XCircleIcon className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                        You said <strong className="mx-1">“{word.actual}”</strong>
                        instead of <strong className="mx-1">“{word.expected}”</strong>.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.positivePoints.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-800">You pronounced these well:</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {feedback.positivePoints.map((word, i) => (
                      <span key={`${word}-${i}`} className="flex items-center text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        <CheckCircleIcon className="w-4 h-4 mr-1" /> {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default memo(PronunciationCoachModal);

/* ---------- helpers ---------- */
function getFocusable(root: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
  return nodes.filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  );
}
