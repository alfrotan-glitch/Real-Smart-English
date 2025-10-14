// components/GenerationCouncilView.tsx
import React, { memo, useEffect, useMemo, useRef } from 'react';
import type { useAppStore } from '../store/appStore';
import type { SectionKey } from '../types/index';
import type { StorytellerIcon, EducatorIcon, WriterIcon, DirectorIcon, ProducerIcon } from './Icons';

/* =========================
   Types
========================= */
// Avoid JSX namespace by using React types
type ExpertId = 'storyteller' | 'educator' | 'writer' | 'director' | 'producer';
type IconFC = React.ComponentType<{ className?: string }>;

/* =========================
   Static config (no re-creation)
========================= */
const EXPERTS: ReadonlyArray<{ id: ExpertId; name: string; Icon: IconFC }> = [
  { id: 'storyteller', name: 'Storyteller', Icon: StorytellerIcon },
  { id: 'educator', name: 'Educator', Icon: EducatorIcon },
  { id: 'writer', name: 'Comedy Writer', Icon: WriterIcon },
  { id: 'director', name: 'Art Director', Icon: DirectorIcon },
  { id: 'producer', name: 'Producer', Icon: ProducerIcon },
] as const;

const SECTION_TO_EXPERT: Readonly<Record<SectionKey, ExpertId>> = {
  // Primary anchors
  READING_SECTION: 'storyteller',
  QUIZ_SECTION: 'educator',
  PODCAST_SCRIPT: 'writer',
  DESIGN_SUGGESTIONS: 'director',
  SHOW_NOTES: 'producer',
  // Mapped aliases
  LISTENING_SECTION: 'writer',
  SPEAKING_SECTION: 'writer',
  SOCIAL_MEDIA_TEASER: 'writer',
  WRITING_SECTION: 'educator',
  SUMMARY_SECTION: 'educator',
  TITLE: 'producer',
  OVERVIEW: 'producer',
};

/* =========================
   Component
========================= */
export const GenerationCouncilView = memo(function GenerationCouncilView() {
  // Select minimal slices to reduce re-renders
  const currentlyGeneratingSection = useAppStore((s) => s.currentlyGeneratingSection);
  const rawContent = useAppStore((s) => s.rawContent);

  const liveOutputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    const el = liveOutputRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [rawContent]);

  const activeExpertId = useMemo<ExpertId | undefined>(() => {
    if (!currentlyGeneratingSection) return undefined;
    return SECTION_TO_EXPERT[currentlyGeneratingSection];
  }, [currentlyGeneratingSection]);

  return (
    <div className="flex flex-col h-full p-6 sm:p-8 bg-slate-50 animate-fade-in">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
        The AI Council is Assembling Your Lesson...
      </h2>
      <p className="text-slate-600 mt-2">
        Watch our team of AI experts collaborate in real-time to build your content.
      </p>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {EXPERTS.map(({ id, name, Icon }) => {
          const isActive = activeExpertId === id;
          return (
            <div
              key={id}
              className={`flex flex-col items-center p-4 rounded-xl border-2 ${
                isActive ? 'bg-white shadow-lg border-indigo-500' : 'bg-slate-100 border-transparent'
              }`}
              aria-current={isActive ? 'true' : 'false'}
            >
              <div className={`relative ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                <Icon className="w-8 h-8" />
                {isActive && (
                  <span
                    className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"
                    aria-hidden="true"
                  />
                )}
              </div>
              <p className={`mt-2 text-sm font-bold ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                {name}
              </p>
              {isActive && <p className="text-xs text-indigo-500">Working...</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex-grow flex flex-col min-h-0">
        <p className="text-sm font-semibold text-slate-600 mb-2">Live AI Output:</p>
        <div
          ref={liveOutputRef}
          className="bg-slate-900 text-white font-mono text-xs rounded-lg p-4 flex-grow overflow-y-auto"
          aria-live="polite"
        >
          <pre className="whitespace-pre-wrap break-words">{rawContent}</pre>
        </div>
      </div>
    </div>
  );
});

export default GenerationCouncilView;
