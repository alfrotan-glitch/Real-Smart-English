// src/types/index.ts
// =============================================================================
// Production-grade type system (2025).
// - English-only identifiers.
// - Aligned with services/promptService.ts and types/dailyScript.ts.
// - Stable enums/aliases for UI, app store, and generators.
// =============================================================================

/* =========================
   Core levels & labels
========================= */

export enum LanguageLevel {
  A1 = "A1",
  A2 = "A2",
  B1 = "B1",
  B2 = "B2",
  C1 = "C1",
  C2 = "C2",
}

export const LANGUAGE_LEVEL_LABEL: Record<LanguageLevel, string> = {
  [LanguageLevel.A1]: "A1 (Beginner)",
  [LanguageLevel.A2]: "A2 (Elementary)",
  [LanguageLevel.B1]: "B1 (Intermediate)",
  [LanguageLevel.B2]: "B2 (Upper-Intermediate)",
  [LanguageLevel.C1]: "C1 (Advanced)",
  [LanguageLevel.C2]: "C2 (Proficient)",
} as const;

/** Canonical ordered list for UI pickers (read-only, strictly typed) */
export const LANGUAGE_LEVELS: readonly LanguageLevel[] = [
  LanguageLevel.A1,
  LanguageLevel.A2,
  LanguageLevel.B1,
  LanguageLevel.B2,
  LanguageLevel.C1,
  LanguageLevel.C2,
] as const;

/* =========================
   Smart Localization
========================= */

export enum Accent {
  US = "American",
  UK = "British",
  AUS = "Australian",
  Indian = "Indian",
}

export const ACCENT_LABEL: Record<Accent, string> = {
  [Accent.US]: "American",
  [Accent.UK]: "British",
  [Accent.AUS]: "Australian",
  [Accent.Indian]: "Indian",
} as const;

export enum TargetLanguage {
  English = "English",
  Spanish = "Spanish",
  German = "German",
  Arabic = "Arabic",
}

export const TARGET_LANGUAGE_LABEL: Record<TargetLanguage, string> = {
  [TargetLanguage.English]: "English",
  [TargetLanguage.Spanish]: "Spanish",
  [TargetLanguage.German]: "German",
  [TargetLanguage.Arabic]: "Arabic",
} as const;

/* =========================
   Podcast format & styles
========================= */

export enum PodcastMode {
  Dialogue = "Dialogue (Two Hosts)",
  Monologue = "Monologue (One Host)",
}

export enum MonologueStyle {
  LearningCoach = "Learning Coach (Direct & Clear)",
  InvestigativeJournalist = 'Investigative Journalist (Like "Serial")',
  GuidedMeditation = "Guided Meditation / Mindfulness",
  FiresideChat = "Fireside Chat (Intimate & Personal)",
  StandUpComedian = "Stand-up Comedian (Humorous)",
  MotivationalSpeaker = "Motivational Speaker (Energetic)",
  ScaryStoryteller = "Scary Storyteller (Suspenseful)",
  RomanticStoryteller = "Romantic Storyteller (Heartfelt)",
  HistoricalDoc = "Historical Documentary",
  NewsReport = "News Report (Formal)",
  CharacterMonologue = "Character Monologue (In-Character)",
  PoetrySlam = "Poetry Slam (Artistic & Rhythmic)",
}

export enum TeachingTechnique {
  Communicative = "Communicative Approach",
  NarrativeBased = "Narrative-Based Learning",
  GuidedDiscovery = "Guided Discovery (Socratic)",
  DirectInstruction = "Direct Instruction",
  PQA = "Personalized Q&A (PQA)",
}

export enum PodcastStyle {
  Immersive = "Immersive Storytelling / Role-Play",
  Commentary = "Commentary / Analysis",
}

/* =========================
   Shared simple unions
========================= */

export type OverlayIntensity = "Low" | "Medium" | "High";
export const OVERLAY_INTENSITIES: readonly OverlayIntensity[] = ["Low", "Medium", "High"] as const;

export type PodcastPacing = "Very Slow" | "Slow" | "Natural";
export const PODCAST_PACING_OPTIONS: readonly PodcastPacing[] = ["Very Slow", "Slow", "Natural"] as const;

export type PodcastInformality = "Very Informal" | "Informal" | "Slightly Formal";
export const PODCAST_INFORMALITY_OPTIONS: readonly PodcastInformality[] = [
  "Very Informal",
  "Informal",
  "Slightly Formal",
] as const;

export type PodcastDuration = 5 | 10 | 15 | 30 | 45 | 60;
export const PODCAST_DURATIONS: readonly PodcastDuration[] = [5, 10, 15, 30, 45, 60] as const;

export type EmotionalArc = "Educational" | "Inspirational" | "Comedic" | "Suspenseful";
export const EMOTIONAL_ARCS: readonly EmotionalArc[] = ["Educational", "Inspirational", "Comedic", "Suspenseful"] as const;

export type HookStyle = "None" | "Question" | "Bold Statement" | "Story";
export const HOOK_STYLES: readonly HookStyle[] = ["None", "Question", "Bold Statement", "Story"] as const;

/* =========================
   UI tabs & generation flow
========================= */

export type Tab = "insights" | "booklet" | "podcast" | "show_notes" | "teaser" | "daily_script";

export type GenerationStep = "idle" | "planning" | "generating" | "complete" | "error";
export type SectionProgress = "pending" | "in_progress" | "complete";

export type PreviousContentItem = {
  id: string;
  title: string;
  summary: string;
};

/** Stable section registry used by promptService and UI renderers */
export const generationSections = [
  { key: "TITLE", label: "Booklet Title" },
  { key: "OVERVIEW", label: "Lesson Overview" },
  { key: "READING_SECTION", label: "Reading Section" },
  { key: "LISTENING_SECTION", label: "Listening Section" },
  { key: "SPEAKING_SECTION", label: "Speaking Section" },
  { key: "WRITING_SECTION", label: "Writing Section" },
  { key: "QUIZ_SECTION", label: "Mini Quiz" },
  { key: "SUMMARY_SECTION", label: "Summary & Review" },
  { key: "DESIGN_SUGGESTIONS", label: "Design Suggestions" },
  { key: "PODCAST_SCRIPT", label: "Podcast Script" },
  { key: "SHOW_NOTES", label: "Show Notes" },
  { key: "SOCIAL_MEDIA_TEASER", label: "Social Media Teaser" },
] as const;

export type SectionKey = (typeof generationSections)[number]["key"];

/** For quick membership checks */
export const SECTION_KEYS: readonly SectionKey[] = generationSections.map((s) => s.key) as readonly SectionKey[];

/* =========================
   Learner DNA & Media
========================= */

export type LearnerDNA = {
  strengths: string[];
  persistentWeaknesses: string[];
  inferredInterests: string[];
  nextRecommendedSteps: string[];
};

export type Illustration = {
  id: string;
  imageBytes: string; // base64
};

/* =========================
   Core SRT (Audio transcript)
   Compatible with geminiService core_audio_srt arg
========================= */

export type CoreAudioSrt = {
  /** Filename of the core audio transcript (e.g., "episode_core.srt"). */
  filename: string;
  /** Raw SRT content (verbatim). Do not mutate downstream. */
  content: string;
  /** Anchor position within the script timeline. */
  anchor?: "intro" | "mid" | "outro";
  /** Stable identifier if stored externally. */
  id?: string;
  /** Total audio duration in seconds. */
  durationSec?: number;
  /** Origin of the transcript. */
  source?: "upload" | "yt" | "recording" | "other";
  /** ISO timestamp when stored. */
  createdAt?: string;
};

/* =========================
   SEO + Upload schema
========================= */

export type ChapterItem = { at: string; title: string };

export type SeoBundle = {
  /** ≤ 60 chars, keyword-front. */
  seoTitle: string;
  /** 1–2 short paragraphs, search-optimized. */
  seoDescription: string;
  /** Default tags plus long-tail keywords. */
  seoTags: string[];
  /** Primary keyword for ranking focus. */
  primaryKeyword: string;
  /** Video chapters for platforms that support them. */
  chapters: ChapterItem[];
  /** Deterministic, kebab-case filenames. */
  filenames: { video: string; thumbnail: string };
};

export type UploadPack = {
  /** Final title for upload. */
  title: string;
  /** Final description for upload. */
  description: string;
  /** Tags for upload. */
  tags: string[];
  /** Concrete filenames used on disk/cloud. */
  filenames: { video: string; thumbnail: string };
  /** Chapters mirrored from SeoBundle. */
  chapters: ChapterItem[];
};

/* =========================
   Role configuration (RSE v1)
========================= */

export type RoleConfig = {
  host: { name: string; tone: string };
  coach: { name: string; tone: string };
  characters: Array<{ name: string; role: "learner" | "customer" | "clerk" | "guest"; note?: string }>;
};

/* =========================
   Narrow branded scalars (optional helpers)
========================= */

/** ISO date (YYYY-MM-DD) nominal tag for compile-time clarity */
export type ISODateString = string & { readonly __iso_date: true };
/** Seconds nominal tag */
export type Seconds = number & { readonly __seconds: true };
/** Words-per-minute nominal tag */
export type WordsPerMinute = number & { readonly __wpm: true };

/* =========================
   Tiny runtime guards (no deps)
========================= */

export const isSectionKey = (x: unknown): x is SectionKey =>
  typeof x === "string" && (SECTION_KEYS as readonly string[]).includes(x);

export const isISODateString = (x: unknown): x is ISODateString =>
  typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x);

/* =========================
   Cross-module constants
========================= */

export const TYPES_VERSION = "2025.10.04";
