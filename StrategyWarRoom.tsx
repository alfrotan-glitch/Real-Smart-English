// components/StrategyWarRoom.tsx
// Robust parsing + A11y + stable rendering + safe Markdown (no linkTarget TS error)

import React, { memo, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import type { PsychologistIcon, SeoIcon, DesignerIcon, AudienceIcon, TrendIcon } from './Icons';

interface StrategyWarRoomProps {
  insightsContent: string;
}

type ExpertKey =
  | 'Title Psychologist'
  | 'Description Strategist'
  | 'Tagging Specialist'
  | 'Viral Thumbnail Designer'
  | 'Technical SEO Specialist'
  | 'Audience Simulation Board'
  | 'Default';

type ExpertMeta = { icon: React.ReactNode; color: string };

const EXPERT_MAP: Record<ExpertKey, ExpertMeta> = {
  'Title Psychologist': { icon: <PsychologistIcon className="w-8 h-8" />, color: 'text-purple-500' },
  'Description Strategist': { icon: <SeoIcon className="w-8 h-8" />, color: 'text-sky-500' },
  'Tagging Specialist': { icon: <SeoIcon className="w-8 h-8" />, color: 'text-sky-500' },
  'Viral Thumbnail Designer': { icon: <DesignerIcon className="w-8 h-8" />, color: 'text-amber-500' },
  'Technical SEO Specialist': { icon: <SeoIcon className="w-8 h-8" />, color: 'text-sky-500' },
  'Audience Simulation Board': { icon: <AudienceIcon className="w-8 h-8" />, color: 'text-teal-500' },
  Default: { icon: <TrendIcon className="w-8 h-8" />, color: 'text-slate-500' },
};

type SectionVM = {
  title: string;
  author: string;
  score: string | null;
  body: string;
  expert: ExpertMeta;
};

// precompiled regex
const SPLIT_RX = /(?:^|\n)---\s*\r?\n/g;
const TITLE_RX = /^###\s*\d+\.\s*(.+?):\s*$/m;
const AUTHOR_RX = /^\*(.+?)\*\s*$/m;
const SCORE_RX = /Impact\s*Score\s*[:(]\s*(\d+\s*\/\s*\d+)\s*\)?/i;
const HEADER_LINE_RX = /^###\s.*$/m;
const STAR_LINE_RX = /^\*.*\*$/m;

function pickExpert(title: string): ExpertMeta {
  const key = (Object.keys(EXPERT_MAP) as ExpertKey[]).find(k => title.includes(k)) ?? 'Default';
  return EXPERT_MAP[key];
}

function parseSections(md: string): SectionVM[] {
  if (!md || typeof md !== 'string') return [];
  const blocks = md.split(SPLIT_RX).slice(1).filter(Boolean);

  return blocks
    .map(raw => {
      const title = (raw.match(TITLE_RX)?.[1] ?? 'Lesson Outline').trim();
      const author = (raw.match(AUTHOR_RX)?.[1] ?? 'AI Council').trim();
      const score = raw.match(SCORE_RX)?.[1]?.replace(/\s+/g, '') ?? null;

      const body = raw
        .replace(HEADER_LINE_RX, '')
        .replace(STAR_LINE_RX, '')
        .replace(SCORE_RX, '')
        .trim();

      const expert = pickExpert(title);
      return { title, author, score, body, expert };
    })
    .filter(s => s.body.length > 0);
}

// TS-safe components override for links (instead of linkTarget prop)
const mdComponents: Components = {
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" />
  ),
};

const StrategyWarRoom: React.FC<StrategyWarRoomProps> = ({ insightsContent }) => {
  const sections = useMemo(() => parseSections(insightsContent), [insightsContent]);

  return (
    <section
      className="p-4 sm:p-6 md:p-8 bg-slate-50 min-h-full"
      aria-labelledby="strategy-war-room-title"
      data-component="strategy-war-room"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center md:text-left">
          <h1 id="strategy-war-room-title" className="text-3xl font-bold text-slate-800">
            Strategy War Room
          </h1>
          <p className="mt-1 text-slate-600">
            Your AI Council&apos;s strategic recommendations for this lesson.
          </p>
        </div>

        {sections.length === 0 ? (
          <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-200 text-slate-600 text-sm">
            هیچ سکشنی پیدا نشد. محتوا را با جداکننده <code>---</code> و هدینگ‌هایی مثل
            <code className="ml-1">### 1. Title Psychologist:</code> بده.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map(({ title, score, body, expert }, idx) => (
              <article
                key={`${title}-${idx}`}
                className="bg-white rounded-2xl shadow-lg border border-slate-200/80 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                aria-labelledby={`section-title-${idx}`}
              >
                <header className="p-5 border-b border-slate-200 flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <span className={expert.color} aria-hidden="true">
                      {expert.icon}
                    </span>
                    <h2 id={`section-title-${idx}`} className="text-lg font-bold text-slate-800">
                      {title}
                    </h2>
                  </div>
                  {score && (
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs text-slate-500">Impact Score</p>
                      <p className="font-bold text-indigo-600">{score}</p>
                    </div>
                  )}
                </header>

                <div className="p-5 flex-grow prose prose-sm max-w-none prose-slate text-slate-700">
                  {/* بدون HTML خام */}
                  <ReactMarkdown skipHtml components={mdComponents}>
                    {body}
                  </ReactMarkdown>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default memo(StrategyWarRoom);
