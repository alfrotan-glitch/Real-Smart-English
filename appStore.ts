// src/store/appStore.ts — cleaned imports (runtime vs type-only clear)

import { create } from "zustand";
import SHA256 from "crypto-js/sha256";

// Runtime values (exist at runtime → must be value-imported)
import {
  LanguageLevel,
  Accent,
  TargetLanguage,
  PodcastStyle,
  PodcastMode,
  MonologueStyle,
  TeachingTechnique,
  generationSections,
} from "../types/index";

// Pure types (erased at runtime → type-only)
import type {
  OverlayIntensity,
  PodcastPacing,
  PodcastInformality,
  PodcastDuration,
  EmotionalArc,
  HookStyle,
  Tab,
  GenerationStep,
  SectionProgress,
  PreviousContentItem,
  SectionKey,
  LearnerDNA,
  Illustration,
  SeoBundle,
  UploadPack,
  RoleConfig,
  CoreAudioSrt,
} from "../types/index";

// LEVELS is runtime data; LevelId is only a type
import { LEVELS, type LevelId } from "../types/levelConfig";

// Services (all runtime values)
import {
  generatePlan,
  generateBookletStream,
  refineScriptSelection,
  generateCoverImage as generateCoverImageService,
  synthesizeLearnerDNA as synthesizeLearnerDNAService,
  generateIllustrations as generateIllustrationsService,
  generateChannelTrailer as generateChannelTrailerService,
  generateFeaturedVideo as generateFeaturedVideoService,
  generateDailyScript as generateDailyScriptService,
  generateSeoBundle,
  buildUploadPackFromSeo,
} from "../services/geminiService";

// Presets (value + type)
import { PRESETS, type PresetId } from "../services/promptService";

// Utilities
import { getApiErrorMessage } from "../utils/errorHandler";

// ---------- Types ----------
type PerformancePoint = { ctr: number; retention: number };
type PerformanceHistory = {
  predicted: PerformancePoint;
  actual: PerformancePoint;
};

export type AppState = {
  currentScreen: "home" | "builder";
  level: LanguageLevel;
  topic: string;
  host1Persona: string;
  host2Persona: string;
  host1Name: string;
  host2Name: string;
  hostRelationship: string;
  channelName: string;

  presetId: PresetId | "custom";
  podcastMode: PodcastMode;
  monologueStyle: MonologueStyle;
  monologueHostName: string;
  podcastPacing: PodcastPacing;
  podcastInformality: PodcastInformality;
  podcastStyle: PodcastStyle;
  overlayIntensity: OverlayIntensity;
  podcastDuration: PodcastDuration;
  emotionalArc: EmotionalArc;
  hookStyle: HookStyle;

  previousContent: PreviousContentItem[];
  isAdaptiveLearning: boolean;
  performanceData: Record<string, number>;
  learnerInterests: string[];
  supplementalContent: string;
  podcastBackstory: string;

  realismIntensity: number;

  isCopilotActive: boolean;
  isEcosystemEngineEnabled: boolean;
  isDailyScriptEngineEnabled: boolean;

  teachingTechnique: TeachingTechnique;

  accent: Accent;
  targetLanguage: TargetLanguage;

  channelDescription: string;
  targetAudience: string;
  defaultTags: string[];
  seoKeywords: string[];

  rawContent: string;
  insightsContent: string;
  bookletPart: string;
  podcastScript: string;
  showNotesContent: string;
  socialMediaTeaserContent: string;
  dailyScript: DailyScript | null;
  dailyScriptMode: DailyScriptMode;

  generateShowNotes: boolean;
  generateSocialMediaTeaser: boolean;
  activeTab: Tab;
  theme: string;
  coverImage: string | null;

  generationStep: GenerationStep;
  error: string | null;
  toastMessage: string | null;
  lessonPlan: string;

  generationProgress: Record<SectionKey, SectionProgress>;
  currentlyGeneratingSection: SectionKey | null;
  learnerDNA: LearnerDNA | null;
  illustrations: Illustration[];
  isGeneratingCover: boolean;
  isGeneratingIllustrations: boolean;

  isPublishingDashboardOpen: boolean;
  performanceHistory: PerformanceHistory;
  aiRecommendations: string[];

  isGrowthToolsModalOpen: boolean;
  isGeneratingGrowthTool: boolean;
  growthToolContent: string | null;

  // SEO / SRT Core
  useSrtAsCore: boolean;
  seoTitleOverride?: string | null;
  seoKeywordsOverride?: string | null;
  seoBundle: SeoBundle | null;
  uploadPack: UploadPack | null;

  // Persisted Core SRT
  coreAudioSrt: CoreAudioSrt | null;

  // RSE v1 role configuration
  roleConfig: RoleConfig;

  // runtime meta (not persisted)
  _runId: string | null;
  _saveTimer: ReturnType<typeof setTimeout> | null;
};

export type AppActions = {
  setCurrentScreen: (screen: "home" | "builder") => void;
  setLevel: (level: LanguageLevel) => void;
  setTopic: (topic: string) => void;
  setHost1Persona: (persona: string) => void;
  setHost2Persona: (persona: string) => void;
  setHost1Name: (name: string) => void;
  setHost2Name: (name: string) => void;
  setHostRelationship: (relationship: string) => void;
  setChannelName: (channelName: string) => void;

  setPresetId: (id: PresetId | "custom") => void;
  setPodcastMode: (mode: PodcastMode) => void;
  setMonologueStyle: (style: MonologueStyle) => void;
  setMonologueHostName: (name: string) => void;
  setPodcastPacing: (pacing: PodcastPacing) => void;
  setPodcastInformality: (informality: PodcastInformality) => void;
  setPodcastStyle: (style: PodcastStyle) => void;
  setOverlayIntensity: (intensity: OverlayIntensity) => void;
  setPodcastDuration: (duration: PodcastDuration) => void;
  setEmotionalArc: (arc: EmotionalArc) => void;
  setHookStyle: (style: HookStyle) => void;
  setDailyScriptMode: (mode: DailyScriptMode) => void;

  addPreviousContent: (item: Omit<PreviousContentItem, "id">) => void;
  removePreviousContent: (id: string) => void;
  updatePreviousContent: (item: PreviousContentItem) => void;
  clearPreviousContent: () => void;

  setIsAdaptiveLearning: (value: boolean) => void;
  clearPerformanceData: () => void;
  addLearnerInterest: (interest: string) => void;
  removeLearnerInterest: (interest: string) => void;

  setChannelDescription: (description: string) => void;
  setTargetAudience: (audience: string) => void;
  addDefaultTag: (tag: string) => void;
  removeDefaultTag: (tag: string) => void;
  addSeoKeyword: (keyword: string) => void;
  removeSeoKeyword: (keyword: string) => void;

  setTeachingTechnique: (technique: TeachingTechnique) => void;

  setAccent: (accent: Accent) => void;
  setTargetLanguage: (language: TargetLanguage) => void;

  setSupplementalContent: (content: string) => void;
  setPodcastBackstory: (backstory: string) => void;

  setRealismIntensity: (value: number) => void;

  setIsCopilotActive: (value: boolean) => void;
  setIsEcosystemEngineEnabled: (value: boolean) => void;
  setIsDailyScriptEngineEnabled: (value: boolean) => void;

  setBookletPart: (content: string) => void;
  setPodcastScript: (content: string) => void;
  setShowNotesContent: (content: string) => void;
  setSocialMediaTeaserContent: (content: string) => void;

  setGenerateShowNotes: (value: boolean) => void;
  setGenerateSocialMediaTeaser: (value: boolean) => void;
  setActiveTab: (tab: Tab) => void;
  setTheme: (theme: string) => void;

  setToastMessage: (message: string | null) => void;

  setIsPublishingDashboardOpen: (isOpen: boolean) => void;
  setIsGrowthToolsModalOpen: (isOpen: boolean) => void;

  generateChannelTrailer: () => Promise<void>;
  generateFeaturedVideo: () => Promise<void>;

  handleMistakes: (mistakes: string[]) => void;
  saveSession: (debounced?: boolean) => void;
  loadSession: () => void;
  startNewSession: () => void;
  clearError: () => void;

  generateContent: () => Promise<void>;

  refineScript: (
    selection: { text: string; contextBefore: string; contextAfter: string },
    command: string,
    activeTab: Tab
  ) => Promise<void>;

  synthesizeLearnerDNA: () => Promise<void>;
  generateIllustrations: () => Promise<void>;
  generateCoverImage: () => Promise<void>;

  // SEO / SRT Core actions
  setUseSrtAsCore: (on: boolean) => void;
  setSeoTitleOverride: (s: string) => void;
  setSeoKeywordsOverride: (s: string) => void;
  generateSeo: () => Promise<void>;

  // Core SRT storage setter
  setCoreAudioSrt: (srt: CoreAudioSrt | null) => void;
};

// ---------- Secure Persistence (version + checksum) ----------
const SESSION_VERSION = "4.0.0"; // upgraded to separate from legacy sessions
const SESSION_KEY = "eduGeniusSession";

// Clip large text before persisting to avoid quota issues.
const MAX_PERSIST_CHARS = 200_000;
const clip = (s: string | null | undefined): string => {
  if (typeof s !== "string") return "";
  return s.length > MAX_PERSIST_CHARS ? s.slice(0, MAX_PERSIST_CHARS) + "…" : s;
};

const safeLocalStorage = {
  get: (key: string): string | null => {
    try {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string): boolean => {
    try {
      if (typeof window === "undefined") return false;
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      console.error(`[AppStore] Failed to save session to localStorage for key "${key}"`);
      return false;
    }
  },
  remove: (key: string): void => {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};

type PersistEnvelope = {
  version: string;
  data: Partial<AppState>;
  checksum: string;
};

const stateToPersist = (state: AppState): Partial<AppState> => ({
  currentScreen: state.currentScreen,
  level: state.level,
  topic: state.topic,
  host1Persona: state.host1Persona,
  host2Persona: state.host2Persona,
  host1Name: state.host1Name,
  host2Name: state.host2Name,
  hostRelationship: state.hostRelationship,
  channelName: state.channelName,
  presetId: state.presetId,
  podcastPacing: state.podcastPacing,
  podcastInformality: state.podcastInformality,
  podcastStyle: state.podcastStyle,
  overlayIntensity: state.overlayIntensity,
  podcastDuration: state.podcastDuration,
  emotionalArc: state.emotionalArc,
  hookStyle: state.hookStyle,
  podcastMode: state.podcastMode,
  monologueStyle: state.monologueStyle,
  monologueHostName: state.monologueHostName,
  previousContent: state.previousContent,
  isAdaptiveLearning: state.isAdaptiveLearning,
  performanceData: state.performanceData,
  learnerInterests: state.learnerInterests,
  supplementalContent: clip(state.supplementalContent),
  podcastBackstory: state.podcastBackstory,
  realismIntensity: state.realismIntensity,
  isCopilotActive: state.isCopilotActive,
  isEcosystemEngineEnabled: state.isEcosystemEngineEnabled,
  isDailyScriptEngineEnabled: state.isDailyScriptEngineEnabled,
  teachingTechnique: state.teachingTechnique,
  rawContent: clip(state.rawContent),
  insightsContent: clip(state.insightsContent),
  bookletPart: clip(state.bookletPart),
  podcastScript: clip(state.podcastScript),
  showNotesContent: clip(state.showNotesContent),
  socialMediaTeaserContent: clip(state.socialMediaTeaserContent),
  generateShowNotes: state.generateShowNotes,
  generateSocialMediaTeaser: state.generateSocialMediaTeaser,
  activeTab: state.activeTab,
  theme: state.theme,
  coverImage: null,
  illustrations: [],
  generationStep: state.generationStep === "complete" ? "complete" : "idle",
  error: state.error,
  lessonPlan: clip(state.lessonPlan),
  generationProgress: state.generationProgress,
  currentlyGeneratingSection: null,
  learnerDNA: state.learnerDNA,
  channelDescription: state.channelDescription,
  targetAudience: state.targetAudience,
  defaultTags: state.defaultTags,
  seoKeywords: state.seoKeywords,
  accent: state.accent,
  targetLanguage: state.targetLanguage,
  dailyScriptMode: state.dailyScriptMode,
  dailyScript: state.dailyScript,
  // SEO / SRT Core
  useSrtAsCore: state.useSrtAsCore,
  seoTitleOverride: state.seoTitleOverride ?? null,
  seoKeywordsOverride: state.seoKeywordsOverride ?? null,
  seoBundle: state.seoBundle,
  uploadPack: state.uploadPack,
  // Persisted Core SRT
  coreAudioSrt: state.coreAudioSrt,
  roleConfig: state.roleConfig,
});

const calculateChecksum = (data: unknown): string => {
  try {
    const json = JSON.stringify(data);
    return SHA256(json).toString();
  } catch {
    return "invalid";
  }
};

const persistSave = (state: AppState, debouncedNotice = true) => {
  const data = stateToPersist(state);
  const envelope: PersistEnvelope = {
    version: SESSION_VERSION,
    data,
    checksum: calculateChecksum({ version: SESSION_VERSION, data }),
  };
  const ok = safeLocalStorage.set(SESSION_KEY, JSON.stringify(envelope));
  if (!ok && !debouncedNotice) {
    state.toastMessage = "Error: Auto-save failed. Your session might be out of sync.";
  }
};

const migrateSession = (raw: unknown): Partial<AppState> | null => {
  if (!raw || typeof raw !== "object") return null;
  const env = raw as Partial<PersistEnvelope>;
  if (!env.version || typeof env.version !== "string") return null;
  const dataIn = (env as PersistEnvelope).data as Partial<AppState>;

  const migrated: Partial<AppState> = { ...dataIn };

  // Ensure required fields exist (progressive migrations)
  if (!("presetId" in migrated)) migrated.presetId = "custom" as any;
  if (!("generationProgress" in migrated) && Array.isArray(generationSections)) {
    const base = generationSections.reduce((acc, s) => {
      acc[s.key as SectionKey] = "pending";
      return acc;
    }, {} as Record<SectionKey, SectionProgress>);
    migrated.generationProgress = base;
  }
  if (!("dailyScriptMode" in migrated)) migrated.dailyScriptMode = "Podcast" as unknown as DailyScriptMode;
  if (!("isDailyScriptEngineEnabled" in migrated)) migrated.isDailyScriptEngineEnabled = false;

  if (!("useSrtAsCore" in migrated)) migrated.useSrtAsCore = true;
  if (!("seoTitleOverride" in migrated)) migrated.seoTitleOverride = null;
  if (!("seoKeywordsOverride" in migrated)) migrated.seoKeywordsOverride = null;
  if (!("seoBundle" in migrated)) migrated.seoBundle = null;
  if (!("uploadPack" in migrated)) migrated.uploadPack = null;

  if (!("coreAudioSrt" in migrated)) migrated.coreAudioSrt = null;

  if (!("roleConfig" in migrated)) {
    migrated.roleConfig = {
      host: { name: "Luna", tone: "warm, clear, patient" },
      coach: { name: "Liam", tone: "helpful, concise, encouraging" },
      characters: [
        { name: "Ava", role: "learner", note: "A2-B1 common mistakes" },
        { name: "Sam", role: "clerk", note: "native, simple speech" },
      ],
    } as RoleConfig;
  }

  return migrated;
};

const persistLoad = (): Partial<AppState> | null => {
  const raw = safeLocalStorage.get(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistEnvelope;
    if (!parsed || typeof parsed !== "object" || !parsed.data || typeof parsed.checksum !== "string") {
      throw new Error("Invalid persisted format");
    }

    const recalculated = calculateChecksum({ version: parsed.version, data: parsed.data });
    if (parsed.checksum !== recalculated) {
      console.warn("[AppStore] Checksum mismatch — resetting session.");
      safeLocalStorage.remove(SESSION_KEY);
      return null;
    }

    if (parsed.version !== SESSION_VERSION) {
      const migrated = migrateSession(parsed);
      if (migrated) {
        // Store back as latest
        const newEnvelope: PersistEnvelope = {
          version: SESSION_VERSION,
          data: migrated,
          checksum: calculateChecksum({ version: SESSION_VERSION, data: migrated }),
        };
        safeLocalStorage.set(SESSION_KEY, JSON.stringify(newEnvelope));
        return migrated;
      }
      return null;
    }

    return parsed.data as Partial<AppState>;
  } catch (e) {
    console.error("[AppStore] Failed to parse session:", e);
    safeLocalStorage.remove(SESSION_KEY);
    return null;
  }
};

// ---------- Helpers ----------
const deriveOverlayFromLevel = (level: LanguageLevel, fallback: OverlayIntensity): OverlayIntensity => {
  const cfg = LEVELS[level as LevelId] as Record<string, unknown> | undefined;
  const v = (cfg?.overlapIntensity ?? cfg?.overlayIntensity) as string | undefined;
  return v === "Low" || v === "Medium" || v === "High" ? (v as OverlayIntensity) : fallback;
};

const SECTION = {
  TEASER: "<SECTION:SOCIAL_MEDIA_TEASER>",
  SHOWNOTES: "<SECTION:SHOW_NOTES>",
  PODCAST: "<SECTION:PODCAST_SCRIPT>",
} as const;

const sectionTagRegex = /<SECTION:([^>]+)>/g;

const parseAndSetContent = (content: string, apply: (partial: Partial<AppState>) => void) => {
  const teaserIndex = content.indexOf(SECTION.TEASER);
  const teaserContent = teaserIndex !== -1 ? content.substring(teaserIndex + SECTION.TEASER.length).trim() : "";
  const beforeTeaser = teaserIndex !== -1 ? content.substring(0, teaserIndex) : content;

  const showNotesIndex = beforeTeaser.indexOf(SECTION.SHOWNOTES);
  const showNotesContent =
    showNotesIndex !== -1 ? beforeTeaser.substring(showNotesIndex + SECTION.SHOWNOTES.length).trim() : "";
  const beforeShowNotes = showNotesIndex !== -1 ? beforeTeaser.substring(0, showNotesIndex) : beforeTeaser;

  const podcastIndex = beforeShowNotes.indexOf(SECTION.PODCAST);
  const podcastContent =
    podcastIndex !== -1 ? beforeShowNotes.substring(podcastIndex + SECTION.PODCAST.length).trim() : "";
  const bookletContent = (podcastIndex !== -1 ? beforeShowNotes.substring(0, podcastIndex) : beforeShowNotes)
    .replace(/<SECTION:[^>]+>\s*/g, "")
    .trim();

  apply({
    bookletPart: bookletContent,
    podcastScript: podcastContent,
    showNotesContent,
    socialMediaTeaserContent: teaserContent,
  });
};

const makeInitialProgress = (): Record<SectionKey, SectionProgress> =>
  generationSections.reduce((acc, s) => {
    acc[s.key] = "pending";
    return acc;
  }, {} as Record<SectionKey, SectionProgress>);

const markProgressFromTag = (
  current: Record<SectionKey, SectionProgress>,
  tag: string
): Record<SectionKey, SectionProgress> => {
  const next: Record<SectionKey, SectionProgress> = { ...current };
  const keys = generationSections.map((s) => s.key);
  for (const k of keys) {
    if (next[k as SectionKey] === "in_progress") next[k as SectionKey] = "complete";
  }
  if ((keys as string[]).includes(tag)) {
    next[tag as SectionKey] = "in_progress";
  }
  return next;
};

// ---------- Initial State ----------
const initialState: AppState = {
  currentScreen: "home",
  level: LanguageLevel.B1,
  topic: "Food and Cooking",
  host1Persona:
    "Luna: A warm, patient, and knowledgeable guide. Internal state: excited about the topic. Goal: to make the listener feel confident.",
  host2Persona:
    "Liam: An energetic, curious, and playful learner. Internal state: slightly confused but curious. Goal: to understand the main point.",
  host1Name: "Luna",
  host2Name: "Liam",
  hostRelationship: "Luna is Liam's patient older sister. They often use gentle, teasing humor.",
  channelName: "Real Smart English",
  presetId: "custom",
  podcastMode: PodcastMode.Dialogue,
  monologueStyle: MonologueStyle.LearningCoach,
  monologueHostName: "Luna",
  podcastPacing: "Slow",
  podcastInformality: "Very Informal",
  podcastStyle: PodcastStyle.Immersive,
  overlayIntensity: "Medium",
  podcastDuration: 10,
  emotionalArc: "Educational",
  hookStyle: "None",
  dailyScriptMode: "Podcast" as DailyScriptMode,
  previousContent: [],
  isAdaptiveLearning: true,
  performanceData: {},
  learnerInterests: [],
  supplementalContent: "",
  podcastBackstory: "",

  realismIntensity: 75,

  isCopilotActive: false,
  isEcosystemEngineEnabled: true,
  isDailyScriptEngineEnabled: false,

  teachingTechnique: TeachingTechnique.Communicative,

  accent: Accent.US,
  targetLanguage: TargetLanguage.English,

  channelDescription: `Real Smart English | Learn to Speak Real English for Real Life
Welcome to Real Smart English — the channel where English becomes simple, real, and fun!
We upload daily English lessons, smart podcasts, and slow English speaking practice videos designed to help you speak confidently, naturally, and fluently in the real world. No boring textbook English here — only the way people actually speak every day.

Our lessons are made for A1–B2 learners and include:
✅ Real conversations and daily expressions
✅ Essential English words and phrases
✅ Listening, shadowing, and speaking practice with clear dialogues
✅ Real-life English for cafés, travel, work, and social life

Each video helps you think in English, speak without fear, and understand real people in real situations.
🎧 Listen daily 🗣️ Speak daily 🚀 Improve daily.
Join Real Smart English today — learn fast, sound real, and make English part of your everyday life.
Subscribe now and start speaking real English that works anywhere, anytime!`,

  targetAudience:
    "A1–B2 learners who want to speak real English confidently and naturally for daily life, travel, and work.",
  defaultTags: [
    "real smart english",
    "learn english",
    "learn english online",
    "english speaking practice",
    "speak english fluently",
    "real english",
    "smart english",
    "slow english",
    "shadowing",
    "english podcast",
    "english dialogues",
    "english for beginners",
    "english listening practice",
    "english vocabulary",
    "english phrases",
    "english conversation",
    "daily english",
    "everyday english",
    "real life english",
    "english for travel & work",
    "fluent english",
    "natural english",
    "english improvement",
    "english communication",
    "luna and liam",
  ],
  seoKeywords: [
    "learn english online",
    "learn english",
    "english speaking practice",
    "speak english fluently",
    "real english",
    "smart english",
    "slow english",
    "shadowing",
    "english podcast",
    "english listening practice",
    "english pronunciation",
    "english vocabulary",
    "english phrases",
    "english grammar",
    "english for beginners",
    "english conversation",
    "everyday english",
    "english for travel & work",
    "fluent english",
    "natural english",
    "english confidence",
    "english communication",
    "english for life",
    "real smart english",
  ],

  rawContent: "",
  insightsContent: "",
  bookletPart: "",
  podcastScript: "",
  showNotesContent: "",
  socialMediaTeaserContent: "",
  dailyScript: null,

  generateShowNotes: true,
  generateSocialMediaTeaser: true,
  activeTab: "booklet",
  theme: "Modern",
  coverImage: null,

  generationStep: "idle",
  error: null,
  toastMessage: null,
  lessonPlan: "",
  generationProgress: makeInitialProgress(),
  currentlyGeneratingSection: null,
  learnerDNA: null,
  illustrations: [],
  isGeneratingCover: false,
  isGeneratingIllustrations: false,

  isPublishingDashboardOpen: false,
  performanceHistory: {
    predicted: { ctr: 5.5, retention: 45 },
    actual: { ctr: 6.2, retention: 48 },
  },
  aiRecommendations: [
    "The Curiosity-Driven title outperformed predictions by 12%. Continue using this style.",
    "Retention saw a spike during the 'Story Concept'. Consider making stories slightly longer.",
    "The term 'bustling' appeared in top search queries. Create a follow-up lesson on city vocabulary.",
  ],

  isGrowthToolsModalOpen: false,
  isGeneratingGrowthTool: false,
  growthToolContent: null,

  // SEO / SRT Core
  useSrtAsCore: true,
  seoTitleOverride: null,
  seoKeywordsOverride: null,
  seoBundle: null,
  uploadPack: null,

  // Core SRT persisted object
  coreAudioSrt: null,

  roleConfig: {
    host: { name: "Luna", tone: "warm, clear, patient" },
    coach: { name: "Liam", tone: "helpful, concise, encouraging" },
    characters: [
      { name: "Ava", role: "learner", note: "A2-B1 common mistakes" },
      { name: "Sam", role: "clerk", note: "native, simple speech" },
    ],
  },

  _runId: null,
  _saveTimer: null,
};

// ---------- Store ----------
export const useAppStore = create<AppState & AppActions>()((set, get) => {
  // If a valid session exists, hydrate initial state before returning store
  const loaded = persistLoad();
  const base = loaded ? { ...initialState, ...loaded } : initialState;

  return {
    ...base,

    // Simple setters
    setCurrentScreen: (screen) => {
      set({ currentScreen: screen });
      get().saveSession();
    },
    setLevel: (level) => {
      const prev = get().level;
      if (prev === level) return;
      const nextOverlay = deriveOverlayFromLevel(level, get().overlayIntensity);
      set({ level, overlayIntensity: nextOverlay, presetId: "custom" });
      get().saveSession();
    },
    setTopic: (topic) => {
      const t = (topic || "").trim();
      if (!t || get().topic === t) return;
      set({ topic: t });
      get().saveSession();
    },
    setHost1Persona: (persona) => {
      set({ host1Persona: persona });
      get().saveSession();
    },
    setHost2Persona: (persona) => {
      set({ host2Persona: persona });
      get().saveSession();
    },
    setHost1Name: (name) => {
      set({ host1Name: name });
      get().saveSession();
    },
    setHost2Name: (name) => {
      set({ host2Name: name });
      get().saveSession();
    },
    setHostRelationship: (relationship) => {
      set({ hostRelationship: relationship });
      get().saveSession();
    },
    setChannelName: (channelName) => {
      set({ channelName });
      get().saveSession();
    },

    setPresetId: (id) => {
      if (id === "custom") {
        set({ presetId: "custom" });
        get().saveSession();
        return;
      }
      const preset = PRESETS[id as PresetId];
      if (!preset) return;
      set({
        presetId: id,
        podcastPacing: preset.pacing,
        podcastInformality: preset.informality,
        emotionalArc: preset.defaultArc,
        hookStyle: preset.defaultHook,
        overlayIntensity: preset.overlap,
        teachingTechnique: preset.technique,
        podcastMode: preset.mode === "monologue" ? PodcastMode.Monologue : PodcastMode.Dialogue,
      });
      get().saveSession();
    },

    setPodcastMode: (mode) => {
      set({ podcastMode: mode, presetId: "custom" });
      get().saveSession();
    },
    setMonologueStyle: (style) => {
      set({ monologueStyle: style, presetId: "custom" });
      get().saveSession();
    },
    setMonologueHostName: (name) => {
      set({ monologueHostName: name, presetId: "custom" });
      get().saveSession();
    },
    setPodcastPacing: (pacing) => {
      set({ podcastPacing: pacing, presetId: "custom" });
      get().saveSession();
    },
    setPodcastInformality: (informality) => {
      set({ podcastInformality: informality, presetId: "custom" });
      get().saveSession();
    },
    setPodcastStyle: (style) => {
      set({ podcastStyle: style, presetId: "custom" });
      get().saveSession();
    },
    setOverlayIntensity: (intensity) => {
      set({ overlayIntensity: intensity, presetId: "custom" });
      get().saveSession();
    },
    setPodcastDuration: (duration) => {
      set({ podcastDuration: duration });
      get().saveSession();
    },
    setEmotionalArc: (arc) => {
      set({ emotionalArc: arc, presetId: "custom" });
      get().saveSession();
    },
    setHookStyle: (style) => {
      set({ hookStyle: style, presetId: "custom" });
      get().saveSession();
    },
    setDailyScriptMode: (mode) => {
      set({ dailyScriptMode: mode });
      get().saveSession();
    },

    addPreviousContent: (item) => {
      set((state) => {
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        return { previousContent: [...state.previousContent, { ...item, id }] };
      });
      get().saveSession();
    },
    removePreviousContent: (id) => {
      set((state) => ({ previousContent: state.previousContent.filter((i) => i.id !== id) }));
      get().saveSession();
    },
    updatePreviousContent: (updated) => {
      set((state) => ({
        previousContent: state.previousContent.map((i) => (i.id === updated.id ? updated : i)),
      }));
      get().saveSession();
    },
    clearPreviousContent: () => {
      set({ previousContent: [] });
      get().saveSession();
    },

    setIsAdaptiveLearning: (value) => {
      set({ isAdaptiveLearning: value });
      get().saveSession();
    },
    clearPerformanceData: () => {
      set({ performanceData: {} });
      get().saveSession();
    },

    addLearnerInterest: (interest) => {
      set((state) => {
        const trimmed = (interest || "").trim();
        if (!trimmed || state.learnerInterests.includes(trimmed)) return {};
        return { learnerInterests: [...state.learnerInterests, trimmed] };
      });
      get().saveSession();
    },
    removeLearnerInterest: (interest) => {
      set((state) => ({
        learnerInterests: state.learnerInterests.filter((i) => i !== interest),
      }));
      get().saveSession();
    },

    setChannelDescription: (description) => {
      set({ channelDescription: description });
      get().saveSession();
    },
    setTargetAudience: (audience) => {
      set({ targetAudience: audience });
      get().saveSession();
    },
    addDefaultTag: (tag) => {
      set((state) => {
        const t = (tag || "").trim();
        if (!t || state.defaultTags.includes(t)) return {};
        return { defaultTags: [...state.defaultTags, t] };
      });
      get().saveSession();
    },
    removeDefaultTag: (tag) => {
      set((state) => ({ defaultTags: state.defaultTags.filter((t) => t !== tag) }));
      get().saveSession();
    },
    addSeoKeyword: (keyword) => {
      set((state) => {
        const k = (keyword || "").trim();
        if (!k || state.seoKeywords.includes(k)) return {};
        return { seoKeywords: [...state.seoKeywords, k] };
      });
      get().saveSession();
    },
    removeSeoKeyword: (keyword) => {
      set((state) => ({ seoKeywords: state.seoKeywords.filter((k) => k !== keyword) }));
      get().saveSession();
    },

    setTeachingTechnique: (technique) => {
      set({ teachingTechnique: technique, presetId: "custom" });
      get().saveSession();
    },

    setAccent: (accent) => {
      set({ accent });
      get().saveSession();
    },
    setTargetLanguage: (language) => {
      set({ targetLanguage: language });
      get().saveSession();
    },

    setSupplementalContent: (content) => {
      set({ supplementalContent: content });
      get().saveSession();
    },
    setPodcastBackstory: (backstory) => {
      set({ podcastBackstory: backstory });
      get().saveSession();
    },

    setRealismIntensity: (value) => {
      set({ realismIntensity: value });
      get().saveSession();
    },

    setIsCopilotActive: (value) => {
      set({ isCopilotActive: value });
      get().saveSession();
    },
    setIsEcosystemEngineEnabled: (value) => {
      set({ isEcosystemEngineEnabled: value });
      get().saveSession();
    },
    setIsDailyScriptEngineEnabled: (value) => {
      set({ isDailyScriptEngineEnabled: value });
      get().saveSession();
    },

    setBookletPart: (content) => {
      set({ bookletPart: content });
      get().saveSession();
    },
    setPodcastScript: (content) => {
      set({ podcastScript: content });
      get().saveSession();
    },
    setShowNotesContent: (content) => {
      set({ showNotesContent: content });
      get().saveSession();
    },
    setSocialMediaTeaserContent: (content) => {
      set({ socialMediaTeaserContent: content });
      get().saveSession();
    },

    setGenerateShowNotes: (value) => {
      set({ generateShowNotes: value });
      get().saveSession();
    },
    setGenerateSocialMediaTeaser: (value) => {
      set({ generateSocialMediaTeaser: value });
      get().saveSession();
    },
    setActiveTab: (tab) => {
      set({ activeTab: tab });
      get().saveSession();
    },
    setTheme: (theme) => {
      set({ theme });
      get().saveSession();
    },

    setToastMessage: (message) => {
      const prev = get().toastMessage;
      if (prev === message) return;
      set({ toastMessage: message });
    },

    setIsPublishingDashboardOpen: (isOpen: boolean) => set({ isPublishingDashboardOpen: isOpen }),
    setIsGrowthToolsModalOpen: (isOpen: boolean) => set({ isGrowthToolsModalOpen: isOpen }),

    clearError: () => {
      set({ error: null });
      get().saveSession();
    },

    // SRT/SEO setters
    setUseSrtAsCore: (on) => {
      set({ useSrtAsCore: !!on });
      get().saveSession();
    },
    setSeoTitleOverride: (s) => {
      const t = (s ?? "").trim();
      set({ seoTitleOverride: t.length ? t : null });
      get().saveSession();
    },
    setSeoKeywordsOverride: (s) => {
      const t = (s ?? "").trim();
      set({ seoKeywordsOverride: t.length ? t : null });
      get().saveSession();
    },

    // Core SRT store
    setCoreAudioSrt: (srt) => {
      set({ coreAudioSrt: srt });
      get().saveSession();
    },

    // Complex actions
    handleMistakes: (mistakes: string[]) => {
      if (!get().isAdaptiveLearning || mistakes.length === 0) return;
      set((state) => {
        const next = { ...state.performanceData };
        mistakes.forEach((m) => {
          const key = (m || "").toLowerCase().trim();
          if (!key) return;
          next[key] = (next[key] || 0) + 1;
        });
        return { performanceData: next };
      });
      get().saveSession();
    },

    startNewSession: () => {
      if (typeof window !== "undefined" && window.confirm("Start a new session? This clears current work.")) {
        safeLocalStorage.remove(SESSION_KEY);
        set({ ...initialState, toastMessage: "New session started." });
      }
    },

    saveSession: (debounced = true) => {
      const doSave = () => {
        try {
          const state = get();
          persistSave(state, debounced);
          if (!debounced) {
            set({ toastMessage: "Session saved." });
          }
        } catch (e) {
          console.error("Failed to save session:", e);
          const message = e instanceof Error ? e.message : "Could not stringify session state.";
          set({ toastMessage: `Error: Auto-save failed. ${message}` });
        }
      };
      if (!debounced) {
        doSave();
        return;
      }
      const prev = get()._saveTimer;
      if (prev) clearTimeout(prev);
      const t = setTimeout(doSave, 600);
      set({ _saveTimer: t });
    },

    loadSession: () => {
      const saved = safeLocalStorage.get(SESSION_KEY);
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved) as PersistEnvelope;
        const migrated = parsed.version === SESSION_VERSION ? parsed.data : migrateSession(parsed);
        if (migrated) {
          set({
            ...(migrated as Partial<AppState>),
            generationStep: "idle",
            error: null,
            toastMessage: "Session loaded.",
            isGeneratingCover: false,
            isGeneratingIllustrations: false,
            isGeneratingGrowthTool: false,
            _runId: null,
          });
        } else {
          set({ toastMessage: "Couldn't load session data. Starting fresh." });
          safeLocalStorage.remove(SESSION_KEY);
        }
      } catch (e) {
        console.error("Failed to load session:", e);
        safeLocalStorage.remove(SESSION_KEY);
        set({ toastMessage: "Error: Session data was corrupted. Starting fresh." });
      }
    },

    generateContent: async () => {
      const state = get();
      if (state.generationStep === "planning" || state.generationStep === "generating") return;

      set({
        generationStep: "planning",
        error: null,
        rawContent: "",
        insightsContent: "",
        bookletPart: "",
        podcastScript: "",
        showNotesContent: "",
        socialMediaTeaserContent: "",
        dailyScript: null,
        coverImage: null,
        illustrations: [],
        generationProgress: makeInitialProgress(),
        currentlyGeneratingSection: null,
        _runId: Date.now().toString(),
      });

      try {
        if (state.isDailyScriptEngineEnabled) {
          set({ generationStep: "generating", currentlyGeneratingSection: "PODCAST_SCRIPT" });
          const dateIso = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
          await generateDailyScriptService({
            date_iso: dateIso,
            mode: state.dailyScriptMode,
            level: state.level,
            duration_minutes: state.podcastDuration,
            accent: state.accent,
            target_language: state.targetLanguage,
            title: state.topic,
            topic: state.topic,
            performance_data: state.performanceData,
            learner_interests: state.learnerInterests,
            review_queue: state.previousContent.map((c) => c.title),
            supplemental_text: state.supplementalContent,
            podcast_format: state.podcastMode,
            host1_persona: state.host1Persona,
            host2_persona: state.host2Persona,
            informality: state.podcastInformality,
            overlay_intensity: state.overlayIntensity,
            pacing: state.podcastPacing,
          });
          set({ dailyScript: script, generationStep: "complete", activeTab: "daily_script" });
        } else {
          const plan = await generatePlan(
            state.level,
            state.topic,
            state.isAdaptiveLearning,
            state.performanceData,
            state.supplementalContent,
            state.learnerInterests,
            state.learnerDNA,
            state.channelDescription,
            state.targetAudience,
            state.defaultTags,
            state.seoKeywords,
            state.accent,
            state.targetLanguage,
            state.teachingTechnique
          );
          set({ lessonPlan: plan, insightsContent: plan, generationStep: "generating", activeTab: "insights" });

          const runId = get()._runId;

          // ✅ داخل همان call به generateBookletStream جایگزین کنید
          const stream = generateBookletStream({
            level: state.level,
            topic: state.topic,
            host1Persona: state.host1Persona,
            host2Persona: state.host2Persona,
            hostRelationship: state.hostRelationship,
            channelName: state.channelName,
            podcastMode: state.podcastMode,
            monologueStyle: state.monologueStyle,
            podcastPacing: state.podcastPacing,
            podcastInformality: state.podcastInformality,
            podcastStyle: state.podcastStyle,
            overlayIntensity: state.overlayIntensity,
            podcastDuration: state.podcastDuration,
            previousContent: state.previousContent,
            supplementalContent: state.supplementalContent,
            lessonPlan: plan,
            learnerInterests: state.learnerInterests,
            generateShowNotes: state.generateShowNotes,
            generateSocialMediaTeaser: state.generateSocialMediaTeaser,
            podcastBackstory: state.podcastBackstory,
            realismIntensity: state.realismIntensity,
            isEcosystemEngineEnabled: state.isEcosystemEngineEnabled,
            emotionalArc: state.emotionalArc,
            hookStyle: state.hookStyle,
            teachingTechnique: state.teachingTechnique,
            channelDescription: state.channelDescription,
            targetAudience: state.targetAudience,
            defaultTags: state.defaultTags,
            seoKeywords: state.seoKeywords,
            accent: state.accent,
            targetLanguage: state.targetLanguage,

            // 🔑 فقط اگر داده داریم، این کلید را اضافه کن
            ...(state.coreAudioSrt
              ? {
                  core_audio_srt: {
                    ...(state.coreAudioSrt.id ? { id: state.coreAudioSrt.id } : {}),
                    ...(state.coreAudioSrt.filename ? { filename: state.coreAudioSrt.filename } : {}),
                    content: state.coreAudioSrt.content,
                    ...(state.coreAudioSrt.anchor ? { anchor: state.coreAudioSrt.anchor } : {}),
                  },
                }
              : {}),
          });

          let accumulatedContent = "";
          for await (const chunk of stream) {
            if (get()._runId !== runId) {
              console.warn("Generation aborted due to new request.");
              return;
            }
            accumulatedContent += chunk;

            const match = chunk.match(sectionTagRegex);
            if (match) {
              const tag = match[0].replace(/<SECTION:|>/g, "");
              set((s) => ({
                generationProgress: markProgressFromTag(s.generationProgress, tag),
                currentlyGeneratingSection: tag as SectionKey,
              }));
            }
            set({ rawContent: accumulatedContent });
          }

          parseAndSetContent(accumulatedContent, (partial) => set(partial));
          set({ generationStep: "complete", activeTab: "booklet" });
        }
        get().saveSession();
      } catch (e) {
        console.error("Generation failed:", e);
        const errorMessage = getApiErrorMessage(e);
        set({ error: errorMessage, generationStep: "error" });
      }
    },

    refineScript: async (selection, command, activeTab) => {
      try {
        const state = get();
        const fullContext = {
          booklet: state.bookletPart,
          podcast: state.podcastScript,
          show_notes: state.showNotesContent,
          teaser: state.socialMediaTeaserContent,
        };
        const refinedText = await refineScriptSelection(
          selection,
          command,
          state.host1Persona,
          state.host2Persona,
          fullContext
        );

        const updateContent = (original: string, selectionText: string, replacement: string) =>
          original.replace(selectionText, replacement);

        if (activeTab === "booklet") {
          set((s) => ({ bookletPart: updateContent(s.bookletPart, selection.text, refinedText) }));
        } else if (activeTab === "podcast") {
          set((s) => ({ podcastScript: updateContent(s.podcastScript, selection.text, refinedText) }));
        }

        set({ toastMessage: "Selection refined!" });
        get().saveSession();
      } catch (e) {
        const errorMessage = getApiErrorMessage(e);
        set({ toastMessage: `Error: ${errorMessage}` });
      }
    },

    synthesizeLearnerDNA: async () => {
      try {
        const state = get();
        const dna = await synthesizeLearnerDNAService(
          state.performanceData,
          state.learnerInterests,
          state.previousContent
        );
        set({ learnerDNA: dna, toastMessage: "Learner DNA synthesized." });
        get().saveSession();
      } catch (e) {
        const errorMessage = getApiErrorMessage(e);
        set({ toastMessage: `Error: ${errorMessage}` });
      }
    },

    generateIllustrations: async () => {
      if (get().isGeneratingIllustrations) return;
      set({ isGeneratingIllustrations: true });
      try {
        const state = get();
        const illustrations = await generateIllustrationsService(state.bookletPart);
        set({ illustrations, toastMessage: "Illustrations generated!" });
        get().saveSession();
      } catch (e) {
        const errorMessage = getApiErrorMessage(e);
        set({ toastMessage: `Error: ${errorMessage}` });
      } finally {
        set({ isGeneratingIllustrations: false });
      }
    },

    generateCoverImage: async () => {
      if (get().isGeneratingCover) return;
      set({ isGeneratingCover: true });
      try {
        const state = get();
        const imageBytes = await generateCoverImageService(state.topic, state.topic);
        set({ coverImage: `data:image/jpeg;base64,${imageBytes}`, toastMessage: "Cover image generated!" });
      } catch (e) {
        const errorMessage = getApiErrorMessage(e);
        set({ toastMessage: `Error: ${errorMessage}` });
      } finally {
        set({ isGeneratingCover: false });
      }
    },

    generateChannelTrailer: async () => {
      if (get().isGeneratingGrowthTool) return;
      set({ isGeneratingGrowthTool: true, growthToolContent: null, error: null });
      try {
        const state = get();
        const content = await generateChannelTrailerService(
          state.channelDescription,
          state.targetAudience,
          state.defaultTags,
          state.seoKeywords,
          state.host1Persona,
          state.host2Persona
        );
        set({ growthToolContent: content });
      } catch (e) {
        const errorMessage = getApiErrorMessage(e);
        set({ error: errorMessage });
      } finally {
        set({ isGeneratingGrowthTool: false });
      }
    },

    generateFeaturedVideo: async () => {
      if (get().isGeneratingGrowthTool) return;
      set({ isGeneratingGrowthTool: true, growthToolContent: null, error: null });
      try {
        const state = get();
        const content = await generateFeaturedVideoService(
          state.channelDescription,
          state.targetAudience,
          state.defaultTags,
          state.seoKeywords,
          state.host1Persona,
          state.host2Persona
        );
        set({ growthToolContent: content });
      } catch (e) {
        const errorMessage = getApiErrorMessage(e);
        set({ error: errorMessage });
      } finally {
        set({ isGeneratingGrowthTool: false });
      }
    },

    generateSeo: async () => {
      try {
        const s = get();

        const overrideKeywords = (s.seoKeywordsOverride || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

        const bundle = await generateSeoBundle({
          topic: s.topic,
          channelName: s.channelName,
          defaultTags: s.defaultTags,
          seoKeywords: overrideKeywords.length ? overrideKeywords : s.seoKeywords,
          lessonPlan: s.lessonPlan || s.insightsContent || "",
          srtText: s.useSrtAsCore ? s.coreAudioSrt?.content ?? "" : "",
          targetLanguage: s.targetLanguage,
        });

        const finalBundle: SeoBundle = {
          ...bundle,
          seoTitle: s.seoTitleOverride && s.seoTitleOverride.trim() ? s.seoTitleOverride.trim() : bundle.seoTitle,
          seoTags: overrideKeywords.length
            ? Array.from(new Set([...overrideKeywords, ...bundle.seoTags]))
            : bundle.seoTags,
        };

        const pack = await buildUploadPackFromSeo(finalBundle);

        set({ seoBundle: finalBundle, uploadPack: pack, toastMessage: "SEO bundle created." });
        get().saveSession(true);
      } catch (e) {
        const message = getApiErrorMessage(e);
        set({ toastMessage: `Error generating SEO: ${message}` });
      }
    },
  };
});
