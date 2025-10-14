// hooks/useTextToSpeech.ts
import type { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionAlternative { transcript: string; }
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  item(index: number): SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  item(index: number): SpeechRecognitionResult;
  length: number;
}
interface SpeechRecognitionEvent extends Event { results: SpeechRecognitionResultList; }
interface SpeechRecognitionErrorEvent extends Event { error: string; }
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

const SpeechRecognitionCtor =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined;

interface SpeechRecognitionOptions {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export const useSpeechRecognition = ({
  onResult,
  onError,
  lang = 'en-US',
  continuous = false,
  interimResults = false,
}: SpeechRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (!SpeechRecognitionCtor) {
      onErrorRef.current?.('Speech recognition is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;
    recognition.onstart = () => { setIsListening(true); };
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.results.length - 1; i >= 0; i--) {
        const res = event.results[i];
        if (res.isFinal) {
          const transcript = res[0]?.transcript ?? '';
          onResultRef.current?.(transcript);
          break;
        }
      }
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      onErrorRef.current?.(event.error);
      setIsListening(false);
    };
    recognition.onend = () => { setIsListening(false); };
    recognitionRef.current = recognition;
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current = null;
      }
    };
  }, [lang, continuous, interimResults]);

  const startListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec || isListening) return;
    try { rec.start(); } catch { onErrorRef.current?.('Speech recognition could not be started.'); setIsListening(false); }
  }, [isListening]);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try { rec.stop(); } catch {}
  }, []);

  return { isListening, startListening, stopListening, isSupported: !!SpeechRecognitionCtor };
};
