// hooks/usePodcastPlayer.ts
// Robust TTS queue player with stable refs, SSR safety, and minimal re-renders.

import type { useState, useEffect, useCallback, useRef } from 'react';
import type { AppState, AppActions } from '../store/appStore';
import type { useAppStore } from '../store/appStore';

export interface DialogueLine {
  host: string;
  text: string;
}

export type VoiceMap = Record<string, SpeechSynthesisVoice | null>;

type Synth = SpeechSynthesis | null;

type UsePodcastPlayerArgs = {
  hosts: string[];
};

export const usePodcastPlayer = ({ hosts }: UsePodcastPlayerArgs) => {
  // SSR-safe synth reference
  const synthRef = useRef<Synth>(
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null
  );

  // Read personas independently to avoid extra re-renders
  const host1Persona = useAppStore((s: AppState & AppActions) => s.host1Persona);
  const host2Persona = useAppStore((s: AppState & AppActions) => s.host2Persona);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentlySpeakingIndex, setCurrentlySpeakingIndex] = useState<number | null>(null);
  const [playbackRate, _setPlaybackRate] = useState(1);

  // external voice mapping (editable from outside if needed)
  const [voiceMap, setVoiceMap] = useState<VoiceMap>({});

  // Stable refs to beat stale closures
  const playingRef = useRef(false);
  const pausedRef = useRef(false);
  const playbackRateRef = useRef(1);
  const playlistRef = useRef<DialogueLine[]>([]);
  const voiceMapRef = useRef<VoiceMap>({});
  const currentIndexRef = useRef<number>(0);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  const setPlaybackRate = useCallback((rate: number) => {
    const clamped = Math.min(10, Math.max(0.1, rate));
    playbackRateRef.current = clamped;
    _setPlaybackRate(clamped);
  }, []);

  // Load voices when available (handles the weird "voiceschanged" timing)
  useEffect(() => {
    const synth = synthRef.current;
    if (!synth) return;

    const loadVoices = () => {
      const list = synth.getVoices();
      if (list && list.length) {
        const sorted = [...list].sort(
          (a, b) =>
            (a.lang || '').localeCompare(b.lang || '') ||
            (a.name || '').localeCompare(b.name || '')
        );
        setVoices(sorted);
      }
    };

    loadVoices();

    const handler = () => loadVoices();

    // Both event listener and property assignment for wide compatibility
    try {
      synth.addEventListener?.('voiceschanged', handler as EventListener);
    } catch {
      // ignore
    }
    const prev = (synth as any).onvoiceschanged;
    (synth as any).onvoiceschanged = handler;

    return () => {
      try {
        synth.removeEventListener?.('voiceschanged', handler as EventListener);
      } catch {
        // ignore
      }
      (synth as any).onvoiceschanged = prev || null;
      synth.cancel?.();
    };
  }, []);

  // Set a sensible default voice map once voices arrive or hosts change
  useEffect(() => {
    if (!hosts.length || !voices.length) return;

    // If we already mapped all hosts, don't reassign
    const alreadyComplete = hosts.every(h => voiceMap[h] !== undefined);
    if (alreadyComplete) return;

    const newMap: VoiceMap = { ...voiceMap };
    const available = [...voices];

    // rough heuristics for male/female named voices (for a friendlier default)
    const maleVoice =
      available.find(v => /male/i.test(v.name)) ||
      available.find(v => /David|Mark|George|Alex/i.test(v.name));
    const femaleVoice =
      available.find(v => /female/i.test(v.name)) ||
      available.find(v => /Zira|Hazel|Samantha|Victoria|Sara|Emily/i.test(v.name));

    const host1Name = String(host1Persona || '').split(':')[0].trim().toLowerCase();
    const host2Name = String(host2Persona || '').split(':')[0].trim().toLowerCase();

    // Host 0
    if (newMap[hosts[0]] === undefined) {
      if (host1Name.includes('luna') && femaleVoice) newMap[hosts[0]] = femaleVoice;
      else if (maleVoice) newMap[hosts[0]] = maleVoice;
      else newMap[hosts[0]] = available[0] ?? null;
    }

    // Host 1
    if (hosts[1] && newMap[hosts[1]] === undefined) {
      if (host2Name.includes('liam') && maleVoice && newMap[hosts[0]] !== maleVoice) {
        newMap[hosts[1]] = maleVoice;
      } else if (femaleVoice && newMap[hosts[0]] !== femaleVoice) {
        newMap[hosts[1]] = femaleVoice;
      } else {
        newMap[hosts[1]] = available.find(v => v !== newMap[hosts[0]]) ?? null;
      }
    }

    setVoiceMap(newMap);
  }, [hosts, voices, host1Persona, host2Persona, voiceMap]);

  // Keep the ref version in sync for playback
  useEffect(() => {
    voiceMapRef.current = voiceMap;
  }, [voiceMap]);

  const speakNext = useCallback(() => {
    const synth = synthRef.current;
    if (!synth) return;

    if (currentIndexRef.current >= playlistRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentlySpeakingIndex(null);
      currentUtteranceRef.current = null;
      return;
    }

    const line = playlistRef.current[currentIndexRef.current];
    const selectedVoice = voiceMapRef.current[line.host] ?? null;

    const utterance = new SpeechSynthesisUtterance(line.text);
    currentUtteranceRef.current = utterance;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang || utterance.lang;
    }

    utterance.rate = playbackRateRef.current;

    utterance.onstart = () => {
      setCurrentlySpeakingIndex(currentIndexRef.current);
    };

    utterance.onend = () => {
      if (!playingRef.current) return; // stopped during playback
      currentIndexRef.current += 1;
      // Avoid piling on the call stack
      setTimeout(speakNext, 0);
    };

    utterance.onerror = () => {
      // skip to next on error
      currentIndexRef.current += 1;
      setTimeout(speakNext, 0);
    };

    synth.speak(utterance);
  }, []);

  const play = useCallback((playlist: DialogueLine[]) => {
    const synth = synthRef.current;
    if (!synth || !playlist?.length) return;

    // resume from paused
    if (pausedRef.current) {
      synth.resume?.();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    // fresh start
    synth.cancel?.();
    currentUtteranceRef.current = null;

    playlistRef.current = playlist;
    currentIndexRef.current = 0;

    setIsPlaying(true);
    setIsPaused(false);
    speakNext();
  }, [speakNext]);

  const pause = useCallback(() => {
    const synth = synthRef.current;
    if (!synth || !playingRef.current) return;
    synth.pause?.();
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  const stop = useCallback(() => {
    const synth = synthRef.current;
    if (!synth) return;

    synth.cancel?.();
    currentUtteranceRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentlySpeakingIndex(null);
    currentIndexRef.current = 0;
  }, []);

  return {
    play,
    pause,
    stop,
    isPlaying,
    voices,
    currentlySpeakingIndex,
    playbackRate,
    setPlaybackRate,
    voiceMap,
    setVoiceMap,
  };
};
