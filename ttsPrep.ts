// src/utils/ttsPrep.ts
// =============================================================================
// TTS prep (dialogue -> stable chunks) — strict-safe, TS5, ESM
// - No "possibly undefined" slips under strict + exactOptionalPropertyTypes
// - Precompiled regex, minimal allocations
// - Level-aware hard cap with smart cut points
// =============================================================================

import type { LevelId } from "../types/levelConfig";

export type TTSChunk = {
  speaker: "Luna" | "Liam" | string;
  text: string;
};

/* --------------------------------
   Constants
-------------------------------- */

const MAX_WORDS_BY_LEVEL: Readonly<Record<LevelId, number>> = {
  A1: 12,
  A2: 14,
  B1: 18,
  B2: 18,
  C1: 22,
  C2: 25,
} as const;

const SHORT_PAUSE = " … ";
const CUTIN = " — ";

/* --------------------------------
   Precompiled regex (no globals)
-------------------------------- */

// **Speaker:** text
const RX_SPEAKER_LINE = /^\*\*([A-Za-z0-9_]+):\*\*\s*(.*)$/;

// Only Luna/Liam lines for pro TTS export pane
const RX_ALLOWED_SPEAKERS = /^\*\*(Luna|Liam):\*\*/;

// Stage directions, tags, punctuation normalizers
const RX_SFX = /\[(?:SFX|Ambiance|Intro\s*Music|Outro\s*Music)[^\]]*\]/gi;
const RX_SHORT_PAUSE = /\[(?:short|brief)\s+pause\]/gi;
const RX_LAUGHS = /\[(?:laughs|chuckles|giggles|sighs)[^\]]*\]/gi;
const RX_BRACKETS = /\[[^\]]+\]/g;
const RX_TAGS = /<[^>]+>/g;
const RX_QUOTES_DOUBLE = /[“”]/g;
const RX_QUOTES_SINGLE = /[‘’]/g;
const RX_DASHES = /[–—]/g;
const RX_NBSP = /\u00A0/g;
const RX_SPACES = /\s{2,}/g;

const RX_WORD_SPLIT = /\s+/g;
const RX_CONJ = /^(and|but|so|because|then|when|while|though|although|if)$/i;
const RX_END_PUNCT = /[.,;:!?]$/;

/* --------------------------------
   Helpers (pure)
-------------------------------- */

const normalize = (t: string): string =>
  t
    .replace(RX_SFX, "")
    .replace(RX_SHORT_PAUSE, SHORT_PAUSE)
    .replace(RX_LAUGHS, " haha ")
    .replace(RX_BRACKETS, "")
    .replace(RX_TAGS, " ")
    .replace(RX_QUOTES_DOUBLE, '"')
    .replace(RX_QUOTES_SINGLE, "'")
    .replace(RX_DASHES, "-")
    .replace(RX_NBSP, " ")
    .replace(RX_SPACES, " ")
    .trim();

const wordCount = (s: string): number => {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  return trimmed.split(RX_WORD_SPLIT).length;
};

const isConjunction = (w: string): boolean => RX_CONJ.test(w.replace(/[^a-z]/gi, ""));

/**
 * Pick one split near the middle at a natural boundary:
 * - Prefer after punctuation
 * - Or after a conjunction
 * - Otherwise the exact middle
 */
const splitOnceSmart = (s: string, cap: number): [string, string] => {
  const words = s.trim().split(RX_WORD_SPLIT);
  const total = words.length;
  if (total <= 1) return [s, ""];

  const mid = Math.floor(total / 2);
  let idx = -1;

  // Search symmetrically around mid, with a small window
  for (let d = 0; d <= Math.ceil(cap / 2); d++) {
    const i1 = mid - d;
    const i2 = mid + d;

    if (i1 > 5 && i1 < total) {
      const w1 = words[i1] ?? "";
      if (RX_END_PUNCT.test(w1) || isConjunction(w1)) {
        idx = i1 + 1;
        break;
      }
    }
    if (i2 < total - 5 && i2 >= 0) {
      const w2 = words[i2] ?? "";
      if (RX_END_PUNCT.test(w2) || isConjunction(w2)) {
        idx = i2 + 1;
        break;
      }
    }
  }

  if (idx === -1) idx = mid;

  const left = words.slice(0, idx).join(" ");
  const right = words.slice(idx).join(" ");
  return [left, right];
};

const enforceCap = (s: string, cap: number): string => {
  const queue: string[] = [s.trim()];
  for (let i = 0; i < queue.length; ) {
    const part = queue[i] ?? "";
    if (wordCount(part) > cap) {
      const [a, b] = splitOnceSmart(part, cap);
      queue.splice(i, 1, a, b);
    } else {
      i += 1;
    }
  }
  return queue.join(CUTIN);
};

/* --------------------------------
   Public API
-------------------------------- */

export function prepPodcastForTTS(raw: string, level: LevelId): TTSChunk[] {
  const cap = MAX_WORDS_BY_LEVEL[level] ?? 18;
  if (!raw.trim()) return [];

  // Keep only well-formed dialogue lines for the two pro-voices
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => RX_ALLOWED_SPEAKERS.test(l));

  const chunks: TTSChunk[] = [];

  for (const line of lines) {
    const m = RX_SPEAKER_LINE.exec(line);
    if (!m) continue;

    const speaker = m[1] as "Luna" | "Liam" | string;
    let text = normalize(m[2] ?? "");
    if (!text) continue;

    if (wordCount(text) > cap) {
      text = enforceCap(text, cap);
    }

    // Add a gentle cut-in if the line starts with a short interjection
    if (!text.includes(CUTIN) && /^(right|yeah|yep|oh wow|got it|mm-hm)\b/i.test(text)) {
      text += CUTIN;
    }

    chunks.push({ speaker, text });
  }

  return chunks;
}
