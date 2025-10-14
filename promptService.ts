// services/promptService.ts — imports (fixed, TS5-safe)

import {
  LanguageLevel,         // enum -> value import (runtime)
  TeachingTechnique,     // enum -> value import (runtime)
  type Accent,
  type TargetLanguage,
  type PodcastStyle,
  type PodcastMode,
  type MonologueStyle,
  type OverlayIntensity,
  type PodcastPacing,
  type PodcastInformality,
  type PodcastDuration,
  type EmotionalArc,
  type HookStyle,
  type PreviousContentItem,
  type LearnerDNA,
  type Tab,
} from "../types/index";

import { LEVELS, type LevelId } from "../types/levelConfig"; // LEVELS is a runtime object

/* ============================================================================
   Section Order & Typings
============================================================================ */

export const SECTION_ORDER_BOOKLET = [
  "TITLE",
  "OVERVIEW",
  "READING_SECTION",
  "LISTENING_SECTION",
  "SPEAKING_SECTION",
  "WRITING_SECTION",
  "QUIZ_SECTION",
  "SUMMARY_SECTION",
  "DESIGN_SUGGESTIONS",
  "PODCAST_SCRIPT",
] as const;

export type BookletSection =
  | "TITLE"
  | "OVERVIEW"
  | "READING_SECTION"
  | "LISTENING_SECTION"
  | "SPEAKING_SECTION"
  | "WRITING_SECTION"
  | "QUIZ_SECTION"
  | "SUMMARY_SECTION"
  | "DESIGN_SUGGESTIONS"
  | "PODCAST_SCRIPT"
  | "SHOW_NOTES"
  | "SOCIAL_MEDIA_TEASER";

/* ============================================================================
   Utilities — Safe, Deterministic, Testable
============================================================================ */

// Safe helpers — no "possibly undefined", stable output

/* Safe helpers: null/undefined-proof + fence sanitizer */
const firstToken = (s: unknown, fallback = "Host"): string => {
  const str = typeof s === "string" ? s : s == null ? "" : String(s);
  if (!str) return fallback;
  const firstColon = str.indexOf(":");
  const head = firstColon >= 0 ? str.slice(0, firstColon) : str;
  const first = head.trim().split(/\s+/)[0];
  return first || fallback;
};

const fence = (lang: string, content: unknown): string => {
  const safeLang = typeof lang === "string" && lang.trim() ? lang.trim() : "text";
  const raw = content == null ? "" : String(content);
  const safe = raw.replace(/```/g, "`" + "``");
  return `\`\`\`${safeLang}\n${safe}\n\`\`\``;
};

const prettyJSON = (obj: unknown): string => JSON.stringify(obj ?? {}, null, 2);
const clean = (s: string): string => (s || "").trim();
const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));
const enumVal = <T>(v: T | string): string => String(v);

/** token estimate tuned for 2025 models */
export const estimateTokenLength = (s: string): number =>
  Math.ceil(((s ?? "").length / 3.8) * 1.05);

export const checkTokenBudget = (parts: string[], max = 8000) => {
  const total = parts.reduce((sum, p) => sum + estimateTokenLength(p), 0);
  return { ok: total <= max, total, overflow: Math.max(0, total - max) };
};

const sanitize = (s: string): string =>
  (s || "")
    .replace(/<\s*\/?\s*(script|style)\b[^>]*>/gi, "")
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/* ============================================================================
   Budget Priorities & Safe Truncation
============================================================================ */

const SECTION_PRIORITY: Record<string, number> = {
  TITLE: 10,
  OVERVIEW: 9,
  READING_SECTION: 9,
  LISTENING_SECTION: 9,
  PODCAST_SCRIPT: 8,
  SPEAKING_SECTION: 7,
  WRITING_SECTION: 7,
  QUIZ_SECTION: 6,
  SUMMARY_SECTION: 5,
  DESIGN_SUGGESTIONS: 4,
  SHOW_NOTES: 3,
  SOCIAL_MEDIA_TEASER: 2,
};

const SECTION_MIN_TOKENS: Record<string, number> = {
  READING_SECTION: 200,
  LISTENING_SECTION: 200,
  PODCAST_SCRIPT: 300,
  QUIZ_SECTION: 120,
};

const safeTruncate = (content: string, targetTokens: number): { text: string; tokens: number } => {
  const curr = estimateTokenLength(content);
  if (curr <= targetTokens) return { text: content, tokens: curr };
  const targetChars = Math.max(0, Math.floor((targetTokens / 1.05) * 3.8));
  let slice = content.slice(0, targetChars);
  const openFence = (slice.match(/```/g) || []).length % 2 === 1;
  if (openFence) {
    const lastFenceClose = content.lastIndexOf("```", targetChars);
    slice = lastFenceClose > -1 ? content.slice(0, lastFenceClose + 3) : content.slice(0, slice.lastIndexOf("\n"));
  } else {
    const lastDoubleNL = slice.lastIndexOf("\n\n");
    if (lastDoubleNL > 200) slice = slice.slice(0, lastDoubleNL);
  }
  slice = slice.trimEnd() + "\n…";
  return { text: slice, tokens: estimateTokenLength(slice) };
};

const enforceTokenBudget = (
  sections: { id: string; content: string }[],
  maxTokens: number,
  hardEnforce: boolean
): {
  content: string;
  dropped: string[];
  truncated: { id: string; fromTokens: number; toTokens: number }[];
} => {
  const meta = {
    dropped: [] as string[],
    truncated: [] as { id: string; fromTokens: number; toTokens: number }[],
  };
  const toks = (t: string) => estimateTokenLength(t);

  let acc = 0;
  const kept: { id: string; content: string }[] = [];

  const ordered = hardEnforce
    ? [...sections].sort((a, b) => (SECTION_PRIORITY[b.id] ?? 0) - (SECTION_PRIORITY[a.id] ?? 0))
    : sections;

  for (const sec of ordered) {
    const c = sanitize(sec.content);
    const t = toks(c);
    if (!hardEnforce || acc + t <= maxTokens) {
      kept.push({ id: sec.id, content: c });
      acc += t;
    } else {
      meta.dropped.push(sec.id);
    }
  }

  if (!hardEnforce || acc <= maxTokens) {
    return {
      content: sections
        .filter(s => kept.find(k => k.id === s.id))
        .map(s => kept.find(k => k.id === s.id)!.content)
        .join("\n"),
      dropped: meta.dropped,
      truncated: meta.truncated,
    };
  }

  let over = acc - maxTokens;
  const weighted = kept
    .map((k) => ({ ...k, tokens: toks(k.content) }))
    .sort((a, b) => b.tokens - a.tokens);

  for (const w of weighted) {
    if (over <= 0) break;
    const minFloor = SECTION_MIN_TOKENS[w.id] ?? 0;
    const maxCut = Math.min(((w.tokens * 0.25) | 0), over);
    const target = Math.max(w.tokens - maxCut, minFloor);
    if (target < w.tokens) {
      const { text: newContent, tokens: newTokens } = safeTruncate(w.content, target);
      meta.truncated.push({ id: w.id, fromTokens: w.tokens, toTokens: newTokens });
      w.content = newContent;
      over -= Math.max(0, w.tokens - newTokens);
    }
  }

  const order = new Map(kept.map((k, i) => [k.id, i]));
  const final = weighted.sort((a, b) => (order.get(a.id)! - order.get(b.id)!));
  return {
    content: final.map((f) => f.content).join("\n"),
    dropped: meta.dropped,
    truncated: meta.truncated,
  };
};

/* ============================================================================
   Accent / Locale / CEFR
============================================================================ */

const isBritishAccent = (accent: Accent): boolean => /UK|British|AUS/i.test(enumVal(accent));

const getLevelConstraints = (level: LanguageLevel): string => {
  const L = LEVELS[level as LevelId];
  return clean(`
**LEVEL GUARDRAILS (STRICT):**
- Vocabulary band: ${L.vocabBand}. Avoid rare/academic words.
- Sentences: avg ≈ ${L.avgSentenceLen} words; never exceed ${L.maxSentenceLen}.
- Allowed grammar/tenses: ${L.allowedTenses.join(", ")}. Avoid others.
- Idioms per 100 lines: ≤ ${L.idiomDensityPer100Lines}.
- Fillers per 100 turns: ${L.fillerPer100Turns[0]}–${L.fillerPer100Turns[1]}.
- Backchannel every ~${L.backchannelEveryN} turns.
- Self-repair per 10 minutes: ${L.selfRepairPer10min}.
- Conversation callbacks per 10 minutes: ${L.callbacksPer10min}.
- SFX per 10 minutes: ${L.sfxPer10min[0]}–${L.sfxPer10min[1]} (subtle).
- Speaking pace target: ${L.paceWPM} words/minute.
- Overlap intensity: ${L.overlapIntensity}.
- Reading story ≈ ${L.storyWords} words.
- Exercises: Reading MCQ ${L.exercises.readingMCQ}, Reading Fill ${L.exercises.readingFill},
  Listening MCQ ${L.exercises.listeningMCQ}, Quiz MCQ ${L.exercises.quizMCQ},
  Quiz T/F ${L.exercises.quizTF}, Quiz Fill ${L.exercises.quizFill}.
`);
};

const getLocalizationInstructions = (accent: Accent, targetLanguage: TargetLanguage): string => {
  const t = enumVal(targetLanguage);
  let out = `
- **SMART LOCALIZATION (CRITICAL):**
  - Target Language: ${t}.
`;
  if (/english/i.test(t)) {
    out += `- English Accent: ${enumVal(accent)}. Match spelling, vocab, cultural examples.
    - Spelling: Use ${isBritishAccent(accent) ? "British" : "American"} spelling.
    - Vocabulary: Regionally common terms (e.g., '${isBritishAccent(accent) ? "lift" : "elevator"}', '${isBritishAccent(accent) ? "biscuit" : "cookie"}').
    - Cultural Examples: Keep native to ${enumVal(accent)} context.`;
  } else {
    out += `- Translation: Produce natural ${t}.
    - Cultural Adaptation: Adjust references/idioms to ${t}-speaking regions.`;
  }
  return clean(out + "\n");
};

const getCulturalAdaptationNotes = (accent: Accent, targetLanguage: TargetLanguage): string => {
  const t = enumVal(targetLanguage);
  if (/english/i.test(t)) {
    return clean(`
- **CULTURAL NOTES:**
  - Use ${isBritishAccent(accent) ? "UK" : "US"} holidays, brands, and everyday references.
  - Avoid regionally obscure jokes, politics, or slang.
`);
  }
  return clean(`
- **CULTURAL NOTES (${t}):**
  - Adapt idioms and examples to ${t}-speaking regions.
  - Keep references universal and classroom-safe.
`);
};

/* ============================================================================
   Pedagogy / Overlap / Pacing / Tone / Arc / Hooks / Realism
============================================================================ */

const getTeachingTechniqueInstructions = (technique: TeachingTechnique): string => {
  const s = enumVal(technique);
  if (/narrative/i.test(s)) return clean(`- **PEDAGOGY:** Narrative-Based Learning.`);
  if (/guided|socratic/i.test(s)) return clean(`- **PEDAGOGY:** Guided Discovery (Socratic).`);
  if (/pqa/i.test(s)) return clean(`- **PEDAGOGY:** Personalized Q&A (PQA).`);
  if (/direct/i.test(s)) return clean(`- **PEDAGOGY:** Direct Instruction.`);
  return clean(`- **PEDAGOGY:** Communicative Language Teaching (CLT).`);
};

type OverlayIntensityString = "Low" | "Medium" | "High";
const normalizeOverlayIntensity = (
  v: OverlayIntensity | OverlayIntensityString
): OverlayIntensityString => {
  const s = enumVal(v);
  if (/high/i.test(s)) return "High";
  if (/med/i.test(s)) return "Medium";
  return "Low";
};

const getOverlapStyle = (intensity: OverlayIntensity | OverlayIntensityString): string => {
  const I = normalizeOverlayIntensity(intensity);
  const every = I === "High" ? "3–4" : I === "Medium" ? "5–7" : "7–10";
  return clean(`
**OVERLAP ENGINE (do-not-fail rule):**
- Rotate two styles:
  1) Micro backchannels (1–3 words: "yep", "oh wow", "right", "gotcha").
  2) Quick cut-ins (≤7 words) that briefly interject and then yield.
- Pace by intensity (${I}): every ${every} turns insert one overlap.
- Never block comprehension; if a teaching line is critical, delay overlap to next line.
- Mark SFX only in [brackets]; overlaps are plain lines with very short content.
`);
};

const wpmFromPacing = (pacing: PodcastPacing): number => {
  const s = enumVal(pacing);
  if (/very\s*slow/i.test(s)) return 105;
  if (/natural/i.test(s)) return 145;
  return 125;
};

const getPacingInstructions = (pacing: PodcastPacing): string => {
  const s = enumVal(pacing);
  if (/very\s*slow/i.test(s))
    return "The script must be written for a VERY, VERY slow and deliberate delivery. Use extremely short, simple sentences.";
  if (/natural/i.test(s))
    return "The script should be written for a natural conversational pace. Keep clarity high for learners.";
  return "The script must be written for a slow and deliberate delivery. Use short, simple sentences.";
};

const getDurationInstructions = (duration: PodcastDuration, pacing: PodcastPacing): string => {
  const wpm = wpmFromPacing(pacing);
  const wordCount = Math.round((Number(duration) || 0) * wpm);
  return clean(`- **TARGET DURATION:** ~**${wordCount} words** → **${duration} min** at **${enumVal(pacing)}** delivery.`);
};

const getInformalityInstructions = (
  informality: PodcastInformality,
  host1: string,
  host2?: string
): string => {
  const note = host2
    ? `**Note:** Any gender (${host1}, ${host2}); keep language inclusive.`
    : `**Note:** Any gender (${host1}); keep language inclusive.`;
  const s = enumVal(informality);
  if (/very\s*informal/i.test(s)) {
    return clean(`
- **TONE:** ${note} Hyper-informal, warm, conversational; no lecture vibe.
- **SPOKENNESS:** Natural fillers ("so", "well"), light "um/uh"; always contractions.
`);
  }
  if (/informal/i.test(s)) {
    return clean(`
- **TONE:** ${note} Friendly & informal; avoid stiffness.
- **SPOKENNESS:** A few fillers; simple, universal slang; consistent contractions.
`);
  }
  return clean(`
- **TONE:** ${note} Clear, direct, encouraging; minimal fillers; contractions ok; no slang.
`);
};

const getEmotionalArcInstructions = (arc: EmotionalArc): string => {
  const s = enumVal(arc);
  if (/inspir/i.test(s)) return "**EMOTIONAL ARC:** Inspirational & Uplifting.";
  if (/comedic|humor/i.test(s)) return "**EMOTIONAL ARC:** Comedic & Lighthearted.";
  if (/suspens/i.test(s)) return "**EMOTIONAL ARC:** Suspenseful & Intriguing.";
  return "**EMOTIONAL ARC:** Calm & Educational.";
};

const getHookInstructions = (hook: HookStyle, host1: string, host2?: string): string => {
  const s = enumVal(hook);
  if (/question/i.test(s))
    return `**HOOK:** Provocative question. Example: "**${host1}:** ${host2 ? `${host2}, ` : ""}have you ever wondered why we say 'break a leg'?"`;
  if (/bold/i.test(s))
    return `**HOOK:** Bold surprise. Example: "**${host1}:** ${host2 ? `${host2}, ` : ""}almost everyone uses 'literally' wrong."`;
  if (/story/i.test(s))
    return `**HOOK:** Mid-story entry. Example: "**${host1}:** …so there I was in Paris, totally blank on how to order coffee."`;
  return `**HOOK:** Standard intro. "**${host1}:** Hello everyone…${host2 ? ` **${host2}:** Today we’ve got…` : ""}"`;
};

const getAuthenticDialogueStyle = (): string =>
  clean(`- **MASTER RULE:** Sound like real people. Natural alternatives; no robotic phrasing; CEFR-aligned complexity.`);

/* ============================================================================
   Personas / Relationship
============================================================================ */

export const fusePersonas = (personas: string[]): string => {
  const uniq = [...new Set((personas || []).map((p) => clean(p)).filter(Boolean))];
  const names = uniq.map((p) => firstToken(p)).join(" & ");
  const rows = uniq.map((p) => `- ${p}`).join("\n");
  return `Fusion Persona of ${names}:\n${rows}`;
};

export const generateHostLabels = (hostPersonas: string[]): Record<string, string> => {
  const m: Record<string, string> = {};
  (hostPersonas || []).forEach((p) => {
    const name = firstToken(p);
    if (name) m[name] = name;
  });
  return m;
};

const getInternalStateInstructions = (host1Persona: string, host2Persona: string): string =>
  clean(`
- **CHARACTER ENGINE:**
  - Host 1 internal world: ${host1Persona}
  - Host 2 internal world: ${host2Persona}
  - Let subtext shape word choice, pacing, hesitations.
`);

const getRelationshipDynamicsInstructions = (relationship: string): string =>
  clean(relationship)
    ? clean(`- **RELATIONSHIP DYNAMICS:** "${relationship}" colors every exchange.`)
    : "";

/* ============================================================================
   Channel Identity • SEO
============================================================================ */

const getChannelIdentityInstructions = (
  channelDescription: string,
  targetAudience: string,
  defaultTags: string[],
  seoKeywords: string[]
): string =>
  clean(`
- **CHANNEL IDENTITY & SEO (NON-NEGOTIABLE):**
  - Description: ${channelDescription}
  - Audience: ${targetAudience}
  - Default Tags: ${defaultTags.join(", ")}
  - Primary SEO Keywords: ${seoKeywords.join(", ")}
  - **TASK:** Weave primary keywords naturally into titles and text.
`);

/* ============================================================================
   Podcast Style & Format
============================================================================ */

const getPodcastStyleInstructions = (
  podcastStyle: PodcastStyle,
  supplementalContent: string,
  podcastMode: PodcastMode,
  host1: string,
  host2?: string
): string => {
  const hasSupplemental = clean(supplementalContent).length > 0;
  const s = enumVal(podcastStyle);
  const isMonologue = /monologue/i.test(enumVal(podcastMode));

  if (/commentary/i.test(s) && hasSupplemental) {
    return clean(`
- **"AI RADIO PLAY DIRECTOR" (Commentary):**
  1) ${host1}${host2 ? ` & ${host2}` : ""} introduce & analyze scenes.
  2) During scenes: use only original character names from user text.
  3) **Forbidden:** "${host1} (as …)" inside scenes.
  4) After each scene: return to host commentary.
`);
  }

  if (isMonologue) {
    return clean(`
- **IMMERSIVE NARRATION (Live action, not a summary):**
  1) The host (${host1}) narrates directly to the audience.
  2) Prefer present tense where appropriate.
  3) Embody persona throughout.
`);
  }

  return clean(`
- **IMMERSIVE ROLE-PLAY (Live action, not narration):**
  1) Hosts (${host1}${host2 ? `, ${host2}` : ""}) act all roles; labels = host names only.
  2) **Forbidden:** "(as …)" parentheticals.
  3) Present tense; short set-up allowed.
`);
};

const getPodcastFormatInstructions = (
  mode: PodcastMode,
  style: MonologueStyle,
  host1Persona: string,
  host2Persona: string,
  hostRelationship: string,
  informality: PodcastInformality,
  backstory: string
): string => {
  const m = enumVal(mode);
  if (/dialogue/i.test(m)) {
    const host1 = firstToken(host1Persona, "Luna");
    const host2 = firstToken(host2Persona, "Liam");
    const backstoryBlock = clean(backstory)
      ? `- **SHARED UNIVERSE:** Light callbacks & inside jokes.\n${fence("text", backstory)}\n`
      : "";
    return clean(`
${getInformalityInstructions(informality, host1, host2)}
${getInternalStateInstructions(host1Persona, host2Persona)}
${getRelationshipDynamicsInstructions(hostRelationship)}
${backstoryBlock}
`);
  }

  const host = firstToken(host1Persona, "Host");
  const s = enumVal(style);
  let styleGuide = "";
  if (/learning\s*coach/i.test(s)) styleGuide = `**STYLE:** Empathetic Mentor.`;
  else if (/investigative|journal/i.test(s)) styleGuide = `**STYLE:** Investigative Journalist.`;
  else if (/fireside/i.test(s)) styleGuide = `**STYLE:** Fireside Chat.`;
  else if (/motiv/i.test(s)) styleGuide = `**STYLE:** Motivational Keynote.`;
  else if (/news/i.test(s)) styleGuide = `**STYLE:** News Anchor.`;
  else if (/character/i.test(s)) styleGuide = `**STYLE:** Method Actor.`;
  else if (/poetry|slam/i.test(s)) styleGuide = `**STYLE:** Spoken-Word.`;

  return clean(`
**MASTER PERSONA:** TTS-ready human realism; varied sentence length; pauses; tiny self-corrections; rhetorical questions.

**ASSIGNMENT:**
- Host Persona: ${host1Persona}
- Style: ${style}

${styleGuide}
${getInformalityInstructions(informality, host)}

**FINAL OUTPUT RULES:**
1) Single speaker: **${host}** only.
2) No "**${host}:**" prefixes.
3) Maximum realism & artistry.
`);
};

/* ============================================================================
   Response Contracts & Schemas & Determinism
============================================================================ */

const RESPONSE_CONTRACT = clean(`
**RESPONSE CONTRACT (NON-NEGOTIABLE):**
- Follow the EXACT section order and headings provided.
- Output only requested formats (Markdown or JSON) with no extra commentary.
- Do not invent new sections or fields. Do not rename keys.
- Keep technical content in English.
- If information is missing, use minimal, safe defaults without placeholders.
`);

const SCHEMA_GLOSSARY = fence("json", prettyJSON({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  required: ["glossary"],
  properties: {
    glossary: {
      type: "array",
      minItems: 5,
      maxItems: 10,
      items: {
        type: "object",
        required: ["term", "definition"],
        properties: {
          term: { type: "string", minLength: 1 },
          definition: { type: "string", minLength: 3 }
        },
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
}));

const SCHEMA_ILLUSTRATIONS = fence("json", prettyJSON({
  prompts: [
    { id: "slug-1", prompt: "descriptive prompt" }
  ]
}));

const SCHEMA_UPLOAD = fence("json", prettyJSON({
  title: "string",
  description: "string",
  tags: ["string"],
  filenames: {
    video: "string",
    thumbnail: "string"
  },
  chapters: [
    { at: "00:00", title: "string" }
  ]
}));

const SCHEMA_TTS = fence("json", prettyJSON({
  tts_pack: {
    mode: "mono|dialogue|multihost",
    speakers: [
      { name: "string", gender: "any", accent: "US|UK|AU|..." }
    ],
    cadence: "very_slow|slow|natural",
    sfx_policy: "subtle",
    notes: "string"
  }
}));

const djb2 = (str: string): number => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return h >>> 0;
};
const shortHash = (s: string): string => Math.abs(djb2(s)).toString(36).slice(0, 6);
const addMetaHeader = (builder: string, content: string, seed?: number): string => {
  const hash = shortHash(content);
  const meta = `<!-- meta: {"builder":"${builder}","version":"2025.10.04","seed":${seed ?? 1337},"hash":"${hash}"} -->`;
  return `${meta}\n${content}`;
};
const appendIntegrityGuard = (content: string, extra?: string): string =>
  `${content}\n\n<!-- 🔒 INTEGRITY GUARD: Follow RESPONSE CONTRACT strictly. ${extra ?? ""} -->`;

/* ============================================================================
   Realism Engine v2 (hoisted as function for safe use)
============================================================================ */

function getRealismEngineV2Instructions(intensity: number): string {
  const I = clamp(intensity || 0, 0, 100);
  if (I === 0) return "**REALISM ENGINE:** Off. Clean articulation; no stumbles or SFX.";
  const rows: string[] = [`- **ADVANCED COGNITIVE SIMULATION v2 — INTENSITY: ${I}/100**`];
  if (I > 20) rows.push("- Vary energy; subtle cues like `[genuinely surprised]`.");
  if (I > 40) rows.push("- Fragments, self-interruptions, tiny corrections; think aloud.");
  if (I > 60) rows.push("- 1–2 believable mistakes + self-correction; light `[sighs]`, `[laughs quietly]`.");
  if (I > 80) rows.push("- One environmental intrusion allowed `[SFX: phone buzz]` + natural reaction.");
  return clean(rows.join("\n"));
}

/* ============================================================================
   Public Builders — options
============================================================================ */

export type BudgetOpts = {
  tokenBudget?: number;
  hardEnforce?: boolean;
  debug?: boolean;
  presetId?: keyof typeof PRESETS;
  autoHook?: boolean;
  debugMeta?: boolean;
  seed?: number;
};

export type PresetId =
  | "monologue.learningCoach.a1_a2"
  | "monologue.fireside.a2_b1"
  | "monologue.investigative.b1_b2"
  | "dialogue.teacherLearner.a1_b1"
  | "dialogue.rolePlayClinic.a2_b2"
  | "dialogue.debateLite.b1_b2"
  | "multihost.roundtable.b1_b2"
  | "multihost.gameShow.a2_b2";

export type Preset = {
  id: PresetId;
  label: string;
  mode: "monologue" | "dialogue" | "multihost";
  recommendedLevels: LanguageLevel[];
  pacing: PodcastPacing;
  informality: PodcastInformality;
  defaultArc: EmotionalArc;
  defaultHook: Exclude<HookStyle, "None">;
  overlap: OverlayIntensity;
  technique: TeachingTechnique;
  styleNote: string;
};

export const PRESETS: Record<PresetId, Preset> = {
  "dialogue.teacherLearner.a1_b1": {
    id: "dialogue.teacherLearner.a1_b1",
    label: "Teacher & Learner (A1-B1)",
    mode: "dialogue",
    recommendedLevels: [LanguageLevel.A1, LanguageLevel.A2, LanguageLevel.B1],
    pacing: "Slow",
    informality: "Very Informal",
    defaultArc: "Educational",
    defaultHook: "Question",
    overlap: "Medium",
    technique: TeachingTechnique.PQA,
    styleNote: "Real learner questions + micro-corrections; safe, engaging for beginners.",
  },
  "dialogue.rolePlayClinic.a2_b2": {
    id: "dialogue.rolePlayClinic.a2_b2",
    label: "Role-Play Clinic (A2-B2)",
    mode: "dialogue",
    recommendedLevels: [LanguageLevel.A2, LanguageLevel.B1, LanguageLevel.B2],
    pacing: "Slow",
    informality: "Informal",
    defaultArc: "Educational",
    defaultHook: "Story",
    overlap: "Medium",
    technique: TeachingTechnique.Communicative,
    styleNote: "Live role-play in daily contexts; immediate practicality.",
  },
  "dialogue.debateLite.b1_b2": {
    id: "dialogue.debateLite.b1_b2",
    label: "Debate Lite (B1-B2)",
    mode: "dialogue",
    recommendedLevels: [LanguageLevel.B1, LanguageLevel.B2],
    pacing: "Natural",
    informality: "Informal",
    defaultArc: "Comedic",
    defaultHook: "Bold Statement",
    overlap: "Medium",
    technique: TeachingTechnique.GuidedDiscovery,
    styleNote: "Friendly contrast of viewpoints; sparks comments and memory.",
  },
  "monologue.learningCoach.a1_a2": {
    id: "monologue.learningCoach.a1_a2",
    label: "Learning Coach (A1-A2)",
    mode: "monologue",
    recommendedLevels: [LanguageLevel.A1, LanguageLevel.A2],
    pacing: "Very Slow",
    informality: "Very Informal",
    defaultArc: "Educational",
    defaultHook: "Question",
    overlap: "Low",
    technique: TeachingTechnique.DirectInstruction,
    styleNote: "Empathetic coach with guided pauses and ultra-clear articulation.",
  },
  "monologue.fireside.a2_b1": {
    id: "monologue.fireside.a2_b1",
    label: "Fireside Chat (A2-B1)",
    mode: "monologue",
    recommendedLevels: [LanguageLevel.A2, LanguageLevel.B1],
    pacing: "Slow",
    informality: "Informal",
    defaultArc: "Educational",
    defaultHook: "Story",
    overlap: "Low",
    technique: TeachingTechnique.NarrativeBased,
    styleNote: "Warm, story-first narration with embedded teaching moments.",
  },
  "monologue.investigative.b1_b2": {
    id: "monologue.investigative.b1_b2",
    label: "Investigative Report (B1+)",
    mode: "monologue",
    recommendedLevels: [LanguageLevel.B1, LanguageLevel.B2],
    pacing: "Natural",
    informality: "Slightly Formal",
    defaultArc: "Inspirational",
    defaultHook: "Bold Statement",
    overlap: "Low",
    technique: TeachingTechnique.GuidedDiscovery,
    styleNote: "Question → evidence → reveal; cognitive engagement for higher retention.",
  },
  "multihost.roundtable.b1_b2": {
    id: "multihost.roundtable.b1_b2",
    label: "Roundtable (B1-B2)",
    mode: "multihost",
    recommendedLevels: [LanguageLevel.B1, LanguageLevel.B2],
    pacing: "Natural",
    informality: "Informal",
    defaultArc: "Educational",
    defaultHook: "Story",
    overlap: "Low",
    technique: TeachingTechnique.Communicative,
    styleNote: "3–4 voices, short turns, moderator keeps clarity and pace.",
  },
  "multihost.gameShow.a2_b2": {
    id: "multihost.gameShow.a2_b2",
    label: "Game Show (A2-B2)",
    mode: "multihost",
    recommendedLevels: [LanguageLevel.A2, LanguageLevel.B1, LanguageLevel.B2],
    pacing: "Slow",
    informality: "Informal",
    defaultArc: "Comedic",
    defaultHook: "Question",
    overlap: "Low",
    technique: TeachingTechnique.PQA,
    styleNote: "Quiz-like rounds; interactive energy; highly clippable.",
  },
};

const DEFAULT_PRESET_BY_LEVEL: Record<LanguageLevel, PresetId> = {
  [LanguageLevel.A1]: "dialogue.teacherLearner.a1_b1",
  [LanguageLevel.A2]: "dialogue.rolePlayClinic.a2_b2",
  [LanguageLevel.B1]: "dialogue.rolePlayClinic.a2_b2",
  [LanguageLevel.B2]: "dialogue.debateLite.b1_b2",
  [LanguageLevel.C1]: "monologue.investigative.b1_b2",
  [LanguageLevel.C2]: "monologue.investigative.b1_b2",
};

const resolvePreset = (presetId: PresetId | undefined, level: LanguageLevel): Preset => {
  if (presetId) {
    const p = PRESETS[presetId];
    if (p) return p;
  }
  return PRESETS[DEFAULT_PRESET_BY_LEVEL[level]];
};

const autoHookByLevel = (level: LanguageLevel, topic: string): Exclude<HookStyle, "None"> => {
  const t = topic.toLowerCase();
  if (level === LanguageLevel.A1 || level === LanguageLevel.A2) return "Question";
  if (/story|trip|travel|mistake|job|airport|interview/.test(t)) return "Story";
  return "Bold Statement";
};

/* ============================================================================
   Lesson Plan + SEO
============================================================================ */

export const createLessonPlanPrompt = (
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
  teachingTechnique: TeachingTechnique,
  opts: BudgetOpts = {}
): string => {
  const levelConstraints = getLevelConstraints(level);
  const channelIdentity = getChannelIdentityInstructions(
    channelDescription,
    targetAudience,
    defaultTags,
    seoKeywords
  );
  const localization = getLocalizationInstructions(accent, targetLanguage);
  const culturalNotes = getCulturalAdaptationNotes(accent, targetLanguage);
  const teachingInstructions = getTeachingTechniqueInstructions(teachingTechnique);

  const playlistStrategy = `
- **PLAYLIST STRATEGY:** Align the content with an existing themed playlist where possible (Shadowing, Everyday Conversations, Work & Travel, etc.)
`;

  const adaptive =
    isAdaptiveLearning && Object.keys(performanceData).length > 0
      ? clean(`- **ADAPTIVE LEARNING (RECENT MISTAKES):**\n${fence("json", prettyJSON(performanceData))}`)
      : "";

  const dna = learnerDNA
    ? clean(`- **LEARNER DNA (STRATEGIC):**\n${fence("json", prettyJSON(learnerDNA))}`)
    : "";

  const supplemental = clean(supplementalContent)
    ? clean(`- **DECONSTRUCT PROVIDED TEXT:**\n${fence("text", supplementalContent)}`)
    : "";

  const interests =
    (learnerInterests?.length ?? 0) > 0
      ? clean(`- **LEARNER INTERESTS:** **${learnerInterests.join(", ")}** flavor story & tasks.`)
      : "";

  const preset = resolvePreset(opts.presetId as PresetId | undefined, level);
  const presetSummary = clean(`
- **STYLE PRESET:** ${preset.id}
  - Mode: ${preset.mode}, Pacing: ${preset.pacing}, Informality: ${preset.informality}
  - Hook: ${preset.defaultHook}, Arc: ${preset.defaultArc}, Overlap: ${preset.overlap}
  - Pedagogy: ${preset.technique}
  - Note: ${preset.styleNote}
`);

  const seed = opts.seed ?? 1337;

  let core = clean(`
**LANGUAGE POLICY:** All technical instructions and outputs in English.
${RESPONSE_CONTRACT}
**ROLE:** You are the "2025 YouTube SEO & Growth Council" (10 experts). Produce the definitive, upload-ready lesson plan and SEO package.

**INPUTS:**
- Language Level: ${level}
- Lesson Topic/Interest Area: ${clean(supplementalContent) ? "(Derived from provided content)" : `"${topic}"`}
- Title format hint: [TOPIC] — Learn Real English (Slow Practice)
${presetSummary}
${channelIdentity}
${playlistStrategy}
${localization}
${culturalNotes}
${levelConstraints}
${teachingInstructions}
${interests}
${dna}
${supplemental}
${adaptive}

---
**OUTPUT STRUCTURE (follow exactly):**

# The 2025 YouTube SEO & Growth Council's Upload Blueprint

**COUNCIL'S DIRECTIVE:** Each section authored by a designated specialist, with an "Impact Score (0–100)".

---

### 1. The Title Psychologist's Report: Viral Titles
- **Curiosity-Driven**
- **Keyword-Focused**
- **Community-Focused**
**Recommendation:** Launch with Curiosity-Driven for CTR.

---

### 2. The Description Strategist's Blueprint
**Ready-to-Paste Description:**
${fence(
  "text",
  `Learn [Topic] — Improve your English speaking, listening, and vocabulary through slow English and shadowing practice.
In this video, Luna and Liam teach you how to use real English, daily English, and English for life in real-life conversations.
Practice along and master pronunciation, fluency, and confidence step by step.
Learn English for beginners, English conversation for daily use, English shadowing lesson, slow English podcast, English pronunciation tips, English listening exercise, real life English conversation, English speaking practice at home.
Welcome to Real Smart English — the channel where English becomes simple, real, and smart.
We upload daily lessons, podcasts, and speaking practice videos to help you speak English confidently, naturally, and fluently in real life.
Learn smarter. Speak real. Live in English.
✅ Slow English lessons for A1–B2 learners
✅ Shadowing practice for pronunciation & confidence
✅ Real conversations for travel, work, and social life

TIMESTAMPS / CHAPTERS:
00:00 - [Descriptive Chapter 1]
01:45 - [Descriptive Chapter 2]
04:30 - [Descriptive Chapter 3]
07:15 - [Descriptive Chapter 4]
10:00 - [Descriptive Chapter 5]`
)}

---

### 3. Tagging Specialist's Matrix
Single comma-separated list combining Tier 1/2/3 keywords (include default tags).

---

### 4. Viral Thumbnail Designer's Vision
- Concept: expressive face + bold 3–5 word text.
- Palette: high-contrast primaries.
- On-Thumb Text: short, punchy, mobile-legible.

---

### 5. Technical SEO Specialist's Filenames
- Video: \`[primary-keyword]-[channel-name].mp4\`
- Thumb: \`[primary-keyword]-youtube-thumbnail.jpg\`

---

### 6. Audience Simulation Board's Report
- A1/A2: risk(s) + fix.
- B1/B2: engagement risk(s) + fix.

---

# Lesson Outline
- Booklet Title Suggestion: [Keyword-rich]
- Overall Theme: [Short creative summary; weave interests]
- Story Concept: [Begin → Middle (surprise) → Resolved End; humor; no romance]
- Key Vocabulary & Grammar: [5–7 terms; 1–2 grammar points]
- Podcast Angle: [How hosts will deconstruct topic]
`);

  core = appendIntegrityGuard(core, "Do not hallucinate sections; keep exact order; obey schemas.");
  core = addMetaHeader("createLessonPlanPrompt", core, seed);

  if (!opts.tokenBudget || !opts.hardEnforce) {
    return sanitize(core);
  }
  const enforced = enforceTokenBudget([{ id: "CORE", content: core }], opts.tokenBudget, true);
  const debug = opts.debug
    ? `\n\n<!-- _meta: ${prettyJSON({ dropped: enforced.dropped, truncated: enforced.truncated })} -->`
    : "";
  const out = sanitize(enforced.content + debug);
  if (opts.debugMeta) {
    return prettyJSON({
      debug: {
        builder: "createLessonPlanPrompt",
        dropped: enforced.dropped,
        truncated: enforced.truncated
      },
      prompt: out
    });
  }
  return out;
};

/* ============================================================================
   Booklet + Podcast Script
============================================================================ */

/** Flexible input for core SRT block to align with CoreAudioSrt */
type CoreSrtInput = {
  /** If absent, use id */
  filename?: string;
  /** If filename missing, fallback to id + ".srt" */
  id?: string;
  content: string;
  anchor?: "mid" | "intro" | "outro";
};

export const createBookletPrompt = (
  level: LanguageLevel,
  topic: string,
  host1Persona: string,
  host2Persona: string,
  hostRelationship: string,
  channelName: string,
  podcastMode: PodcastMode,
  monologueStyle: MonologueStyle,
  podcastPacing: PodcastPacing,
  podcastInformality: PodcastInformality,
  podcastStyle: PodcastStyle,
  overlayIntensity: OverlayIntensity,
  podcastDuration: PodcastDuration,
  previousContent: PreviousContentItem[],
  supplementalContent: string,
  lessonPlan: string,
  learnerInterests: string[],
  generateShowNotes: boolean,
  generateSocialMediaTeaser: boolean,
  podcastBackstory: string,
  realismIntensity: number,
  isEcosystemEngineEnabled: boolean,
  emotionalArc: EmotionalArc,
  hookStyle: HookStyle,
  teachingTechnique: TeachingTechnique,
  channelDescription: string,
  targetAudience: string,
  defaultTags: string[],
  seoKeywords: string[],
  accent: Accent,
  targetLanguage: TargetLanguage,
  coreAudioSrt?: CoreSrtInput,
  opts: BudgetOpts = {}
): string => {
  const host1 = firstToken(host1Persona, "Luna");
  const host2 = firstToken(host2Persona, "Liam");
  const isMonologue = /monologue/i.test(enumVal(podcastMode));

  const preset = resolvePreset(opts.presetId as PresetId | undefined, level);
  const effectivePacing = podcastPacing || preset.pacing;
  const effectiveInformality = podcastInformality || preset.informality;
  const effectiveTechnique = teachingTechnique || preset.technique;
  const effectiveOverlap = overlayIntensity || preset.overlap;
  const effectiveArc = emotionalArc || preset.defaultArc;

  const finalHook: HookStyle =
    opts.autoHook && /none/i.test(enumVal(hookStyle))
      ? (autoHookByLevel(level, topic) as HookStyle)
      : hookStyle;

  const levelConstraints = getLevelConstraints(level);
  const authenticDialogueStyle = getAuthenticDialogueStyle();
  const channelIdentity = getChannelIdentityInstructions(
    channelDescription,
    targetAudience,
    defaultTags,
    seoKeywords
  );
  const realismEngineV2 = getRealismEngineV2Instructions(realismIntensity);
  const localization = getLocalizationInstructions(accent, targetLanguage);
  const culturalNotes = getCulturalAdaptationNotes(accent, targetLanguage);
  const podcastFormatInstructions = getPodcastFormatInstructions(
    podcastMode,
    monologueStyle,
    host1Persona,
    host2Persona,
    hostRelationship,
    effectiveInformality,
    podcastBackstory
  );
  const podcastStyleInstructions = getPodcastStyleInstructions(
    podcastStyle,
    supplementalContent,
    podcastMode,
    host1,
    !isMonologue ? host2 : undefined
  );
  const teachingInstructions = getTeachingTechniqueInstructions(effectiveTechnique);

  const previousContentInstructions =
    (previousContent?.length ?? 0) > 0 && !isMonologue
      ? clean(`- **REFERENCE PAST CONTENT:**\n${fence("json", prettyJSON(previousContent.map(({ id, ...rest }) => rest)))}`)
      : "";

  const supplementalBlock = clean(supplementalContent)
    ? clean(`- **SOURCE MATERIAL:**\n${fence("text", supplementalContent)}`)
    : "";

  const interests =
    (learnerInterests?.length ?? 0) > 0
      ? clean(`- **HYPER-PERSONALIZATION:** **${learnerInterests.join(", ")}** flavors story & tasks.`)
      : "";

  const hasCore = !!coreAudioSrt?.content;
  const srtName = hasCore
    ? (coreAudioSrt!.filename || (coreAudioSrt!.id ? `${coreAudioSrt!.id}.srt` : "core-audio.srt"))
    : "";
  const srtAnchor = coreAudioSrt?.anchor ?? "mid";

  const coreSrtBlock = hasCore
    ? `
**CORE AUDIO (DO-NOT-EDIT):**
- Anchor: ${srtAnchor}
- Filename: ${srtName}
- SRT (verbatim):
${fence('srt', coreAudioSrt!.content)}

**CORE RULES (NON-NEGOTIABLE):**
- Treat this SRT as a fixed, pre-recorded segment.
- Do NOT rewrite or paraphrase its lines.
- Insert EXACTLY this marker line in the podcast script:
  [CORE_AUDIO: ${srtName}]
- Structure around the anchor:
  - If anchor=mid → Intro → [CORE_AUDIO] → Post
  - If anchor=intro → [CORE_AUDIO] → Post (no intro monologue)
  - If anchor=outro → Intro → Body → [CORE_AUDIO] (ends here)
- Build smooth bridges before/after the marker (coach/host lines).
`.trim()
    : "";

  const showNotes = generateShowNotes
    ? clean(`
<SECTION:SHOW_NOTES>
# 📝 Podcast Show Notes
- Episode Title: [Use 'Booklet Title Suggestion']
- Summary: [2–3 sentences]
- Key Vocabulary (table)
- Further Learning
- Connect (CTA)
`)
    : "";

  const teaser = generateSocialMediaTeaser
    ? clean(`
<SECTION:SOCIAL_MEDIA_TEASER>
# 🎬 Social Teaser (15–30s)
- Format: \`**${host1}:** [Line]\`${!isMonologue ? `\n- **${host2}:** [Line]` : ""}
- Hook → Hint → CTA
- On-screen text: [2–3 ideas]
`)
    : "";

  const mustSections: BookletSection[] = [...SECTION_ORDER_BOOKLET];
  if (generateShowNotes) mustSections.push("SHOW_NOTES");
  if (generateSocialMediaTeaser) mustSections.push("SOCIAL_MEDIA_TEASER");

  const listeningSectionPrompt = isMonologue
    ? `
<SECTION:LISTENING_SECTION>
## 2️⃣ Listening
- Story: A compelling story told by the single host. The story should fit the host's persona and monologue style. It must NOT be a dialogue between two other characters.
- Exercises JSON:
${fence(
  "json:exercises",
  `{"title":"Listening Comprehension","exercises":[{"type":"multiple-choice","question":"[Q about the story]","options":["[A]","[B]","[C]"],"answer":"[A]"}]}`
)}`
    : `
<SECTION:LISTENING_SECTION>
## 2️⃣ Listening
- Dialogue: obey MASTER RULE for natural speech.
- Exercises JSON:
${fence(
  "json:exercises",
  `{"title":"Listening Comprehension","exercises":[{"type":"multiple-choice","question":"[Q about dialogue]","options":["[A]","[B]","[C]"],"answer":"[A]"}]}`
)}`;

  const podcastHostLine = isMonologue ? `- Host: ${host1}` : `- Hosts: ${host1} and ${host2}`;
  const seed = opts.seed ?? 1337;

  let body = clean(`
**LANGUAGE POLICY:** All technical instructions and outputs in English.
${RESPONSE_CONTRACT}
**GRAND ROLE:** Council of Experts (ESL Educator, Comedy Writer, Learning Psychologist, Audio Director, Musician, Anthropologist, Storyteller, Podcast Producer).
${getAuthenticDialogueStyle()}

**ULTIMATE DIRECTIVE:** Expand the approved plan into a flawless booklet and synchronized podcast.

**APPROVED LESSON PLAN:**
${fence("markdown", clean(lessonPlan))}

**INPUTS:**
- Level: ${level}
- Topic: ${clean(supplementalContent) ? "(Derived from provided content)" : `"${topic}"`}
- Preset: ${resolvePreset(opts.presetId as PresetId | undefined, level).id}
${getChannelIdentityInstructions(channelDescription, targetAudience, defaultTags, seoKeywords)}
${getLocalizationInstructions(accent, targetLanguage)}
${getCulturalAdaptationNotes(accent, targetLanguage)}
${levelConstraints}
${interests}
${getPodcastStyleInstructions(podcastStyle, supplementalContent, podcastMode, host1, !isMonologue ? host2 : undefined)}
${supplementalBlock}
${coreSrtBlock}

${!isMonologue ? `---\n${getOverlapStyle(effectiveOverlap)}\n---` : ""}

**CRITICAL OUTPUT FORMAT:** Sections in this exact order: \`${mustSections.join(", ")}\`.

<SECTION:TITLE>
# 🌟 [Use 'Booklet Title Suggestion']

<SECTION:OVERVIEW>
## Lesson Overview
- Level: ${level}
- Objectives: [3–5]
- Motivational Tip: [Short]

<SECTION:READING_SECTION>
## 1️⃣ Reading
- Story: present-tense, implicit teaching, surprise in middle, humor, **no romance**.
- Exercises JSON:
${fence(
  "json:exercises",
  `{"title":"Reading Comprehension","exercises":[{"type":"multiple-choice","question":"[Q]","options":["[A]","[B]","[C]"],"answer":"[A]"},{"type":"fill-in-the-blank","question":"[Sentence with ___]","answer":"[Word]"}]}`
)}

${listeningSectionPrompt}

<SECTION:SPEAKING_SECTION>
## 3️⃣ Speaking
- Role-Play: [Scenario]
- Podcast Prompt: ["Pause and say…"]
- Gamified Challenge: [Points]

<SECTION:WRITING_SECTION>
## 4️⃣ Writing
- Task: [Creative prompt]
- Vocabulary Hints: [Helpful words]
- Errorful Learning: Include ONE common mistake for this level (e.g., wrong preposition) and then subtly correct it in the next paragraph's explanation.

<SECTION:QUIZ_SECTION>
## 5️⃣ Mini Quiz
${fence(
  "json:quiz",
  prettyJSON({
    title: "Final Check-in Quiz",
    questions: [
      { type: "multiple-choice", question: "[Q]", options: ["[A]","[B]","[C]"], answer: "[A]" },
      { type: "true-false", question: "[Statement]", answer: true },
      { type: "fill-in-the-blank", question: "[Sentence with ___]", answer: "[Word]" }
    ]
  })
)}

<SECTION:SUMMARY_SECTION>
## 6️⃣ Summary & Review
- Key Points: [Bullets]
- Cultural Tip: [Short, safe cultural note related to the topic.]
- Final Encouragement: [Motivational close]

<SECTION:DESIGN_SUGGESTIONS>
## 7️⃣ Visuals
- Fonts: Sans-serif body; bold for key vocab
- Colors: High contrast, accessible
- Icons: Simple, clear
- Layout: Tables, flashcards
- Illustrations: Story moments
- Gamification: Stars/points

---

<SECTION:PODCAST_SCRIPT>
# 🎙️ Synchronized Podcast Script
${podcastHostLine}
- Channel: ${channelName}

**STYLE BIBLE**
${teachingInstructions}
${podcastFormatInstructions}
${getPacingInstructions(effectivePacing)}
${getDurationInstructions(podcastDuration, effectivePacing)}
${getEmotionalArcInstructions(effectiveArc)}
${realismEngineV2}
${isEcosystemEngineEnabled ? "- **ECOSYSTEM:** cross-refs between booklet/podcast." : ""}
${previousContentInstructions}

${getHookInstructions(finalHook, host1, !isMonologue ? host2 : undefined)}

**[Intro Music ~5s]**
**RULE:** Micro-backchannels on their own line.

${
  hasCore
    ? `**RULE:** If CORE AUDIO is provided, include this exact marker line at the correct spot:
[CORE_AUDIO: ${srtName}]

**STRUCTURE WHEN CORE EXISTS:**
- Anchor=${srtAnchor} → follow the anchor rules described above`
    : ""
}

**(Begin script…)**
**(Sync with sections)**
**(Summary & Outro)**
**[Outro Music ~10s]**

${showNotes}
${teaser}

**FINAL:** Output only the Markdown content. No extra commentary.
`);

  body = appendIntegrityGuard(body, "Keep section order exact; respect JSON shapes; no extras.");
  body = addMetaHeader("createBookletPrompt", body, seed);

  if (!opts.tokenBudget || !opts.hardEnforce) return sanitize(body);

  const sections: { id: string; content: string }[] = [{ id: "BODY", content: body }];
  const enforced = enforceTokenBudget(sections, opts.tokenBudget, true);
  const debug = opts.debug
    ? `\n\n<!-- _meta: ${prettyJSON({ dropped: enforced.dropped, truncated: enforced.truncated })} -->`
    : "";
  const out = sanitize(enforced.content + debug);
  if (opts.debugMeta) {
    return prettyJSON({
      debug: {
        builder: "createBookletPrompt",
        dropped: enforced.dropped,
        truncated: enforced.truncated
      },
      prompt: out
    });
  }
  return out;
};

/* ============================================================================
   Multi-Host Podcast
============================================================================ */

export const createMultiHostPodcastPrompt = (
  hostPersonas: string[],
  channelName: string,
  duration: PodcastDuration,
  pacing: PodcastPacing,
  informality: PodcastInformality,
  emotionalArc: EmotionalArc,
  hookStyle: HookStyle,
  realismIntensity: number,
  styleNote: string,
  relationshipNote?: string,
  backstory?: string,
  opts: BudgetOpts = {}
): string => {
  const labels = generateHostLabels(hostPersonas || []);
  const names = Object.keys(labels);
  const leader = names[0] || "Host";
  const fusion = fusePersonas(hostPersonas || []);

  const metaBlock = clean(`
- **Hosts:** ${names.join(", ")}
- **Channel:** ${channelName}
- **Relationship:** ${relationshipNote || "Professional collaborators"}
- **Backstory:** ${backstory ? "See below" : "N/A"}
`);

  const resolvedHook =
    opts.autoHook && /none/i.test(enumVal(hookStyle))
      ? ("Story" as HookStyle)
      : hookStyle;

  let core = clean(`
# 🎙️ Multi-Host Podcast (Role-Play + Teaching)

${metaBlock}

**STYLE & TONE**
- Informality: ${enumVal(informality)}
- Style Note: ${styleNote}
${getEmotionalArcInstructions(emotionalArc)}
${getPacingInstructions(pacing)}
${getDurationInstructions(duration, pacing)}

**REALISM ENGINE**
${getRealismEngineV2Instructions(realismIntensity)}

**FUSION PERSONA**
${fence("text", fusion)}

${relationshipNote ? `**RELATIONSHIP DYNAMICS**\n${relationshipNote}\n` : ""}
${backstory ? `**SHARED BACKSTORY**\n${fence("text", backstory)}\n` : ""}

${getHookInstructions(resolvedHook, leader, names[1])}

**RULES**
1) Natural, CEFR-appropriate speech. No robotic phrasing.
2) Micro-backchannels are short and on their own line.
3) Keep the lesson clear; jokes are fine but don't derail teaching.
4) Mark SFX in [brackets]; keep subtle.

**(Write the script now)**
`);
  core = appendIntegrityGuard(core, "Follow rules strictly; no extra sections; keep realism bounded.");
  core = addMetaHeader("createMultiHostPodcastPrompt", core, opts.seed ?? 1337);

  if (!opts.tokenBudget || !opts.hardEnforce) return sanitize(core);

  const enforced = enforceTokenBudget([{ id: "CORE", content: core }], opts.tokenBudget, true);
  const debug = opts.debug
    ? `\n\n<!-- _meta: ${prettyJSON({ dropped: enforced.dropped, truncated: enforced.truncated })} -->`
    : "";
  const out = sanitize(enforced.content + debug);
  if (opts.debugMeta) {
    return prettyJSON({
      debug: {
        builder: "createMultiHostPodcastPrompt",
        dropped: enforced.dropped,
        truncated: enforced.truncated
      },
      prompt: out
    });
  }
  return out;
};

/* ============================================================================
   Topic / Glossary / Cover / Refine / Illustrations / Learner DNA / Pronunciation / Channel Promo
============================================================================ */

export const createTopicSuggestionPrompt = (
  level: LanguageLevel,
  opts: BudgetOpts = {}
): string => {
  let core = clean(`
You are an expert ESL curriculum designer. Generate 3–5 creative, real-life topics suitable for ${level} learners.
`);
  core = appendIntegrityGuard(core, "Output a simple bullet list only.");
  core = addMetaHeader("createTopicSuggestionPrompt", core, opts.seed ?? 1337);
  if (!opts.tokenBudget || !opts.hardEnforce) return sanitize(core);
  const enforced = enforceTokenBudget([{ id: "CORE", content: core }], opts.tokenBudget, true);
  return enforced.content;
};

export const createGlossaryPrompt = (
  content: string,
  level: LanguageLevel,
  opts: BudgetOpts = {}
): string => {
  let core = clean(`
**ROLE:** Linguistics Professor for English learners.
**TASK:** From the booklet below, pick 5–10 key terms for ${level} learners and define simply.

**BOOKLET CONTENT:**
---
${content}
---

**OUTPUT:** JSON with "glossary": [{ "term": "...", "definition": "..." }].
**SCHEMA (advisory):**
${SCHEMA_GLOSSARY}
`);
  core = appendIntegrityGuard(core, "Output only valid JSON matching schema shape.");
  core = addMetaHeader("createGlossaryPrompt", core, opts.seed ?? 1337);
  if (!opts.tokenBudget || !opts.hardEnforce) return sanitize(core);
  const enforced = enforceTokenBudget([{ id: "CORE", content: core }], opts.tokenBudget, true);
  return enforced.content;
};

export const createCoverImagePrompt = (title: string, topic: string): string =>
  `A vibrant, educational illustration for an English learning booklet. Topic: "${topic}". Title: "${title}". Friendly, colorful, engaging. Minimal text.`;

export const createRefineSelectionPrompt = (
  selection: { text: string; contextBefore: string; contextAfter: string },
  command: string,
  host1Persona: string,
  host2Persona: string,
  fullContext: { [key in Tab]?: string },
  opts: BudgetOpts = {}
): string => {
  let core = clean(`
**ROLE:** Expert Script Doctor for a two-host podcast.

**PERSONAS:**
- Host 1: ${host1Persona}
- Host 2: ${host2Persona}

**CONTEXT BEFORE:**
...
${selection.contextBefore}
**CONTEXT AFTER:**
${selection.contextAfter}
...

**ECOSYSTEM CONTEXT:**
${fence("json", prettyJSON(fullContext))}

**TEXT TO REWRITE:**
${fence("text", selection.text)}

**USER COMMAND:** "${command}"

**RULES:**
1) Rewrite only the selected text.
2) Maintain flow with before/after.
3) Preserve personas.
4) Obey the command.
5) Output ONLY the rewritten text.
`);
  core = appendIntegrityGuard(core, "Do not modify outside selection.");
  core = addMetaHeader("createRefineSelectionPrompt", core, opts.seed ?? 1337);
  if (!opts.tokenBudget || !opts.hardEnforce) return sanitize(core);
  const enforced = enforceTokenBudget([{ id: "CORE", content: core }], opts.tokenBudget, true);
  return enforced.content;
};

export const createIllustrationPromptsPrompt = (
  bookletContent: string,
  opts: BudgetOpts = {}
): string => {
  let core = clean(`
**ROLE:** Educational Art Director.
**TASK:** From the booklet, pick 3–5 visual moments and write clean image prompts.

**TEXT:**
---
${bookletContent}
---

**OUTPUT:** JSON { "prompts": [ { "id": "url-safe-slug", "prompt": "descriptive prompt" } ] }.
**SCHEMA (advisory):**
${SCHEMA_ILLUSTRATIONS}
`);
  core = appendIntegrityGuard(core, "Output only valid JSON with 'prompts' array.");
  core = addMetaHeader("createIllustrationPromptsPrompt", core, opts.seed ?? 1337);
  if (!opts.tokenBudget || !opts.hardEnforce) return sanitize(core);
  const enforced = enforceTokenBudget([{ id: "CORE", content: core }], opts.tokenBudget, true);
  return enforced.content;
};

export const createLearnerDNAPrompt = (
  performanceData: Record<string, number>,
  learnerInterests: string[],
  previousContent: PreviousContentItem[],
  opts: BudgetOpts = {}
): string => {
  let core = clean(`
**ROLE:** Learning Psychologist & Data Scientist.
**TASK:** Synthesize a "Learner DNA" profile.

**DATA:**
- Performance: ${prettyJSON(performanceData)}
- Interests: ${learnerInterests.join(", ")}
- History: ${previousContent.map((c) => c.title).join(", ")}

**OUTPUT:** Structured JSON representing the Learner DNA.
`);
  core = appendIntegrityGuard(core, "Output only valid JSON.");
  core = addMetaHeader("createLearnerDNAPrompt", core, opts.seed ?? 1337);
  if (!opts.tokenBudget || !opts.hardEnforce) return sanitize(core);
  const enforced = enforceTokenBudget([{ id: "CORE", content: core }], opts.tokenBudget, true);
  return enforced.content;
};

export const createPronunciationAnalysisPrompt = (
  originalText: string,
  userTranscript: string,
  opts: BudgetOpts = {}
): string => {
  let core = clean(`
**ROLE:** Hollywood-grade Dialect Coach.
**TASK:** Compare the original line with the user's transcription; give constructive, encouraging feedback.

**Original:** "${originalText}"
**User:** "${userTranscript}"

**OUTPUT:** JSON with fields like { "score": 0–100, "vowel_issues": [], "stress": "...", "intonation": "...", "tips": [] }.
`);
  core = appendIntegrityGuard(core, "Output only valid JSON.");
  core = addMetaHeader("createPronunciationAnalysisPrompt", core, opts.seed ?? 1337);
  if (!opts.tokenBudget || !opts.hardEnforce) return sanitize(core);
  const enforced = enforceTokenBudget([{ id: "CORE", content: core }], opts.tokenBudget, true);
  return enforced.content;
};

export const createChannelTrailerPrompt = (
  channelDescription: string,
  targetAudience: string,
  defaultTags: string[],
  seoKeywords: string[],
  host1Persona: string,
  host2Persona: string,
  opts: BudgetOpts = {}
): string => {
  let core = clean(`
**ROLE:** YouTube Growth Strategist for high-retention channel trailers.

**CHANNEL IDENTITY:**
- Description: ${channelDescription}
- Audience: ${targetAudience}
- Default Tags: ${defaultTags.join(", ")}
- SEO Keywords: ${seoKeywords.join(", ")}
- Hosts: ${host1Persona} | ${host2Persona}

# Channel Trailer: Upload Package
- Script (45–60s): Hook → Value → CTA → Outro (Luna/Liam)
- SEO Title (≤60 chars, front-loaded keyword)
- Description: Hook, value, playlists (unique per guidelines)
- Tags: defaults + trailer-specific
`);
  core = appendIntegrityGuard(core, "Provide only requested items, no extras.");
  core = addMetaHeader("createChannelTrailerPrompt", core, opts.seed ?? 1337);
  if (!opts.tokenBudget || !opts.hardEnforce) return sanitize(core);
  const enforced = enforceTokenBudget([{ id: "CORE", content: core }], opts.tokenBudget, true);
  return enforced.content;
};

export const createFeaturedVideoPrompt = (
  channelDescription: string,
  targetAudience: string,
  defaultTags: string[],
  seoKeywords: string[],
  host1Persona: string,
  host2Persona: string,
  opts: BudgetOpts = {}
): string => {
  let core = clean(`
**ROLE:** Community Strategist (Returning Subscriber Feature).

**CHANNEL IDENTITY:**
- Description: ${channelDescription}
- Audience: ${targetAudience}
- Default Tags: ${defaultTags.join(", ")}
- SEO Keywords: ${seoKeywords.join(", ")}
- Hosts: ${host1Persona} | ${host2Persona}

# Featured Video for Subscribers: Upload Package
- Script (2–3 min): Welcome → Highlights → What's next → Community CTA → Thanks
- SEO Title (≤60 chars)
- Description: Thanks + summary + community question
- Tags: community + brand
`);
  core = appendIntegrityGuard(core, "Provide only requested items, no extras.");
  core = addMetaHeader("createFeaturedVideoPrompt", core, opts.seed ?? 1337);
  if (!opts.tokenBudget || !opts.hardEnforce) return sanitize(core);
  const enforced = enforceTokenBudget([{ id: "CORE", content: core }], opts.tokenBudget, true);
  return enforced.content;
};

/* ============================================================================
   NEW: YouTube Upload Pack & TTS Pack Builders
============================================================================ */

export const createYouTubeUploadPackPrompt = (
  title: string,
  description: string,
  chapters: { at: string; title: string }[],
  defaultTags: string[],
  extraTags: string[],
  primaryKeyword: string,
  channelName: string,
  opts: BudgetOpts = {}
): string => {
  let core = clean(`
**ROLE:** YouTube Upload Operations (2025-compliant).
**TASK:** Produce a single JSON object for the upload pack.

**INPUT:**
- Title: ${title}
- Description: ${description}
- Chapters: ${prettyJSON(chapters)}
- Default Tags: ${defaultTags.join(", ")}
- Extra Tags: ${extraTags.join(", ")}
- Primary Keyword: ${primaryKeyword}
- Channel: ${channelName}

**OUTPUT (JSON):**
- Must include: title, description, tags[], filenames{video,thumbnail}, chapters[].
**SCHEMA (advisory):**
${SCHEMA_UPLOAD}
`);
  core = appendIntegrityGuard(core, "Output valid JSON only. No Markdown.");
  core = addMetaHeader("createYouTubeUploadPackPrompt", core, opts.seed ?? 1337);
  if (!opts.tokenBudget || !opts.hardEnforce) return sanitize(core);
  const enforced = enforceTokenBudget([{ id: "CORE", content: core }], opts.tokenBudget, true);
  return enforced.content;
};

export const createTTSPackPrompt = (
  mode: "mono" | "dialogue" | "multihost",
  speakers: { name: string; gender: string; accent: string }[],
  cadence: "very_slow" | "slow" | "natural",
  sfxPolicy: "subtle" | "none",
  notes: string,
  opts: BudgetOpts = {}
): string => {
  let core = clean(`
**ROLE:** TTS Package Designer (Studio-ready).
**TASK:** Emit a JSON "tts_pack" object summarizing TTS delivery settings.

**INPUT:**
- Mode: ${mode}
- Speakers: ${prettyJSON(speakers)}
- Cadence: ${cadence}
- SFX Policy: ${sfxPolicy}
- Notes: ${notes}

**OUTPUT (JSON):**
${SCHEMA_TTS}
`);
  core = appendIntegrityGuard(core, "Output valid JSON only. No Markdown.");
  core = addMetaHeader("createTTSPackPrompt", core, opts.seed ?? 1337);
  if (!opts.tokenBudget || !opts.hardEnforce) return sanitize(core);
  const enforced = enforceTokenBudget([{ id: "CORE", content: core }], opts.tokenBudget, true);
  return enforced.content;
};
