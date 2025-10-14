// components/ControlPanel.tsx
// Final, production-grade. React 19 / TS5 / Vite 7. ESM-only. English-only inside code.

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  LanguageLevel,
  PodcastStyle,
  PodcastMode,
  MonologueStyle,
  TeachingTechnique,
  PodcastPacing,
  PodcastInformality,
  OverlayIntensity,
  EmotionalArc,
  HookStyle,
  PodcastDuration,
  type Tab,
} from "../types";
import { useAppStore } from "../store/appStore";
import { suggestTopics } from "../services/geminiService";
import { PRESETS } from "../services/promptService";
import { DailyScriptMode } from "../types/dailyScript";

import {
  SuggestIcon,
  CoachIcon,
  PodcastSettingsIcon,
  TopicIcon,
  BrainIcon,
  SpinnerIcon,
  PlusCircleIcon,
  DnaIcon,
} from "./Icons";
import { Divider, ToggleRow, InputField, TextareaField, SelectField } from "./FormControls";
import PrismCard from "./PrismCard";
import { srtToPlainText } from "../utils/srt";

/* ===============================
   Helpers
=============================== */

const normalize = (s?: string) => (s ?? "").replace(/\s+/g, " ").trim();
const isDiff = (a?: string, b?: string) => normalize(a) !== normalize(b);

function getApiErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "Unknown error";
  }
}

/* ===============================
   Monologue personas
=============================== */

const MONOLOGUE_PERSONAS: Record<MonologueStyle, string> = {
  [MonologueStyle.LearningCoach]: "Alex: A clear, patient, and encouraging coach.",
  [MonologueStyle.InvestigativeJournalist]: "Sam: A curious, methodical, and compelling investigative journalist.",
  [MonologueStyle.GuidedMeditation]: "Kai: A calm, soothing, and present guide.",
  [MonologueStyle.FiresideChat]: "Morgan: A warm, reflective, and intimate storyteller.",
  [MonologueStyle.StandUpComedian]: "Riley: An energetic, witty, and observant comedian.",
  [MonologueStyle.MotivationalSpeaker]: "Jordan: A passionate, dynamic, and inspiring speaker.",
  [MonologueStyle.ScaryStoryteller]: "Casey: A suspenseful, deliberate, and atmospheric narrator.",
  [MonologueStyle.RomanticStoryteller]: "Jules: A heartfelt, emotive, and sincere storyteller.",
  [MonologueStyle.HistoricalDoc]: "Dr. Avery: A knowledgeable, authoritative, and engaging documentary narrator.",
  [MonologueStyle.NewsReport]: "Cameron: A formal, objective, and clear news anchor.",
  [MonologueStyle.CharacterMonologue]:
    '[Character Name]: Varies. Example: "Marlowe: A world-weary private detective..."',
  [MonologueStyle.PoetrySlam]: "Phoenix: An artistic, rhythmic, and passionate spoken-word poet.",
};

/* ===============================
   Component
=============================== */

const ControlPanel: React.FC = () => {
  const {
    // core config
    level,
    setLevel,
    topic,
    setTopic,

    // dialogue personas
    host1Persona,
    setHost1Persona,
    host2Persona,
    setHost2Persona,
    host1Name,
    setHost1Name,
    host2Name,
    setHost2Name,
    hostRelationship,
    setHostRelationship,

    // style & pacing
    podcastPacing,
    setPodcastPacing,
    podcastInformality,
    setPodcastInformality,
    podcastStyle,
    setPodcastStyle,
    podcastMode,
    setPodcastMode,
    monologueStyle,
    setMonologueStyle,
    monologueHostName,
    setMonologueHostName,
    overlayIntensity,
    setOverlayIntensity,
    podcastBackstory,
    setPodcastBackstory,
    podcastDuration,
    setPodcastDuration,

    // production toggles
    generateShowNotes,
    setGenerateShowNotes,
    generateSocialMediaTeaser,
    setGenerateSocialMediaTeaser,

    // advanced
    emotionalArc,
    setEmotionalArc,
    hookStyle,
    setHookStyle,
    realismIntensity,
    setRealismIntensity,
    presetId,
    setPresetId,
    teachingTechnique,
    setTeachingTechnique,
    synthesizeLearnerDNA,

    // daily script engine
    dailyScriptMode,
    setDailyScriptMode,
    isDailyScriptEngineEnabled,
    setIsDailyScriptEngineEnabled,

    // supplemental content
    supplementalContent,
    setSupplementalContent,
    useSrtAsCore,
    setUseSrtAsCore,

    // SEO overrides
    seoTitleOverride,
    setSeoTitleOverride,
    seoKeywordsOverride,
    setSeoKeywordsOverride,
    generateSeo,
  } = useAppStore();

  const levels = useMemo(() => Object.values(LanguageLevel), []);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isSynthesizingDNA, setIsSynthesizingDNA] = useState(false);
  const [seoBusy, setSeoBusy] = useState(false);
  const [srtName, setSrtName] = useState("");

  const hasSupplementalContent = (supplementalContent ?? "").trim().length > 0;

  /* ===============================
     Presets
  =============================== */
  const presetOptions = useMemo(
    () => [
      { value: "custom", label: "Custom Configuration" },
      ...Object.values(PRESETS).map((p) => ({ value: p.id, label: p.label })),
    ],
    []
  );

  /* ===============================
     Effects: persona synchronization
  =============================== */

  // Keep persona synced in monologue mode
  useEffect(() => {
    if (podcastMode !== PodcastMode.Monologue) return;
    const template = MONOLOGUE_PERSONAS[monologueStyle];
    if (!template) return;

    const [placeholder] = template.split(":");
    let nextPersona = template.replace(placeholder, monologueHostName || "Host");
    if (monologueStyle === MonologueStyle.CharacterMonologue) {
      nextPersona = nextPersona.replace("Marlowe", monologueHostName || "Character");
    }

    if (isDiff(host1Persona, nextPersona)) {
      setHost1Persona(nextPersona);
    }
  }, [podcastMode, monologueStyle, monologueHostName, host1Persona, setHost1Persona]);

  // Keep host names reflected in dialogue personas (host 1)
  useEffect(() => {
    if (podcastMode !== PodcastMode.Dialogue) return;
    const personaStr = String(host1Persona || "");
    const [, ...rest] = personaStr.split(":");
    const desc = rest.join(":").trim();
    const nextPersona = host1Name ? `${host1Name}: ${desc || "A thoughtful guide."}` : personaStr;
    if (isDiff(host1Persona, nextPersona)) {
      setHost1Persona(nextPersona);
    }
  }, [podcastMode, host1Name, host1Persona, setHost1Persona]);

  // Keep host names reflected in dialogue personas (host 2)
  useEffect(() => {
    if (podcastMode !== PodcastMode.Dialogue) return;
    const personaStr = String(host2Persona || "");
    const [, ...rest] = personaStr.split(":");
    const desc = rest.join(":").trim();
    const nextPersona = host2Name ? `${host2Name}: ${desc || "A curious learner."}` : personaStr;
    if (isDiff(host2Persona, nextPersona)) {
      setHost2Persona(nextPersona);
    }
  }, [podcastMode, host2Name, host2Persona, setHost2Persona]);

  /* ===============================
     Event handlers
  =============================== */

  const onHost1PersonaBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      const [name] = val.split(":");
      const nextName = normalize(name);
      if (nextName && isDiff(nextName, host1Name)) setHost1Name(nextName);
      if (isDiff(host1Persona, val)) setHost1Persona(val);
    },
    [host1Name, host1Persona, setHost1Name, setHost1Persona]
  );

  const onHost2PersonaBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      const [name] = val.split(":");
      const nextName = normalize(name);
      if (nextName && isDiff(nextName, host2Name)) setHost2Name(nextName);
      if (isDiff(host2Persona, val)) setHost2Persona(val);
    },
    [host2Name, host2Persona, setHost2Name, setHost2Persona]
  );

  const handleSuggestTopics = useCallback(async () => {
    if (isSuggesting) return;
    setIsSuggesting(true);
    setSuggestionError(null);
    setSuggestions([]);
    try {
      const topics = await suggestTopics(level);
      setSuggestions(topics || []);
    } catch (err) {
      setSuggestionError("Could not fetch suggestions.");
      console.error("suggestTopics failed:", getApiErrorMessage(err));
    } finally {
      setIsSuggesting(false);
    }
  }, [isSuggesting, level]);

  const handleSuggestionClick = useCallback(
    (s: string) => {
      setTopic(s);
      setSuggestions([]);
    },
    [setTopic]
  );

  const handleSynthesizeDNA = useCallback(async () => {
    try {
      setIsSynthesizingDNA(true);
      await synthesizeLearnerDNA();
    } finally {
      setIsSynthesizingDNA(false);
    }
  }, [synthesizeLearnerDNA]);

  const handleSrtUpload = useCallback(
    async (file?: File) => {
      if (!file) return;
      setSrtName(file.name);
      try {
        const raw = await file.text();
        const cleaned = srtToPlainText(raw);
        setSupplementalContent(cleaned);
        setUseSrtAsCore(true);
      } catch (e) {
        console.error("SRT parsing failed:", getApiErrorMessage(e));
      }
    },
    [setSupplementalContent, setUseSrtAsCore]
  );

  const onGenerateSeo = useCallback(async () => {
    setSeoBusy(true);
    try {
      await generateSeo();
    } finally {
      setSeoBusy(false);
    }
  }, [generateSeo]);

  /* ===============================
     Render
  =============================== */

  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PrismCard title="Lesson Configuration" icon={<TopicIcon className="w-6 h-6 text-accent" />}>
          <SelectField
            id="language-level"
            label="Language Level (CEFR)"
            value={level}
            onChange={(v) => setLevel(v as LanguageLevel)}
            options={levels.map((l) => ({ value: l, label: l }))}
          />

          <div className={hasSupplementalContent ? "opacity-50 pointer-events-none" : ""}>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="lesson-topic" className="block text-sm font-medium text-text-secondary">
                Lesson Topic
              </label>
              <button
                type="button"
                onClick={handleSuggestTopics}
                disabled={isSuggesting || hasSupplementalContent}
                className="text-sm font-medium text-brand-from hover:text-brand-to disabled:text-text-secondary/50 flex items-center"
                aria-label="Suggest topics"
              >
                <SuggestIcon className={`h-4 w-4 mr-1 ${isSuggesting ? "animate-spin" : ""}`} />
                {isSuggesting ? "Suggesting..." : "Suggest"}
              </button>
            </div>
            <InputField
              id="lesson-topic"
              label=""
              value={topic}
              onChange={setTopic}
              placeholder="e.g., 'A Trip to the Mountains'"
              className="bg-glass/50 border-white/20 rounded-button"
            />
            {suggestionError && <p className="text-xs text-danger mt-1">{suggestionError}</p>}
            {suggestions.length > 0 && (
              <div className="mt-2 p-3 bg-brand-from/10 border border-brand-from/20 rounded-lg">
                <ul className="space-y-1">
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => handleSuggestionClick(s)}
                        className="w-full text-left text-sm text-brand-from hover:bg-brand-from/20 p-1.5 rounded-md transition-colors"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Divider />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary">Upload SRT (use as content core)</label>
            <input
              type="file"
              accept=".srt"
              onChange={(e) => void handleSrtUpload(e.target.files?.[0] as File | undefined)}
              className="w-full text-sm text-text-secondary file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border file:border-brand-from/40 file:bg-brand-from/10 hover:file:bg-brand-from/20"
            />
            {srtName && <p className="text-xs text-text-secondary/70">Loaded: {srtName}</p>}
            <ToggleRow
              label="Use SRT as Core"
              description="Treat the uploaded SRT as the primary source for keywords, chapters, and script shaping."
              isOn={!!useSrtAsCore}
              onToggle={() => setUseSrtAsCore(!useSrtAsCore)}
            />
            <TextareaField
              id="supplemental-content"
              label="Core Text (auto-filled from SRT)"
              value={supplementalContent}
              onChange={setSupplementalContent}
              placeholder="Paste or auto-filled transcript."
              rows={4}
            />
          </div>

          <Divider />

          <div className="grid grid-cols-1 gap-3">
            <InputField
              id="seo-title-override"
              label="SEO Title Override (optional)"
              value={seoTitleOverride || ""}
              onChange={setSeoTitleOverride}
              placeholder="Override auto title (≤ 60 chars)"
            />
            <InputField
              id="seo-keywords-override"
              label="SEO Keywords Override (comma-separated)"
              value={seoKeywordsOverride || ""}
              onChange={setSeoKeywordsOverride}
              placeholder="e.g., english podcast, travel phrases, beginner A2"
            />
            <button
              type="button"
              onClick={onGenerateSeo}
              disabled={seoBusy}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-brand-from/50 text-sm font-medium text-brand-from bg-brand-from/10 hover:bg-brand-from/20 disabled:opacity-50"
              aria-label="Generate SEO"
            >
              {seoBusy ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <PlusCircleIcon className="w-5 h-5 mr-2" />}
              {seoBusy ? "Generating SEO…" : "Generate SEO from Current Context"}
            </button>
          </div>
        </PrismCard>

        <PrismCard title="Podcast & Host Setup" icon={<CoachIcon className="w-6 h-6 text-accent" />}>
          <SelectField
            id="podcast-mode"
            label="Podcast Format"
            value={podcastMode}
            onChange={(v) => setPodcastMode(v as PodcastMode)}
            options={Object.values(PodcastMode).map((m) => ({ value: m, label: m }))}
            disabled={isDailyScriptEngineEnabled}
          />

          {podcastMode === PodcastMode.Monologue ? (
            <>
              <InputField
                id="monologue-host-name"
                label="Host Name"
                value={monologueHostName}
                onChange={setMonologueHostName}
                placeholder="e.g., Luna"
              />
              <SelectField
                id="monologue-style"
                label="Monologue Style"
                value={monologueStyle}
                onChange={(v) => setMonologueStyle(v as MonologueStyle)}
                options={Object.values(MonologueStyle).map((s) => ({ value: s, label: s }))}
              />
              <TextareaField
                id="host1-persona"
                label="Host Persona"
                value={host1Persona}
                onChange={setHost1Persona}
                onBlur={onHost1PersonaBlur}
                placeholder="e.g., Luna: A warm guide..."
              />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  id="dialogue-host1-name"
                  label="Host 1 Name"
                  value={host1Name}
                  onChange={setHost1Name}
                  placeholder="e.g., Luna"
                />
                <InputField
                  id="dialogue-host2-name"
                  label="Host 2 Name"
                  value={host2Name}
                  onChange={setHost2Name}
                  placeholder="e.g., Liam"
                />
              </div>
              <TextareaField
                id="host1-persona"
                label="Host 1 (Guide) Persona"
                value={host1Persona}
                onChange={setHost1Persona}
                onBlur={onHost1PersonaBlur}
                placeholder="e.g., Luna: A warm guide..."
              />
              <TextareaField
                id="host2-persona"
                label="Host 2 (Learner) Persona"
                value={host2Persona}
                onChange={setHost2Persona}
                onBlur={onHost2PersonaBlur}
                placeholder="e.g., Liam: A playful learner..."
              />
            </>
          )}

          <Divider />

          <TextareaField
            id="host-relationship"
            label="Host Relationship"
            value={hostRelationship}
            onChange={setHostRelationship}
            placeholder="e.g., Luna is Liam's patient older sister..."
            rows={2}
            disabled={podcastMode === PodcastMode.Monologue}
          />
          <TextareaField
            id="podcast-backstory"
            label="Podcast Backstory/Universe"
            value={podcastBackstory}
            onChange={setPodcastBackstory}
            placeholder="Add shared context for hosts to reference."
            rows={2}
          />
        </PrismCard>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PrismCard title="Style & Delivery" icon={<PodcastSettingsIcon className="w-6 h-6 text-accent" />}>
          <SelectField
            id="podcast-style"
            label="Podcast Style"
            value={podcastStyle}
            onChange={(v) => setPodcastStyle(v as PodcastStyle)}
            options={Object.values(PodcastStyle).map((s) => ({ value: s, label: s }))}
            disabled={isDailyScriptEngineEnabled}
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              id="podcast-duration"
              label="Target Duration"
              value={String(podcastDuration)}
              onChange={(v) => setPodcastDuration(Number(v) as PodcastDuration)}
              options={[5, 10, 15, 30, 45, 60].map((d) => ({ value: String(d), label: `${d} min` }))}
            />
            <SelectField
              id="podcast-pacing"
              label="Pacing"
              value={podcastPacing}
              onChange={(v) => setPodcastPacing(v as PodcastPacing)}
              options={["Very Slow", "Slow", "Natural"].map((o) => ({ value: o, label: o }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              id="emotional-arc"
              label="Emotional Arc"
              value={emotionalArc}
              onChange={(v) => setEmotionalArc(v as EmotionalArc)}
              options={["Educational", "Inspirational", "Comedic", "Suspenseful"].map((o) => ({
                value: o,
                label: o,
              }))}
              disabled={isDailyScriptEngineEnabled}
            />
            <SelectField
              id="hook-style"
              label="Hook Style"
              value={hookStyle}
              onChange={(v) => setHookStyle(v as HookStyle)}
              options={["None", "Question", "Bold Statement", "Story"].map((o) => ({ value: o, label: o }))}
              disabled={isDailyScriptEngineEnabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              id="podcast-informality"
              label="Informality"
              value={podcastInformality}
              onChange={(v) => setPodcastInformality(v as PodcastInformality)}
              options={["Very Informal", "Informal", "Slightly Formal"].map((o) => ({ value: o, label: o }))}
            />
            <SelectField
              id="overlay-intensity"
              label="Dialogue Overlap"
              value={overlayIntensity}
              onChange={(v) => setOverlayIntensity(v as OverlayIntensity)}
              options={["Low", "Medium", "High"].map((o) => ({ value: o, label: o }))}
              disabled={podcastMode === PodcastMode.Monologue || isDailyScriptEngineEnabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary">Realism Intensity</label>
            <p className="text-xs text-text-secondary/80 mb-3">
              Controls the amount of naturalism from clean script to hyper realistic.
            </p>
            <input
              id="realism-intensity"
              type="range"
              min="0"
              max="100"
              step="1"
              value={realismIntensity}
              onChange={(e) => setRealismIntensity(Number(e.target.value))}
              className="w-full h-2 bg-slate-100/20 rounded-lg appearance-none cursor-pointer"
              disabled={isDailyScriptEngineEnabled}
            />
            <div className="flex justify-between text-xs text-text-secondary/80 mt-1">
              <span>Clean & Scripted</span>
              <span>Hyper-Realistic</span>
            </div>
          </div>
        </PrismCard>

        <PrismCard title="Production & Engines" icon={<BrainIcon className="w-6 h-6 text-accent" />}>
          <div className="p-3 bg-white/5 rounded-lg space-y-3">
            <p className="text-sm font-medium text-text-secondary">Production Add-ons</p>
            <ToggleRow
              label="Generate Show Notes"
              isOn={generateShowNotes}
              onToggle={() => setGenerateShowNotes(!generateShowNotes)}
            />
            <ToggleRow
              label="Generate Social Media Teaser"
              isOn={generateSocialMediaTeaser}
              onToggle={() => setGenerateSocialMediaTeaser(!generateSocialMediaTeaser)}
            />
          </div>

          <Divider />

          <div className="space-y-3">
            <ToggleRow
              label="Enable Daily Script Engine"
              description="Use structured pedagogical generator"
              isOn={isDailyScriptEngineEnabled}
              onToggle={() => setIsDailyScriptEngineEnabled(!isDailyScriptEngineEnabled)}
            />
            <SelectField
              id="daily-script-mode"
              label="Engine Mode"
              value={dailyScriptMode}
              onChange={(v) => setDailyScriptMode(v as DailyScriptMode)}
              options={Object.values(DailyScriptMode).map((m) => ({ value: m, label: m }))}
              disabled={!isDailyScriptEngineEnabled}
            />
          </div>

          <Divider />

          <div>
            <p className="text-sm font-medium text-text-secondary">Learner DNA</p>
            <p className="text-xs text-text-secondary/80 mb-2 bg-brand-to/10 p-2 rounded-md border border-brand-to/20">
              <strong>Strategic Personalization:</strong> The AI analyzes all learner data to create a deep profile.
            </p>
            <button
              type="button"
              onClick={handleSynthesizeDNA}
              disabled={isSynthesizingDNA}
              className="w-full flex items-center justify-center px-4 py-2 border border-brand-from/50 text-sm font-medium rounded-lg text-brand-from bg-brand-from/10 hover:bg-brand-from/20 disabled:opacity-50"
              aria-label="Synthesize or update DNA"
            >
              {isSynthesizingDNA ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <DnaIcon className="w-5 h-5 mr-2" />}
              {isSynthesizingDNA ? "Analyzing..." : "Synthesize / Update DNA"}
            </button>
          </div>
        </PrismCard>
      </div>
    </div>
  );
};

export default ControlPanel;
