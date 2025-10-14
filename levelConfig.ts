// src/types/levelConfig.ts

import type { OverlayIntensity } from "./index";

export type LevelId = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LevelConfig {
  vocabBand: string;
  avgSentenceLen: number;
  maxSentenceLen: number;
  allowedTenses: string[];
  idiomDensityPer100Lines: number;
  fillerPer100Turns: [number, number];
  backchannelEveryN: number;
  selfRepairPer10min: number;
  callbacksPer10min: number;
  sfxPer10min: [number, number];
  paceWPM: number;
  overlapIntensity: OverlayIntensity;
  storyWords: number;
  exercises: {
    readingMCQ: number;
    readingFill: number;
    listeningMCQ: number;
    quizMCQ: number;
    quizTF: number;
    quizFill: number;
  };
}

export const LEVELS_VERSION = "2025.10.04";

export const LEVEL_ORDER: readonly LevelId[] = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const LEVELS = {
  A1: {
    vocabBand: "Top 1000",
    avgSentenceLen: 7,
    maxSentenceLen: 11,
    allowedTenses: ["Present Simple", "There is/are", "Can (ability)"],
    idiomDensityPer100Lines: 0,
    fillerPer100Turns: [8, 12],
    backchannelEveryN: 7,
    selfRepairPer10min: 1,
    callbacksPer10min: 1,
    sfxPer10min: [2, 3],
    paceWPM: 105,
    overlapIntensity: "Low",
    storyWords: 180,
    exercises: {
      readingMCQ: 3,
      readingFill: 2,
      listeningMCQ: 3,
      quizMCQ: 3,
      quizTF: 2,
      quizFill: 2,
    },
  },
  A2: {
    vocabBand: "Top 2000",
    avgSentenceLen: 9,
    maxSentenceLen: 14,
    allowedTenses: ["Present Simple", "Present Continuous", "Past Simple (regular)"],
    idiomDensityPer100Lines: 1,
    fillerPer100Turns: [8, 12],
    backchannelEveryN: 7,
    selfRepairPer10min: 1,
    callbacksPer10min: 1,
    sfxPer10min: [2, 3],
    paceWPM: 115,
    overlapIntensity: "Low",
    storyWords: 250,
    exercises: {
      readingMCQ: 4,
      readingFill: 2,
      listeningMCQ: 3,
      quizMCQ: 4,
      quizTF: 3,
      quizFill: 2,
    },
  },
  B1: {
    vocabBand: "Top 3000",
    avgSentenceLen: 11,
    maxSentenceLen: 18,
    allowedTenses: ["All basics", "Past Continuous", "Future (will/going to)"],
    idiomDensityPer100Lines: 2,
    fillerPer100Turns: [6, 10],
    backchannelEveryN: 8,
    selfRepairPer10min: 2,
    callbacksPer10min: 2,
    sfxPer10min: [2, 3],
    paceWPM: 130,
    overlapIntensity: "Medium",
    storyWords: 350,
    exercises: {
      readingMCQ: 4,
      readingFill: 3,
      listeningMCQ: 4,
      quizMCQ: 5,
      quizTF: 3,
      quizFill: 3,
    },
  },
  B2: {
    vocabBand: "Top 4000",
    avgSentenceLen: 14,
    maxSentenceLen: 22,
    allowedTenses: ["Complex aspects", "Conditionals (0–2)", "Modals (range)"],
    idiomDensityPer100Lines: 3,
    fillerPer100Turns: [5, 8],
    backchannelEveryN: 9,
    selfRepairPer10min: 2,
    callbacksPer10min: 3,
    sfxPer10min: [1, 2],
    paceWPM: 145,
    overlapIntensity: "Medium",
    storyWords: 450,
    exercises: {
      readingMCQ: 5,
      readingFill: 3,
      listeningMCQ: 5,
      quizMCQ: 6,
      quizTF: 3,
      quizFill: 3,
    },
  },
  C1: {
    vocabBand: "Academic/News common",
    avgSentenceLen: 17,
    maxSentenceLen: 26,
    allowedTenses: ["Full range", "Conditionals (0–3)", "Reduced clauses"],
    idiomDensityPer100Lines: 4,
    fillerPer100Turns: [3, 6],
    backchannelEveryN: 10,
    selfRepairPer10min: 3,
    callbacksPer10min: 4,
    sfxPer10min: [1, 2],
    paceWPM: 160,
    overlapIntensity: "Medium",
    storyWords: 600,
    exercises: {
      readingMCQ: 6,
      readingFill: 3,
      listeningMCQ: 6,
      quizMCQ: 7,
      quizTF: 3,
      quizFill: 3,
    },
  },
  C2: {
    vocabBand: "Broad/Native-like",
    avgSentenceLen: 20,
    maxSentenceLen: 30,
    allowedTenses: ["Full range", "Nominalisations", "Cohesive devices"],
    idiomDensityPer100Lines: 5,
    fillerPer100Turns: [2, 4],
    backchannelEveryN: 12,
    selfRepairPer10min: 3,
    callbacksPer10min: 4,
    sfxPer10min: [1, 2],
    paceWPM: 170,
    overlapIntensity: "High",
    storyWords: 800,
    exercises: {
      readingMCQ: 6,
      readingFill: 4,
      listeningMCQ: 6,
      quizMCQ: 8,
      quizTF: 4,
      quizFill: 4,
    },
  },
} as const satisfies Record<LevelId, LevelConfig>;

export const isLevelId = (x: unknown): x is LevelId =>
  typeof x === "string" && (LEVEL_ORDER as readonly string[]).includes(x);

export const getLevelConfig = (level: LevelId): LevelConfig => LEVELS[level];

const djb2 = (str: string): number => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return h >>> 0;
};

const stableStringify = (obj: unknown): string => {
  const seen = new WeakSet<object>();
  const walk = (v: any): any => {
    if (v && typeof v === "object") {
      if (seen.has(v)) return null;
      seen.add(v);
      if (Array.isArray(v)) return v.map(walk);
      return Object.keys(v)
        .sort()
        .reduce<Record<string, any>>((acc, k) => {
          acc[k] = walk(v[k]);
          return acc;
        }, {});
    }
    return v;
  };
  return JSON.stringify(walk(obj));
};

const LEVELS_CANON = `${LEVELS_VERSION}::${stableStringify(LEVELS)}`;

export const LEVELS_CHECKSUM: string = djb2(LEVELS_CANON).toString(36);

export const validateLevelsIntegrity = (version: string, checksum: string): boolean =>
  version === LEVELS_VERSION && checksum === LEVELS_CHECKSUM;
