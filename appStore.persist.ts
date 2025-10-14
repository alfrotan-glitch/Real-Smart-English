// src/store/appStore.persist.ts
// ============================================================================
// Secure persistence layer for RealSmartEnglishStudio
// TypeScript 5.x | React 19 | Zustand 5.x | Vite 7 | Strict Mode
// Includes versioning, SHA-256 checksum, safe migration, and hydration.
// ============================================================================

import { createHash } from "crypto-js/sha256";
import type { AppCoreState } from "./appStore.core";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------
const SESSION_VERSION = "3.0.0";
const STORAGE_KEY = "eduGeniusSession";

// ----------------------------------------------------------------------------
// Utility: calculate SHA-256 checksum
// ----------------------------------------------------------------------------
export const calculateChecksum = (data: unknown): string => {
  try {
    const json = JSON.stringify(data);
    // @ts-ignore: crypto-js SHA256 returns object with toString()
    return createHash(json).toString();
  } catch {
    return "invalid";
  }
};

// ----------------------------------------------------------------------------
// Safe localStorage wrapper
// ----------------------------------------------------------------------------
export const safeStorage = {
  get(key: string): string | null {
    try {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): boolean {
    try {
      if (typeof window === "undefined") return false;
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string): void {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};

// ----------------------------------------------------------------------------
// State to persist (safe clip for large text)
// ----------------------------------------------------------------------------
const MAX_CHARS = 200_000;
const clip = (s: string | null | undefined): string => {
  if (typeof s !== "string") return "";
  return s.length > MAX_CHARS ? s.slice(0, MAX_CHARS) + "…" : s;
};

// ----------------------------------------------------------------------------
// Build persistable snapshot with checksum + version
// ----------------------------------------------------------------------------
export const buildPersistSnapshot = (state: AppCoreState) => {
  const core = {
    version: SESSION_VERSION,
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
    podcastMode: state.podcastMode,
    monologueStyle: state.monologueStyle,
    podcastPacing: state.podcastPacing,
    podcastInformality: state.podcastInformality,
    podcastStyle: state.podcastStyle,
    overlayIntensity: state.overlayIntensity,
    podcastDuration: state.podcastDuration,
    emotionalArc: state.emotionalArc,
    hookStyle: state.hookStyle,
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
    accent: state.accent,
    targetLanguage: state.targetLanguage,
    channelDescription: state.channelDescription,
    targetAudience: state.targetAudience,
    defaultTags: state.defaultTags,
    seoKeywords: state.seoKeywords,
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
    seoTitleOverride: state.seoTitleOverride,
    seoKeywordsOverride: state.seoKeywordsOverride,
    seoBundle: state.seoBundle,
    uploadPack: state.uploadPack,
    coreAudioSrt: state.coreAudioSrt,
    roleConfig: state.roleConfig,
  };

  return {
    data: core,
    checksum: calculateChecksum(core),
  };
};

// ----------------------------------------------------------------------------
// Persist state to localStorage with checksum
// ----------------------------------------------------------------------------
export const savePersistedState = (state: AppCoreState): void => {
  try {
    const snapshot = buildPersistSnapshot(state);
    const payload = JSON.stringify(snapshot);
    const ok = safeStorage.set(STORAGE_KEY, payload);
    if (!ok) throw new Error("localStorage write failed");
  } catch (e) {
    console.error("[AppStore] Failed to persist state:", e);
  }
};

// ----------------------------------------------------------------------------
// Load & validate persisted state
// ----------------------------------------------------------------------------
export const loadPersistedState = (): Partial<AppCoreState> | null => {
  const raw = safeStorage.get(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      !parsed.data ||
      typeof parsed.checksum !== "string"
    ) {
      throw new Error("Invalid format");
    }

    const { data, checksum } = parsed;
    const recalculated = calculateChecksum(data);

    if (checksum !== recalculated) {
      console.warn("[AppStore] Checksum mismatch — resetting session.");
      safeStorage.remove(STORAGE_KEY);
      return null;
    }

    // Migration safeguard
    if (data.version !== SESSION_VERSION) {
      console.info("[AppStore] Migrating session to new version:", SESSION_VERSION);
      const migrated = migrateState(data);
      savePersistedState(migrated as AppCoreState);
      return migrated;
    }

    return data as Partial<AppCoreState>;
  } catch (e) {
    console.error("[AppStore] Failed to parse persisted state:", e);
    safeStorage.remove(STORAGE_KEY);
    return null;
  }
};

// ----------------------------------------------------------------------------
// Migration handler — ensures backward compatibility
// ----------------------------------------------------------------------------
export const migrateState = (data: any): Partial<AppCoreState> => {
  const migrated: Partial<AppCoreState> = { ...data };
  if (!("version" in migrated)) migrated.version = SESSION_VERSION;
  if (!("dailyScriptMode" in migrated)) migrated.dailyScriptMode = "Podcast" as any;
  if (!("useSrtAsCore" in migrated)) migrated.useSrtAsCore = true;
  if (!("seoBundle" in migrated)) migrated.seoBundle = null;
  if (!("uploadPack" in migrated)) migrated.uploadPack = null;
  if (!("coreAudioSrt" in migrated)) migrated.coreAudioSrt = null;
  if (!("roleConfig" in migrated)) {
    migrated.roleConfig = {
      host: { name: "Luna", tone: "warm, clear, patient" },
      coach: { name: "Liam", tone: "helpful, concise, encouraging" },
      characters: [
        { name: "Ava", role: "learner", note: "A2-B1 mistakes" },
        { name: "Sam", role: "clerk", note: "native, simple speech" },
      ],
    };
  }
  return migrated;
};

// ----------------------------------------------------------------------------
// Clear persisted session
// ----------------------------------------------------------------------------
export const clearPersistedState = (): void => {
  safeStorage.remove(STORAGE_KEY);
  console.info("[AppStore] Cleared persisted session.");
};
