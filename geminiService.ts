// src/services/geminiService.ts
// Final, production-grade. TS5 / Vite7. ESM-only. Client-safe env access via import.meta.env.VITE_*.

import { GoogleGenAI, Type } from "@google/genai";
import type {
  GenerateContentResponse,
  GenerateImagesResponse,
} from "@google/genai";
import type { DailyScript, DailyScriptMode } from "../types/dailyScript";
import type {
  LanguageLevel,
  Accent,
  TargetLanguage,
  PodcastStyle,
  PodcastMode,
  MonologueStyle,
  TeachingTechnique,
  OverlayIntensity,
  PodcastPacing,
  PodcastInformality,
  PodcastDuration,
  EmotionalArc,
  HookStyle,
  Tab,
  LearnerDNA,
  PreviousContentItem,
  SeoBundle,
  UploadPack,
} from "../types";

// IMPORTANT: these are RUNTIME values, not just types.
import {
  createLessonPlanPrompt,
  createBookletPrompt,
  createTopicSuggestionPrompt,
  createGlossaryPrompt,
  createCoverImagePrompt,
  createRefineSelectionPrompt,
  createIllustrationPromptsPrompt,
  createLearnerDNAPrompt,
  createPronunciationAnalysisPrompt,
  createChannelTrailerPrompt,
  createFeaturedVideoPrompt,
} from "./promptService";

export const MODELS = {
  TEXT: "gemini-2.5-flash",
  TEXT_STREAM: "gemini-2.5-flash",
  IMAGE: "imagen-4.0-generate-001",
} as const;

const ERRORS = {
  NO_API_KEY: "API key not found",
  PLAN_FAIL: "Plan generation failed",
  BOOKLET_FAIL: "Booklet generation failed",
  TOPIC_FAIL: "Topic suggestions failed",
  GLOSSARY_FAIL: "Glossary generation failed",
  IMAGE_FAIL: "Cover image generation failed",
  ILLUSTRATION_FAIL: "Illustration generation failed",
  DNA_FAIL: "Learner DNA synthesis failed",
  PRONUNCIATION_FAIL: "Pronunciation analysis failed",
  SCRIPT_REFINE_FAIL: "Script refine failed",
  TRAILER_FAIL: "Channel trailer generation failed",
  FEATURED_VIDEO_FAIL: "Featured video generation failed",
  DAILY_SCRIPT_FAIL: "Daily Script generation failed",
  SEO_FAIL: "SEO bundle generation failed",
} as const;

type JsonValue = unknown;

/* ---------------------------
   Utilities
--------------------------- */

function safeJsonParse<T extends JsonValue>(raw: string, label: string): T {
  const cleaned = String(raw ?? "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // try to salvage embedded json
  }
  const start = cleaned.search(/[\{\[]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (start >= 0 && end > start) {
    const slice = cleaned.slice(start, end + 1);
    try {
      return JSON.parse(slice) as T;
    } catch {
      // fallthrough
    }
  }
  throw new Error(`Invalid ${label} JSON`);
}

function getTextSafe(response: GenerateContentResponse): string {
  // @google/genai exposes .text on responses (see official docs).
  return String((response as any)?.text ?? "");
}

function toContents(input: string | Array<any>) {
  if (typeof input === "string") return [{ role: "user", parts: [{ text: input }] }];
  return input;
}

async function withRetry<T>(fn: () => Promise<T>, label: string, retries = 2): Promise<T> {
  let attempt = 0;
  let delay = 500;
  for (;;) {
    try {
      return await fn();
    } catch (e: any) {
      attempt++;
      if (attempt > retries) throw new Error(`${label} failed: ${String(e?.message || e)}`);
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

function resolveApiKey(): string | undefined {
  // Client-side only: use Vite-exposed envs
  return (
    (import.meta as any)?.env?.VITE_GOOGLE_GENAI_API_KEY ||
    (import.meta as any)?.env?.VITE_GEMINI_API_KEY
  );
}

function getAiClient(): GoogleGenAI {
  const apiKey = resolveApiKey();
  if (!apiKey) throw new Error(ERRORS.NO_API_KEY);
  return new GoogleGenAI({ apiKey });
}

const WPM_MAP: Record<string, number> = { veryslow: 105, slow: 125, natural: 145, fast: 165 };
const wpmFromPacing = (pacing: PodcastPacing): number =>
  WPM_MAP[String(pacing).replace(/\s+/g, "").toLowerCase()] ?? 125;

const getDayOfYearUTC = () => {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), 0, 1);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - start) / 86400000) + 1;
};

/* ---------------------------
   Public API
--------------------------- */

export async function generatePlan(
  level: LanguageLevel,
  topic: string,
  isAdaptiveLearning: boolean,
  performanceData: Record<string, number>,
  supplementalContent: string,
  learnerInterests: string[],
  learnerDNA: LearnerDNA | null,
  channelDescription: string,
  targetAudience: string,
  defaultTags: string[],
  seoKeywords: string[],
  accent: Accent,
  targetLanguage: TargetLanguage,
  teachingTechnique: TeachingTechnique
): Promise<string> {
  const ai = getAiClient();
  const prompt = createLessonPlanPrompt(
    level,
    topic,
    isAdaptiveLearning,
    performanceData,
    supplementalContent,
    learnerInterests,
    learnerDNA,
    channelDescription,
    targetAudience,
    defaultTags,
    seoKeywords,
    accent,
    targetLanguage,
    teachingTechnique
  );
  const response = await withRetry(
    () => ai.models.generateContent({ model: MODELS.TEXT, contents: toContents(prompt) }),
    "generatePlan"
  );
  const text = getTextSafe(response).trim();
  if (!text) throw new Error(ERRORS.PLAN_FAIL);
  return text;
}

export async function* generateBookletStream(
  args: Readonly<{
    level: LanguageLevel;
    topic: string;
    host1Persona: string;
    host2Persona: string;
    hostRelationship: string;
    channelName: string;
    podcastMode: PodcastMode;
    monologueStyle: MonologueStyle;
    podcastPacing: PodcastPacing;
    podcastInformality: PodcastInformality;
    podcastStyle: PodcastStyle;
    overlayIntensity: OverlayIntensity;
    podcastDuration: PodcastDuration;
    previousContent: PreviousContentItem[];
    supplementalContent: string;
    lessonPlan: string;
    learnerInterests: string[];
    generateShowNotes: boolean;
    generateSocialMediaTeaser: boolean;
    podcastBackstory: string;
    realismIntensity: number;
    isEcosystemEngineEnabled: boolean;
    emotionalArc: EmotionalArc;
    hookStyle: HookStyle;
    teachingTechnique: TeachingTechnique;
    channelDescription: string;
    targetAudience: string;
    defaultTags: string[];
    seoKeywords: string[];
    accent: Accent;
    targetLanguage: TargetLanguage;
    core_audio_srt?: { id?: string; filename?: string; content: string; anchor?: "mid" | "intro" | "outro" };
  }>
): AsyncGenerator<string> {
  const ai = getAiClient();
  const prompt = createBookletPrompt(
    args.level,
    args.topic,
    args.host1Persona,
    args.host2Persona,
    args.hostRelationship,
    args.channelName,
    args.podcastMode,
    args.monologueStyle,
    args.podcastPacing,
    args.podcastInformality,
    args.podcastStyle,
    args.overlayIntensity,
    args.podcastDuration,
    args.previousContent,
    args.supplementalContent,
    args.lessonPlan,
    args.learnerInterests,
    args.generateShowNotes,
    args.generateSocialMediaTeaser,
    args.podcastBackstory,
    args.realismIntensity,
    args.isEcosystemEngineEnabled,
    args.emotionalArc,
    args.hookStyle,
    args.teachingTechnique,
    args.channelDescription,
    args.targetAudience,
    args.defaultTags,
    args.seoKeywords,
    args.accent,
    args.targetLanguage,
    args.core_audio_srt
  );
  const stream: AsyncIterable<GenerateContentResponse> = await withRetry(
    () => ai.models.generateContentStream({ model: MODELS.TEXT_STREAM, contents: toContents(prompt) }),
    "generateBookletStream"
  );
  for await (const chunk of stream) {
    const piece = String((chunk as any)?.text ?? "").trim();
    if (piece) yield piece;
  }
}

export async function generateChannelTrailer(
  channelDescription: string,
  targetAudience: string,
  defaultTags: string[],
  seoKeywords: string[],
  host1Persona: string,
  host2Persona: string
): Promise<string> {
  const ai = getAiClient();
  const prompt = createChannelTrailerPrompt(
    channelDescription,
    targetAudience,
    defaultTags,
    seoKeywords,
    host1Persona,
    host2Persona
  );
  const response = await withRetry(
    () => ai.models.generateContent({ model: MODELS.TEXT, contents: toContents(prompt) }),
    "generateChannelTrailer"
  );
  const text = getTextSafe(response).trim();
  if (!text) throw new Error(ERRORS.TRAILER_FAIL);
  return text;
}

export async function generateFeaturedVideo(
  channelDescription: string,
  targetAudience: string,
  defaultTags: string[],
  seoKeywords: string[],
  host1Persona: string,
  host2Persona: string
): Promise<string> {
  const ai = getAiClient();
  const prompt = createFeaturedVideoPrompt(
    channelDescription,
    targetAudience,
    defaultTags,
    seoKeywords,
    host1Persona,
    host2Persona
  );
  const response = await withRetry(
    () => ai.models.generateContent({ model: MODELS.TEXT, contents: toContents(prompt) }),
    "generateFeaturedVideo"
  );
  const text = getTextSafe(response).trim();
  if (!text) throw new Error(ERRORS.FEATURED_VIDEO_FAIL);
  return text;
}

export const suggestTopics = async (level: LanguageLevel): Promise<string[]> => {
  const ai = getAiClient();
  const prompt = createTopicSuggestionPrompt(level);
  const response = await withRetry(
    () =>
      ai.models.generateContent({
        model: MODELS.TEXT,
        contents: toContents(prompt),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { topics: { type: Type.ARRAY, items: { type: Type.STRING } } },
            required: ["topics"],
          },
        },
      }),
    "suggestTopics"
  );
  const data = safeJsonParse<{ topics: string[] }>(getTextSafe(response), "topics");
  if (Array.isArray(data.topics)) return data.topics;
  throw new Error(ERRORS.TOPIC_FAIL);
};

export const generateGlossary = async (
  content: string,
  level: LanguageLevel
): Promise<{ term: string; definition: string }[]> => {
  const ai = getAiClient();
  const prompt = createGlossaryPrompt(content, level);
  const response = await withRetry(
    () =>
      ai.models.generateContent({
        model: MODELS.TEXT,
        contents: toContents(prompt),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              glossary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { term: { type: Type.STRING }, definition: { type: Type.STRING } },
                  required: ["term", "definition"],
                },
              },
            },
            required: ["glossary"],
          },
        },
      }),
    "generateGlossary"
  );
  const result = safeJsonParse<{ glossary: { term: string; definition: string }[] }>(
    getTextSafe(response),
    "glossary"
  );
  if (Array.isArray(result.glossary)) return result.glossary;
  throw new Error(ERRORS.GLOSSARY_FAIL);
};

export const generateCoverImage = async (title: string, topic: string): Promise<string> => {
  const ai = getAiClient();
  const prompt = createCoverImagePrompt(title, topic);
  const response: GenerateImagesResponse = await withRetry(
    () =>
      ai.models.generateImages({
        model: MODELS.IMAGE,
        prompt,
        config: { numberOfImages: 1, outputMimeType: "image/jpeg", aspectRatio: "4:3" },
      }),
    "generateCoverImage"
  );
  const bytes = (response as any)?.generatedImages?.[0]?.image?.imageBytes;
  if (!bytes) throw new Error(ERRORS.IMAGE_FAIL);
  return bytes;
};

export const refineScriptSelection = async (
  selection: { text: string; contextBefore: string; contextAfter: string },
  command: string,
  host1Persona: string,
  host2Persona: string,
  fullContext: { [key in Tab]?: string }
): Promise<string> => {
  const ai = getAiClient();
  const prompt = createRefineSelectionPrompt(selection, command, host1Persona, host2Persona, fullContext);
  const response = await withRetry(
    () => ai.models.generateContent({ model: MODELS.TEXT, contents: toContents(prompt) }),
    "refineScriptSelection"
  );
  const text = getTextSafe(response).trim();
  if (!text) throw new Error(ERRORS.SCRIPT_REFINE_FAIL);
  return text;
};

async function mapLimit<T, R>(
  arr: readonly T[],
  limit: number,
  fn: (x: T) => Promise<R>
): Promise<R[]> {
  const ret: R[] = new Array(arr.length);
  let i = 0;

  const workers = new Array(Math.min(limit, arr.length)).fill(0).map(async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const idx = i++;
      if (idx >= arr.length) break;

      const item = arr[idx];
      if (item === undefined) continue; // برای TS سخت‌گیر
      ret[idx] = await fn(item);
    }
  });

  await Promise.all(workers);
  return ret;
}

export const generateIllustrations = async (
  bookletContent: string
): Promise<{ id: string; imageBytes: string }[]> => {
  const ai = getAiClient();
  const illustrationPrompt = createIllustrationPromptsPrompt(bookletContent);
  const promptResponse = await withRetry(
    () =>
      ai.models.generateContent({
        model: MODELS.TEXT,
        contents: toContents(illustrationPrompt),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prompts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { id: { type: Type.STRING }, prompt: { type: Type.STRING } },
                  required: ["id", "prompt"],
                },
              },
            },
            required: ["prompts"],
          },
        },
      }),
    "generateIllustrationPrompts"
  );
  const { prompts } = safeJsonParse<{ prompts: { id: string; prompt: string }[] }>(
    getTextSafe(promptResponse),
    "illustration prompts"
  );
  return mapLimit(prompts, 3, async ({ id, prompt }) => {
    const finalPrompt = `A vibrant, friendly educational illustration for an ESL booklet. ${prompt}`;
    const imageResponse = await withRetry(
      () =>
        ai.models.generateImages({
          model: MODELS.IMAGE,
          prompt: finalPrompt,
          config: { numberOfImages: 1, outputMimeType: "image/jpeg", aspectRatio: "16:9" },
        }),
      `generateImage:${id}`
    );
    const imageBytes = (imageResponse as any)?.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) throw new Error(`Image generation failed for id: ${id}`);
    return { id, imageBytes };
  });
};

export type PronunciationFeedback = {
  overallScore: number;
  feedback: string;
  mispronouncedWords: { expected: string; actual: string }[];
  positivePoints: string[];
};

export const analyzePronunciation = async (
  originalText: string,
  userTranscript: string
): Promise<PronunciationFeedback> => {
  const ai = getAiClient();
  const prompt = createPronunciationAnalysisPrompt(originalText, userTranscript);
  const response = await withRetry(
    () =>
      ai.models.generateContent({
        model: MODELS.TEXT,
        contents: toContents(prompt),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
              mispronouncedWords: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { expected: { type: Type.STRING }, actual: { type: Type.STRING } },
                  required: ["expected", "actual"],
                },
              },
              positivePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["overallScore", "feedback", "mispronouncedWords", "positivePoints"],
          },
        },
      }),
    "analyzePronunciation"
  );
  return safeJsonParse<PronunciationFeedback>(getTextSafe(response), "Pronunciation Feedback");
};

export const synthesizeLearnerDNA = async (
  performanceData: Record<string, number>,
  learnerInterests: string[],
  previousContent: PreviousContentItem[]
): Promise<LearnerDNA> => {
  const ai = getAiClient();
  const prompt = createLearnerDNAPrompt(performanceData, learnerInterests, previousContent);
  const response = await withRetry(
    () =>
      ai.models.generateContent({
        model: MODELS.TEXT,
        contents: toContents(prompt),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              persistentWeaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              inferredInterests: { type: Type.ARRAY, items: { type: Type.STRING } },
              nextRecommendedSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["strengths", "persistentWeaknesses", "inferredInterests", "nextRecommendedSteps"],
          },
        },
      }),
    "synthesizeLearnerDNA"
  );
  return safeJsonParse<LearnerDNA>(getTextSafe(response), "Learner DNA");
};

const SEO_BUNDLE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    seoTitle: { type: Type.STRING },
    seoDescription: { type: Type.STRING },
    seoTags: { type: Type.ARRAY, items: { type: Type.STRING } },
    primaryKeyword: { type: Type.STRING },
    chapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { at: { type: Type.STRING }, title: { type: Type.STRING } },
        required: ["at", "title"],
      },
    },
    filenames: {
      type: Type.OBJECT,
      properties: { video: { type: Type.STRING }, thumbnail: { type: Type.STRING } },
      required: ["video", "thumbnail"],
    },
  },
  required: ["seoTitle", "seoDescription", "seoTags", "primaryKeyword", "filenames"],
} as const;

export async function generateSeoBundle(params: {
  topic: string;
  channelName: string;
  defaultTags: string[];
  seoKeywords: string[];
  lessonPlan?: string;
  srtText?: string;
  targetLanguage: TargetLanguage;
}): Promise<SeoBundle> {
  const ai = getAiClient();
  const srtHint =
    params.srtText && params.srtText.trim().length > 0
      ? `Use THIS transcript as the source of truth:
---SRT_CORE---
${params.srtText.slice(0, 20000)}
---END---
`
      : "";
  const prompt = `
You are a YouTube SEO pack generator for an ESL educational podcast channel.
Channel: ${params.channelName}
Topic: ${params.topic}
Target language: ${params.targetLanguage}
Default tags: ${JSON.stringify(params.defaultTags)}
Priority keywords: ${JSON.stringify(params.seoKeywords)}
${srtHint}
If lesson plan is present, align with it:
${params.lessonPlan ?? ""}

Rules:
- Title ≤ 60 chars, primary keyword near the front, no clickbait.
- Description 1–2 short paragraphs, include 2–3 key phrases naturally.
- Tags unique, concise, mix of head + long-tail, ≤ 500 chars comma-separated.
- Chapters optional; if SRT present, derive HH:MM timestamps and concise titles.
- Filenames kebab-case including main keyword.
Return a single JSON that validates the provided schema.
`.trim();
  const response = await withRetry(
    () =>
      ai.models.generateContent({
        model: MODELS.TEXT,
        contents: toContents(prompt),
        config: {
          responseMimeType: "application/json",
          responseSchema: SEO_BUNDLE_SCHEMA as any,
        },
      }),
    "generateSeoBundle"
  );
  const json = safeJsonParse<SeoBundle>(getTextSafe(response), "SEO Bundle");
  if (!json) throw new Error(ERRORS.SEO_FAIL);
  return json;
}

export async function buildUploadPackFromSeo(bundle: SeoBundle): Promise<UploadPack> {
  return {
    title: bundle.seoTitle,
    description: bundle.seoDescription,
    tags: bundle.seoTags,
    filenames: bundle.filenames,
    chapters: bundle.chapters ?? [],
  };
}

const DAILY_SCRIPT_SYSTEM_INSTRUCTIONS = `You are the Daily Script Engine for an ESL learning app.
Goal: Generate a complete daily teaching script in one of three modes: "Story", "Podcast", or "Conversation".
Duration strictly controls length; WPM must fit CEFR and requested pacing.
If supplemental_text is provided, use it as primary source.
Only include fields relevant to the chosen mode.
Comprehensible Input, Active Recall, Spaced Repetition, Shadowing, Micro-Output, Deliberate Practice, Interleaving are mandatory.
Podcast structures:
- Monologue: [Cold Open → Teach → Recap]
- Dialogue: [Cold Open → Segment 1 → Micro-Practice → Segment 2 → Recap → CTA]
Story: [Hook, Context, Conflict, Action, Resolution, Reflection].
Conversation: participants (2–3, roles), scenario/goal, turn_budget by duration.
Return a single JSON object that validates the schema.`;

const DAILY_SCRIPT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    meta: {
      type: Type.OBJECT,
      properties: {
        date_iso: { type: Type.STRING },
        day_index: { type: Type.INTEGER },
        mode: { type: Type.STRING, enum: ["Story", "Podcast", "Conversation"] },
        level: { type: Type.STRING, enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
        duration_minutes: { type: Type.INTEGER },
        pacing_wpm: { type: Type.INTEGER },
        accent: { type: Type.STRING },
        target_language: { type: Type.STRING },
        seed: { type: Type.STRING },
        title: { type: Type.STRING },
        topic: { type: Type.STRING },
        technique_of_day: { type: Type.STRING },
      },
      required: ["date_iso", "mode", "level", "duration_minutes", "pacing_wpm", "title", "topic", "technique_of_day"],
    },
    technique_plan: {
      type: Type.OBJECT,
      properties: {
        explain: { type: Type.STRING },
        why_it_works: { type: Type.STRING },
        how_today_uses_it: { type: Type.STRING },
      },
      required: ["explain", "why_it_works", "how_today_uses_it"],
    },
    outline: {
      type: Type.OBJECT,
      properties: {
        sections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              goal: { type: Type.STRING },
              target_seconds: { type: Type.NUMBER },
              target_sentences: { type: Type.INTEGER },
            },
            required: ["name", "target_seconds"],
          },
        },
      },
      required: ["sections"],
    },
    script: {
      type: Type.OBJECT,
      properties: {
        blocks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              section: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["narration", "dialogue", "instruction"] },
              speaker: { type: Type.STRING },
              text: { type: Type.STRING },
              connectors_used: { type: Type.ARRAY, items: { type: Type.STRING } },
              repeats: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["section", "type", "text"],
          },
        },
      },
      required: ["blocks"],
    },
    practice: {
      type: Type.OBJECT,
      properties: {
        active_recall: { type: Type.ARRAY, items: { type: Type.STRING } },
        micro_output_prompt: { type: Type.STRING },
        deliberate_focus: { type: Type.STRING },
      },
      required: ["active_recall", "micro_output_prompt"],
    },
    shadowing: {
      type: Type.OBJECT,
      properties: {
        snippet_text: { type: Type.STRING },
        start_sec: { type: Type.NUMBER },
        end_sec: { type: Type.NUMBER },
        tips: { type: Type.STRING },
      },
      required: ["snippet_text", "start_sec", "end_sec"],
    },
    review: {
      type: Type.OBJECT,
      properties: {
        spaced_items: { type: Type.ARRAY, items: { type: Type.STRING } },
        from_review_queue: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["spaced_items"],
    },
    glossary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          chunk: { type: Type.STRING },
          level: { type: Type.STRING },
          definition_simple: { type: Type.STRING },
          example: { type: Type.STRING },
        },
        required: ["chunk", "definition_simple", "example"],
      },
    },
    timing: {
      type: Type.OBJECT,
      properties: {
        wpm_estimate: { type: Type.NUMBER },
        cues: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.NUMBER },
              end: { type: Type.NUMBER },
              text: { type: Type.STRING },
            },
            required: ["start", "end", "text"],
          },
        },
      },
      required: ["wpm_estimate"],
    },
    qa: {
      type: Type.OBJECT,
      properties: {
        avg_sentence_length: { type: Type.NUMBER },
        connectors_ok: { type: Type.BOOLEAN },
        repetition_ok: { type: Type.BOOLEAN },
        duration_fit_ok: { type: Type.BOOLEAN },
      },
      required: ["avg_sentence_length", "connectors_ok", "repetition_ok", "duration_fit_ok"],
    },
    notes: {
      type: Type.OBJECT,
      properties: { show_notes: { type: Type.STRING }, teaser: { type: Type.STRING } },
      additionalProperties: false,
    },
  },
  required: ["meta", "technique_plan", "outline", "script", "practice", "shadowing", "review", "glossary", "timing", "qa"],
} as const;

const TECHNIQUES = [
  "Comprehensible Input",
  "Active Recall",
  "Spaced Repetition",
  "Shadowing",
  "Micro-Output",
  "Deliberate Practice",
  "Interleaving",
] as const;

const createDailyScriptPrompt = (params: any) =>
  `
Generate a DAILY ESL TEACHING SCRIPT as a SINGLE JSON object that VALIDATES against the Structured Output schema.

INPUTS:
date_iso: ${params.date_iso}
day_index: ${params.day_index}
mode: ${params.mode}
level: ${params.level}
duration_minutes: ${params.duration_minutes}
pacing_wpm: ${params.pacing_wpm}
accent: ${params.accent}
target_language: ${params.target_language}
seed: ${params.seed}
title: ${params.title}
topic: ${params.topic}
technique_of_day: ${params.technique_of_day}

performance_data: ${JSON.stringify(params.performance_data || {})}
learner_interests: ${JSON.stringify(params.learner_interests || [])}
review_queue: ${JSON.stringify(params.review_queue || [])}
supplemental_text: ${params.supplemental_text || ""}

REQUIREMENTS:
- Follow the system pedagogy and the mode structure.
- Duration controls allocation; compute target_seconds per section.
- CEFR-appropriate connectors and sentence lengths.
- Include: technique_plan, outline.sections, script.blocks, practice, shadowing, review, glossary, timing, qa, notes (optional).
- If supplemental_text is non-empty, derive topic/chunks from it and adapt the script accordingly.
- Output ONLY JSON.
`.trim();

export interface DailyScriptArgs {
  date_iso: string;
  mode: DailyScriptMode;
  level: LanguageLevel;
  duration_minutes: number;
  accent: Accent;
  target_language: TargetLanguage;
  title: string;
  topic: string;
  performance_data: Record<string, number>;
  learner_interests: string[];
  review_queue: string[];
  supplemental_text: string;
  podcast_format: PodcastMode;
  host1_persona: string;
  host2_persona: string;
  informality: PodcastInformality;
  overlay_intensity: OverlayIntensity;
  pacing: PodcastPacing;
}

export async function generateDailyScript(args: DailyScriptArgs): Promise<DailyScript> {
  const ai = getAiClient();
  const dayIndex = getDayOfYearUTC();
  const promptParams = {
    ...args,
    day_index: dayIndex,
    pacing_wpm: wpmFromPacing(args.pacing),
    seed: Math.random().toString(36).slice(2),
    technique_of_day: TECHNIQUES[(dayIndex - 1) % TECHNIQUES.length],
  };
  const prompt = createDailyScriptPrompt(promptParams);
  const response = await withRetry(
    () =>
      ai.models.generateContent({
        model: MODELS.TEXT,
        contents: toContents(prompt),
        config: {
          systemInstruction: DAILY_SCRIPT_SYSTEM_INSTRUCTIONS,
          responseMimeType: "application/json",
          responseSchema: DAILY_SCRIPT_RESPONSE_SCHEMA as any,
        },
      }),
    "generateDailyScript"
  );
  const jsonText = getTextSafe(response).trim();
  if (!jsonText) throw new Error(ERRORS.DAILY_SCRIPT_FAIL);
  return safeJsonParse<DailyScript>(jsonText, "Daily Script");
}
