// src/utils/qa.ts
// =============================================================================
// QA Utilities — Podcast & Lesson Script Analysis
// - Lightweight static checks on text realism and compliance.
// - Aligns with LEVELS config and promptService rules.
// - No external dependencies.
// =============================================================================

import type { LEVELS, LevelId } from "../types/levelConfig";
import type { LanguageLevel } from "../types/index";

export interface PodcastQAResult {
  avgLen: number;
  tooLong: number;
  fillersPer100: number;
  targetFillers: [number, number];
  sfxCount: number;
  missingSections: string[];
  warnings: string[];
  error: string | null;
}

/**
 * Analyze podcast text quality against CEFR level expectations.
 * Used in render/validation pipeline before final TTS packaging.
 */
export function analyzePodcastText(text: string, levelId: LanguageLevel): PodcastQAResult {
  const L = LEVELS[levelId as LevelId];
  if (!L) {
    return {
      avgLen: 0,
      tooLong: 0,
      fillersPer100: 0,
      targetFillers: [0, 0],
      sfxCount: 0,
      missingSections: [],
      warnings: [`Invalid levelId: ${levelId}`],
      error: `Invalid levelId: ${levelId}`,
    };
  }

  const cleanText = text || "";
  const lines = cleanText
    .split("\n")
    .filter((l) => l.trim().startsWith("**") || l.includes(":"));
  const words = cleanText.split(/\s+/).filter(Boolean);

  const sentences: string[] = cleanText.match(/[^.!?]+[.!?]+/g) || [];
  const avgLen = Math.round(words.length / Math.max(1, sentences.length));

  const tooLongSentences = sentences.filter(
    (s) => s.trim().split(/\s+/).length > L.maxSentenceLen
  );

  const fillers =
    (cleanText.match(/\b(uh|um|you know|like|well|okay|alright|hmm)\b/gi) || [])
      .length;
  const turns = Math.max(1, lines.length);
  const fillersPer100 = Math.round((fillers / turns) * 100);

  const sfx =
    (cleanText.match(/\[(SFX|Ambiance|Intro Music|Outro Music)/gi) || []).length;
  const missingSections = [
    "<SECTION:TITLE>",
    "<SECTION:PODCAST_SCRIPT>",
  ].filter((tag) => !cleanText.includes(tag));

  const warnings: string[] = [];

  if (avgLen > L.maxSentenceLen)
    warnings.push(
      `Average sentence length (${avgLen}) exceeds max (${L.maxSentenceLen})`
    );
  if (tooLongSentences.length > 0)
    warnings.push(`${tooLongSentences.length} sentence(s) too long`);
  if (
    fillersPer100 < L.fillerPer100Turns[0] ||
    fillersPer100 > L.fillerPer100Turns[1]
  )
    warnings.push(
      `Fillers per 100 turns (${fillersPer100}) outside target range [${L.fillerPer100Turns.join(
        "-"
      )}]`
    );
  if (missingSections.length > 0)
    warnings.push(`Missing required sections: ${missingSections.join(", ")}`);
  if (sfx < L.sfxPer10min[0])
    warnings.push("Too few SFX elements for target realism");
  if (sfx > L.sfxPer10min[1])
    warnings.push("Too many SFX elements; reduce noise density");

  return {
    avgLen,
    tooLong: tooLongSentences.length,
    fillersPer100,
    targetFillers: L.fillerPer100Turns,
    sfxCount: sfx,
    missingSections,
    warnings,
    error: null,
  };
}
