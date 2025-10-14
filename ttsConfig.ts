// src/utils/ttsConfig.ts
// =============================================================================
// ElevenLabs Voice Configuration — Real Smart English 2025
// - CEFR-level presets mapped to ElevenLabs "voice_settings"
// - Pure functions, strict typing, ESM-only, no side effects
// - Safe defaults + clamp to [0..1] for numeric settings
// =============================================================================

import type { LevelId } from "../types/levelConfig";

/**
 * API-facing Voice Settings shape (snake_case keys match ElevenLabs API).
 * Fields are documented across ElevenLabs API references and client SDKs:
 * - stability:          0..1
 * - similarity_boost:   0..1
 * - style:              0..1 (supported by common models)
 * - use_speaker_boost:  boolean
 */
export interface ElevenLabsVoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

/** Current production TTS model id for multilingual English use. */
export const ELEVENLABS_MODEL_ID = "eleven_multilingual_v2" as const;

/** Global defaults applied across all levels unless overridden. */
export const ELEVENLABS_GENERAL_SETTINGS = {
  model_id: ELEVENLABS_MODEL_ID,
  similarity_boost: 0.75, // sane, widely-used default
  use_speaker_boost: true,
} as const;

/** Clamp helper to keep numeric params in the [0..1] window. */
const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/**
 * CEFR-level base voice traits.
 * A1–A2 → calmer, steadier delivery
 * B1–B2 → a bit more expressive
 * C1–C2 → noticeably more dynamic
 */
const LEVEL_BASE: Record<
  LevelId,
  // keep minimal base to reduce duplication; similarity/use_speaker come from GENERAL by default
  { stability: number; style: number }
> = {
  A1: { stability: 0.35, style: 0.45 },
  A2: { stability: 0.35, style: 0.45 },
  B1: { stability: 0.28, style: 0.6 },
  B2: { stability: 0.28, style: 0.6 },
  C1: { stability: 0.22, style: 0.7 },
  C2: { stability: 0.22, style: 0.7 },
} as const;

/**
 * Back-compat: legacy config shape (stability + style).
 * If other parts of the app still expect this, use this getter.
 */
export interface ElevenLabsConfig {
  stability: number;
  style: number;
}

/** Legacy getter retained for parity. */
export function getElevenLabsVoiceConfig(level: LevelId): ElevenLabsConfig {
  const base = LEVEL_BASE[level] ?? LEVEL_BASE.B1;
  return { stability: base.stability, style: base.style };
}

/**
 * New: full API-facing settings builder.
 * Merges CEFR base with global defaults and optional per-call overrides.
 */
export function buildVoiceSettingsForLevel(
  level: LevelId,
  overrides?: Partial<ElevenLabsVoiceSettings>
): ElevenLabsVoiceSettings {
  const base = LEVEL_BASE[level] ?? LEVEL_BASE.B1;

  // Start from global defaults, then fold in base, then caller overrides.
  const merged: ElevenLabsVoiceSettings = {
    stability: clamp01(base.stability),
    similarity_boost: clamp01(
      overrides?.similarity_boost ?? (ELEVENLABS_GENERAL_SETTINGS.similarity_boost as number)
    ),
    style: overrides?.style !== undefined ? clamp01(overrides.style) : clamp01(base.style),
    use_speaker_boost:
      overrides?.use_speaker_boost ?? (ELEVENLABS_GENERAL_SETTINGS.use_speaker_boost as boolean),
  };

  // Allow caller to override stability last (kept separate so it isn’t forced to clamp twice).
  if (overrides?.stability !== undefined) merged.stability = clamp01(overrides.stability);

  return merged;
}

/**
 * Optional helper: full payload object if you prefer one-stop config
 * when calling your ElevenLabs client (model + voice_settings).
 */
export function buildTtsPayload(
  level: LevelId,
  overrides?: Partial<ElevenLabsVoiceSettings>
): {
  model_id: typeof ELEVENLABS_MODEL_ID;
  voice_settings: ElevenLabsVoiceSettings;
} {
  return {
    model_id: ELEVENLABS_MODEL_ID,
    voice_settings: buildVoiceSettingsForLevel(level, overrides),
  };
}
