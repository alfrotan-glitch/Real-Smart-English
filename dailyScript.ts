// src/types/dailyScript.ts
// =============================================================================
// Daily Script Types (RSE 2025) — pure, deterministic, no runtime deps on other type modules
// - No value-level imports from ../types/index to avoid "import type" runtime errors
// - CEFR levels defined locally as string literals for schema and guards
// - Discriminated unions for blocks; readonly-friendly shapes
// =============================================================================

/* ============================================================================
   Versioning
============================================================================ */
export const DAILY_SCRIPT_VERSION = "2025.10.04";

/* ============================================================================
   Nominal tags (compile-time only)
============================================================================ */
export type ISODateString = string & { readonly __iso_date: true };
export type Seconds = number & { readonly __seconds: true };
export type Minutes = number & { readonly __minutes: true };
export type WordsPerMinute = number & { readonly __wpm: true };

/* ============================================================================
   Local CEFR level literals (to avoid runtime imports)
============================================================================ */
export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CEFRLevel = (typeof CEFR_LEVELS)[number];

/* ============================================================================
   Modes
============================================================================ */
export enum DailyScriptMode {
  Story = "Story",
  Podcast = "Podcast",
  Conversation = "Conversation",
}

/* ============================================================================
   Core structures
============================================================================ */
export interface DailyScriptMeta {
  date_iso: ISODateString;
  day_index?: number;
  mode: DailyScriptMode;
  level: CEFRLevel; // local literal union
  duration_minutes: Minutes;
  pacing_wpm: WordsPerMinute;
  accent?: string; // keep flexible for caller
  target_language?: string; // keep flexible for caller
  seed?: string;
  title: string;
  topic: string;
  technique_of_day: string;
}

export interface TechniquePlan {
  explain: string;
  why_it_works: string;
  how_today_uses_it: string;
}

export interface OutlineSection {
  name: string;
  goal?: string;
  target_seconds: Seconds;
  target_sentences?: number;
}
export interface Outline {
  sections: readonly OutlineSection[];
}

/* ============================================================================
   Script blocks (discriminated)
============================================================================ */
export type BlockBase = {
  section: string;
  connectors_used?: readonly string[];
  repeats?: readonly string[];
};

export type NarrationBlock = BlockBase & {
  type: "narration";
  speaker?: never;
  text: string;
};

export type DialogueBlock = BlockBase & {
  type: "dialogue";
  speaker: string;
  text: string;
};

export type InstructionBlock = BlockBase & {
  type: "instruction";
  speaker?: string;
  text: string;
};

export type ScriptBlock = NarrationBlock | DialogueBlock | InstructionBlock;

export interface Script {
  blocks: readonly ScriptBlock[];
}

/* ============================================================================
   Practice / Shadowing / Review / Glossary / Timing / QA
============================================================================ */
export interface PracticePlan {
  active_recall: readonly string[];
  micro_output_prompt: string;
  deliberate_focus?: string;
}

export interface ShadowingSlice {
  snippet_text: string;
  start_sec: Seconds;
  end_sec: Seconds;
  tips: string;
}

export interface ReviewPlan {
  spaced_items: readonly string[];
  from_review_queue?: readonly string[];
}

export interface GlossaryItem {
  chunk: string;
  level?: string; // human tag
  definition_simple: string;
  example: string;
}

export interface TimingCue {
  start: Seconds;
  end: Seconds;
  text: string;
}
export interface Timing {
  wpm_estimate: WordsPerMinute;
  cues?: readonly TimingCue[];
}

export interface QualityAssurance {
  avg_sentence_length: number;
  connectors_ok: boolean;
  repetition_ok: boolean;
  duration_fit_ok: boolean;
}

export interface DailyScriptNotes {
  show_notes?: string;
  teaser?: string;
}

/* ============================================================================
   Aggregate
============================================================================ */
export interface DailyScript {
  meta: DailyScriptMeta;
  technique_plan: TechniquePlan;
  outline: Outline;
  script: Script;
  practice: PracticePlan;
  shadowing: ShadowingSlice;
  review: ReviewPlan;
  glossary: readonly GlossaryItem[];
  timing: Timing;
  qa: QualityAssurance;
  notes?: DailyScriptNotes;
}

/* ============================================================================
   Advisory JSON schema — literals only, no cross-module runtime values
============================================================================ */
export const DAILY_SCRIPT_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "DailyScript",
  type: "object",
  required: [
    "meta",
    "technique_plan",
    "outline",
    "script",
    "practice",
    "shadowing",
    "review",
    "glossary",
    "timing",
    "qa",
  ],
  properties: {
    meta: {
      type: "object",
      required: [
        "date_iso",
        "mode",
        "level",
        "duration_minutes",
        "pacing_wpm",
        "title",
        "topic",
        "technique_of_day",
      ],
      properties: {
        date_iso: { type: "string", format: "date" },
        day_index: { type: "number" },
        mode: { enum: Object.values(DailyScriptMode) },
        level: { enum: CEFR_LEVELS },
        duration_minutes: { type: "number", minimum: 1 },
        pacing_wpm: { type: "number", minimum: 60, maximum: 220 },
        accent: { type: "string" },
        target_language: { type: "string" },
        seed: { type: "string" },
        title: { type: "string", minLength: 1 },
        topic: { type: "string", minLength: 1 },
        technique_of_day: { type: "string", minLength: 1 },
      },
      additionalProperties: false,
    },
    technique_plan: {
      type: "object",
      required: ["explain", "why_it_works", "how_today_uses_it"],
      properties: {
        explain: { type: "string", minLength: 1 },
        why_it_works: { type: "string", minLength: 1 },
        how_today_uses_it: { type: "string", minLength: 1 },
      },
      additionalProperties: false,
    },
    outline: {
      type: "object",
      required: ["sections"],
      properties: {
        sections: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["name", "target_seconds"],
            properties: {
              name: { type: "string", minLength: 1 },
              goal: { type: "string" },
              target_seconds: { type: "number", minimum: 5 },
              target_sentences: { type: "number", minimum: 1 },
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
    script: {
      type: "object",
      required: ["blocks"],
      properties: {
        blocks: {
          type: "array",
          minItems: 1,
          items: {
            oneOf: [
              {
                type: "object",
                required: ["type", "section", "text"],
                properties: {
                  type: { const: "narration" },
                  section: { type: "string", minLength: 1 },
                  text: { type: "string", minLength: 1 },
                  connectors_used: { type: "array", items: { type: "string" } },
                  repeats: { type: "array", items: { type: "string" } },
                },
                additionalProperties: false,
              },
              {
                type: "object",
                required: ["type", "section", "speaker", "text"],
                properties: {
                  type: { const: "dialogue" },
                  section: { type: "string", minLength: 1 },
                  speaker: { type: "string", minLength: 1 },
                  text: { type: "string", minLength: 1 },
                  connectors_used: { type: "array", items: { type: "string" } },
                  repeats: { type: "array", items: { type: "string" } },
                },
                additionalProperties: false,
              },
              {
                type: "object",
                required: ["type", "section", "text"],
                properties: {
                  type: { const: "instruction" },
                  section: { type: "string", minLength: 1 },
                  speaker: { type: "string" },
                  text: { type: "string", minLength: 1 },
                  connectors_used: { type: "array", items: { type: "string" } },
                  repeats: { type: "array", items: { type: "string" } },
                },
                additionalProperties: false,
              },
            ],
          },
        },
      },
      additionalProperties: false,
    },
    practice: {
      type: "object",
      required: ["active_recall", "micro_output_prompt"],
      properties: {
        active_recall: { type: "array", minItems: 1, items: { type: "string" } },
        micro_output_prompt: { type: "string", minLength: 1 },
        deliberate_focus: { type: "string" },
      },
      additionalProperties: false,
    },
    shadowing: {
      type: "object",
      required: ["snippet_text", "start_sec", "end_sec", "tips"],
      properties: {
        snippet_text: { type: "string", minLength: 1 },
        start_sec: { type: "number", minimum: 0 },
        end_sec: { type: "number", minimum: 0 },
        tips: { type: "string", minLength: 1 },
      },
      additionalProperties: false,
    },
    review: {
      type: "object",
      required: ["spaced_items"],
      properties: {
        spaced_items: { type: "array", items: { type: "string" } },
        from_review_queue: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
    glossary: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        required: ["chunk", "definition_simple", "example"],
        properties: {
          chunk: { type: "string", minLength: 1 },
          level: { type: "string" },
          definition_simple: { type: "string", minLength: 1 },
          example: { type: "string", minLength: 1 },
        },
        additionalProperties: false,
      },
    },
    timing: {
      type: "object",
      required: ["wpm_estimate"],
      properties: {
        wpm_estimate: { type: "number", minimum: 60, maximum: 220 },
        cues: {
          type: "array",
          items: {
            type: "object",
            required: ["start", "end", "text"],
            properties: {
              start: { type: "number", minimum: 0 },
              end: { type: "number", minimum: 0 },
              text: { type: "string", minLength: 1 },
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
    qa: {
      type: "object",
      required: ["avg_sentence_length", "connectors_ok", "repetition_ok", "duration_fit_ok"],
      properties: {
        avg_sentence_length: { type: "number", minimum: 1 },
        connectors_ok: { type: "boolean" },
        repetition_ok: { type: "boolean" },
        duration_fit_ok: { type: "boolean" },
      },
      additionalProperties: false,
    },
    notes: {
      type: "object",
      properties: {
        show_notes: { type: "string" },
        teaser: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

/* ============================================================================
   Tiny guards (no deps)
============================================================================ */
export function isISODateString(x: unknown): x is ISODateString {
  return typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x);
}

export function isDailyScriptMode(x: unknown): x is DailyScriptMode {
  return typeof x === "string" && Object.values(DailyScriptMode).includes(x as DailyScriptMode);
}

export function isDailyScript(value: unknown): value is DailyScript {
  const v = value as Partial<DailyScript>;
  return (
    !!v &&
    typeof v === "object" &&
    !!v.meta &&
    isISODateString((v.meta as DailyScriptMeta).date_iso) &&
    isDailyScriptMode((v.meta as DailyScriptMeta).mode) &&
    CEFR_LEVELS.includes((v.meta as DailyScriptMeta).level as CEFRLevel) &&
    typeof (v.meta as DailyScriptMeta).title === "string" &&
    typeof (v.meta as DailyScriptMeta).topic === "string" &&
    !!v.script &&
    Array.isArray((v.script as Script).blocks)
  );
}

/* ============================================================================
   Pure utilities
============================================================================ */
export function estimateWPM(totalWords: number, minutes: number): WordsPerMinute {
  const raw = minutes > 0 ? totalWords / minutes : 0;
  const clamped = Math.max(60, Math.min(220, Math.round(raw)));
  return clamped as WordsPerMinute;
}

export function normalizeBlocks<T extends ScriptBlock>(blocks: readonly T[]): readonly T[] {
  return blocks.map(b => {
    const text = String((b as any).text || "").trim();
    const connectors = (b.connectors_used || []).map(s => String(s).trim()).filter(Boolean);
    const repeats = (b.repeats || []).map(s => String(s).trim()).filter(Boolean);
    return { ...b, text, connectors_used: connectors, repeats } as T;
  });
}
