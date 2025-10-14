// src/store/appStore.core.ts
// ============================================================================
// Core store foundation for RealSmartEnglishStudio
// TypeScript 5.x | React 19 | Zustand 5.x | Vite 7 | Strict Mode
// No runtime logic — only type definitions & base interfaces.
// ============================================================================

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
import type { DailyScript, DailyScriptMode } from "../types/dailyScript";

// ----------------------------------------------------------------------------
// AppCoreState — immutable state contract shared across modules
// ----------------------------------------------------------------------------
export interface AppCoreState {
  currentScreen: "home" | "builder";
  level: LanguageLevel;
  topic: string;
  host1Persona: string;
  host2Persona: string;
  host1Name: string;
  host2Name: string;
  hostRelationship: string;
  channelName: string;

  presetId: string;
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
  performanceHistory: {
    predicted: { ctr: number; retention: number };
    actual: { ctr: number; retention: number };
  };
  aiRecommendations: string[];

  isGrowthToolsModalOpen: boolean;
  isGeneratingGrowthTool: boolean;
  growthToolContent: string | null;

  useSrtAsCore: boolean;
  seoTitleOverride?: string | null;
  seoKeywordsOverride?: string | null;
  seoBundle: SeoBundle | null;
  uploadPack: UploadPack | null;

  coreAudioSrt: CoreAudioSrt | null;
  roleConfig: RoleConfig;

  _runId: string | null;
  _saveTimer: ReturnType<typeof setTimeout> | null;
}

// ----------------------------------------------------------------------------
// AppCoreActions — pure setter signatures (no implementation here)
// ----------------------------------------------------------------------------
export interface AppCoreActions {
  setCurrentScreen(screen: "home" | "builder"): void;
  setLevel(level: LanguageLevel): void;
  setTopic(topic: string): void;
  setHost1Persona(persona: string): void;
  setHost2Persona(persona: string): void;
  setHost1Name(name: string): void;
  setHost2Name(name: string): void;
  setHostRelationship(relationship: string): void;
  setChannelName(channelName: string): void;

  setPresetId(id: string): void;
  setPodcastMode(mode: PodcastMode): void;
  setMonologueStyle(style: MonologueStyle): void;
  setMonologueHostName(name: string): void;
  setPodcastPacing(pacing: PodcastPacing): void;
  setPodcastInformality(informality: PodcastInformality): void;
  setPodcastStyle(style: PodcastStyle): void;
  setOverlayIntensity(intensity: OverlayIntensity): void;
  setPodcastDuration(duration: PodcastDuration): void;
  setEmotionalArc(arc: EmotionalArc): void;
  setHookStyle(style: HookStyle): void;
  setDailyScriptMode(mode: DailyScriptMode): void;

  addPreviousContent(item: Omit<PreviousContentItem, "id">): void;
  removePreviousContent(id: string): void;
  updatePreviousContent(item: PreviousContentItem): void;
  clearPreviousContent(): void;

  setIsAdaptiveLearning(value: boolean): void;
  clearPerformanceData(): void;
  addLearnerInterest(interest: string): void;
  removeLearnerInterest(interest: string): void;

  setChannelDescription(description: string): void;
  setTargetAudience(audience: string): void;
  addDefaultTag(tag: string): void;
  removeDefaultTag(tag: string): void;
  addSeoKeyword(keyword: string): void;
  removeSeoKeyword(keyword: string): void;

  setTeachingTechnique(technique: TeachingTechnique): void;
  setAccent(accent: Accent): void;
  setTargetLanguage(language: TargetLanguage): void;

  setSupplementalContent(content: string): void;
  setPodcastBackstory(backstory: string): void;
  setRealismIntensity(value: number): void;
  setIsCopilotActive(value: boolean): void;
  setIsEcosystemEngineEnabled(value: boolean): void;
  setIsDailyScriptEngineEnabled(value: boolean): void;

  setBookletPart(content: string): void;
  setPodcastScript(content: string): void;
  setShowNotesContent(content: string): void;
  setSocialMediaTeaserContent(content: string): void;

  setGenerateShowNotes(value: boolean): void;
  setGenerateSocialMediaTeaser(value: boolean): void;
  setActiveTab(tab: Tab): void;
  setTheme(theme: string): void;
  setToastMessage(message: string | null): void;

  setIsPublishingDashboardOpen(isOpen: boolean): void;
  setIsGrowthToolsModalOpen(isOpen: boolean): void;

  clearError(): void;
  setUseSrtAsCore(on: boolean): void;
  setSeoTitleOverride(s: string): void;
  setSeoKeywordsOverride(s: string): void;
  setCoreAudioSrt(srt: CoreAudioSrt | null): void;
}
