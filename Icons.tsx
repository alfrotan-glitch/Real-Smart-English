// components/Icons.tsx
// Unified, low-noise icon factory. Consistent defaults, tree-shake friendly.

import React, { memo } from 'react';
import type { IconShell } from './IconShell';

type IconProps = React.SVGProps<SVGSVGElement>;
type IconFC = React.FC<IconProps>;

const makeIcon = (
  render: (props: IconProps) => React.ReactNode,
  shellDefaults?: Partial<IconProps>
): IconFC =>
  memo(function Icon(props) {
    return (
      <IconShell {...shellDefaults} {...props}>
        {render(props)}
      </IconShell>
    );
  });

/* ===================== Icons ===================== */

export const LogoIcon = makeIcon(() => (
  <>
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" opacity="0.4" />
    <path d="M2 12l10 5 10-5-10-5-10 5z" />
  </>
), { fill: 'currentColor' });

export const GenerateIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
), { stroke: 'currentColor' });

export const LevelIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
), { stroke: 'currentColor' });

export const TopicIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
), { stroke: 'currentColor' });

export const DownloadIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
), { stroke: 'currentColor' });

export const ErrorIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
), { stroke: 'currentColor' });

export const InfoIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
), { stroke: 'currentColor' });

export const SuggestIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
), { stroke: 'currentColor' });

export const RemoveHighlightIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18.364 18.364l-12-12m12 0l-12 12" />
), { stroke: 'currentColor' });

export const EditIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
), { stroke: 'currentColor' });

export const SaveIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
), { stroke: 'currentColor' });

export const NewSessionIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
), { stroke: 'currentColor' });

export const GlossaryIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
), { stroke: 'currentColor' });

export const CoverImageIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
), { stroke: 'currentColor' });

export const CheckCircleIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
), { stroke: 'currentColor' });

export const XCircleIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
), { stroke: 'currentColor' });

export const BoldIcon = makeIcon(() => (
  <path d="M13.5 15.5H10V12.5H13.5C14.3284 12.5 15 13.1716 15 14C15 14.8284 14.3284 15.5 13.5 15.5ZM13.25 10.5H10V7.5H13.25C14.2165 7.5 15 8.2835 15 9.25C15 10.2165 14.2165 10.5 13.25 10.5ZM8 5.5V18.5H14.25C16.3211 18.5 18 16.8211 18 14.75C18 13.2386 17.1147 11.9346 15.8192 11.2332C16.5569 10.5549 17 9.559 17 8.5C17 6.43249 15.3175 4.75 13.25 4.75H8V5.5Z" />
), { fill: 'currentColor' });

export const ItalicIcon = makeIcon(() => (
  <path d="M10 5H15V8H13.1667L11.5 16H13V19H8V16H9.83333L11.5 8H10V5Z" />
), { fill: 'currentColor' });

export const ListUlIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
), { stroke: 'currentColor' });

export const ListOlIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
), { stroke: 'currentColor' });

export const HeadingIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 4v16M18 4v16M8 12h8" />
), { stroke: 'currentColor' });

export const PlayIcon = makeIcon(() => <path d="M8 5v14l11-7z" />, { fill: 'currentColor' });
export const PauseIcon = makeIcon(() => <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />, { fill: 'currentColor' });
export const StopIcon = makeIcon(() => <path d="M6 6h12v12H6z" />, { fill: 'currentColor' });

export const SpeakerIcon = makeIcon(() => (
  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
), { fill: 'currentColor' });

export const TrendIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
), { stroke: 'currentColor' });

export const BookletIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
), { stroke: 'currentColor' });

export const PodcastIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
), { stroke: 'currentColor' });

export const PodcastSettingsIcon = makeIcon(() => (
  <>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.39.44 1.022.12 1.45l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.427.27 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.78.93l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.855-.142-1.205.108l-.737.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.15-.894Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </>
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const PlaylistIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const CoachIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const TrashIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0  0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0  0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0  0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0  0 0-7.5 0" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const ExportIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0  0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const CopyIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0  0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0  0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0  0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0  0 1-1.125-1.125v-9.25m9.375 2.25c.621 0 1.125.504 1.125 1.125v3.375" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const MarkdownIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0  1 1-18 0 9 9 0  1 1 18 0Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const TextFileIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const ImprovIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0  0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0  0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0  0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0  0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0  0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0  0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0  0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0  0 0-2.456 2.456Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const ChannelIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5v-.75a7.5 7.5 0  0 0-7.5-7.5H4.5m0-6.75h.75c7.28 0 13.125 5.845 13.125 13.125v.75m-4.5-15.75a9 9 0  0 1 9 9v.75M4.5 19.5h-.75a2.25 2.25 0  0 1-2.25-2.25v-10.5a2.25 2.25 0  0 1 2.25-2.25h1.5a2.25 2.25 0  0 1 2.25 2.25v1.5m-4.5-.75a.75.75 0  0 1 .75.75v3.75a.75.75 0  0 1-.75.75H3.75a.75.75 0  0 1-.75-.75v-3.75a.75.75 0  0 1 .75-.75h.75Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const ChevronDownIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const DocumentTextIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0  0 0-3.375-3.375h-1.5A1.125 1.125 0  0 1 13.5 7.125v-1.5a3.375 3.375 0  0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0  0 0-9-9Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const UploadIcon = ExportIcon; // same glyph

export const ClipboardListIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0  0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0  0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0  0 0 .75-.75 2.25 2.25 0  0 0-.1-.664m-5.8 0A2.251 2.251 0  0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const SpinnerIcon = makeIcon((props) => (
  <>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </>
), { className: 'animate-spin ' });

export const PendingIcon = makeIcon(() => (
  <>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" opacity={0.2}/>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={1.75} strokeDasharray="4 4" />
  </>
), { stroke: 'currentColor' });

export const BrainIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.475 2.118A5.25 5.25 0 0 0 5.25 21a5.25 5.25 0 0 0 5.5-5.25c0-1.28-.46-2.472-1.22-3.378M9.53 16.122a2.25 2.25 0 0 1 2.475 2.118A5.25 5.25 0 0 1 18.75 21a5.25 5.25 0 0 1-5.5-5.25c0-1.28.46-2.472 1.22-3.378m0 0a2.25 2.25 0 0 0-2.475-2.118A5.25 5.25 0 0 0 5.25 3a5.25 5.25 0 0 0-5.5 5.25c0 1.28.46 2.472 1.22 3.378m13.06-3.378a2.25 2.25 0 0 1-2.475-2.118A5.25 5.25 0 0 1 18.75 3a5.25 5.25 0 0 1 5.5 5.25c0 1.28-.46-2.472-1.22 3.378" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const SubconsciousIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const MagicWandIcon = makeIcon(() => (
  <>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.475 2.118A5.25 5.25 0 0 0 5.25 21a5.25 5.25 0 0 0 5.5-5.25c0-1.28-.46-2.472-1.22-3.378Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m12 15.75 3.375-3.375a1.125 1.125 0 1 1 1.591 1.591l-3.375 3.375-1.59-1.59Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75 8.625 12.375a1.125 1.125 0 1 0-1.591 1.591L10.41 15.75m1.59-1.59-3.375-3.375a1.125 1.125 0 1 0-1.591 1.591l3.375 3.375m1.59-1.59 3.375 3.375a1.125 1.125 0 1 0 1.591-1.591l-3.375-3.375M12 3.75l-1.5 1.5m1.5-1.5 1.5 1.5m-1.5-1.5V3m0 12.75v-1.5" />
  </>
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const EcosystemIcon = makeIcon(() => (
  <>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3.75H19.5a2.25 2.25 0 0 1 2.25 2.25v11.25a2.25 2.25 0 0 1-2.25-2.25H8.25a2.25 2.25 0  0 1-2.25-2.25V6a2.25 2.25 0  1 1 2.25-2.25Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5V6a2.25 2.25 0  0 1 2.25-2.25H10.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 10.5-1.875-1.875" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 10.5 12.375 12.375" />
  </>
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const CalloutPodcastIcon = makeIcon(() => (
  <>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5a6 6 0 0 0-12 0v1.5a6 6 0  0 0 6 6Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75V18.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75h.008v.008H12v-.008Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12.75h.008v.008H7.5v-.008Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75h.008v.008H16.5v-.008Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 12.75h.008v.008H9.75v-.008Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 12.75h.008v.008H14.25v-.008Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.25v.008" />
  </>
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const DnaIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0  0 1 13.5 18v-2.25Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const MicrophoneIcon = makeIcon(() => (
  <>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5a6 6 0 0 0-12 0v1.5a6 6 0 0 0 6 6Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12a7.5 7.5 0 1 1-15 0" />
  </>
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const IllustrationIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const StorytellerIcon = CoachIcon;

export const EducatorIcon = makeIcon(() => (
  <>
    <path d="M12 14l9-5-9-5-9 5 9 5z" />
    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0 1 12 20.055a11.952 11.952 0 0 1-6.824-2.998 12.078 12.078 0 0 1 .665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v4.764a2.35 2.35 0 01-1.262 2.088l-1.636.963a1.176 1.176 0 00-.437 1.455 1.175 1.175 0 001.454.437l3.96-2.329a1.175 1.175 0 00.437-1.455 1.175 1.175 0 00-1.454-.437l-1.636.962a2.35 2.35 0 01-1.262-2.088V14" />
  </>
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const WriterIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const DirectorIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.475 2.118A5.25 5.25 0 0 0 5.25 21a5.25 5.25 0 0 0 5.5-5.25c0-1.28-.46-2.472-1.22-3.378Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const ProducerIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const ElevenLabsIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 10h2v4H4z M10 7h2v10h-2z M16 4h2v16h-2z" />
), { stroke: 'currentColor' });

export const PsychologistIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const SeoIcon = makeIcon(() => (
  <>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 7.5h6m-6 3h6m-6 3h6" />
  </>
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const DesignerIcon = IllustrationIcon;

export const AudienceIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.742-.588M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-4.28 4.995a9.09 9.09 0 0 1-.588-3.742m-3.742.588a9.09 9.09 0 0 1-.588-3.742m0 0a9.09 9.09 0 0 1 3.742-.588m5.88 0a9.09 9.09 0 0 1 3.742.588m-3.742-.588a9.09 9.09 0 0 1-3.742.588m5.88 0a9.09 9.09 0 0 1 3.742.588M6 18.72a9.094 9.094 0 0 1-3.742-.588m11.963 0a9.09 9.09 0 0 0-3.742-.588m3.742.588a9.09 9.09 0 0 0 3.742.588M12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-4.28 4.995a9.09 9.09 0 0 1-.588-3.742m-3.742.588a9.09 9.09 0 0 1-.588-3.742m0 0a9.09 9.09 0  0 1 3.742-.588m5.88 0a9.09 9.09 0 0  1 3.742.588" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const GlobeIcon = makeIcon(() => (
  <>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 1-9-9c0-4.625 4.333-11.667 9-11.667s9 7.042 9 11.667a9 9 0 0 1-9 9Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 0 0-18m0 18a9 9 0 0 1 0-18m0 18v-9m-9 9h18" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a9 9 0 0 1-9-9m9 9a9 9 0 0 0 9-9" />
  </>
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const PublishIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const RocketIcon = makeIcon(() => (
  <>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.82m5.84-2.56a17.96 17.96 0 0 1 1.25.12A12.035 12.035 0 0 1 21 12c0-6.627-5.373-12-12-12S-3 5.373-3 12c0 .495.024.985.07 1.462A12.042 12.042 0 0 1 9 18.354a17.961 17.961 0 0 1-1.31.12h-2.82c-.93.003-1.803-.26-2.55-.771a11.95 11.95 0 0 1-2.072-9.155 12.023 12.023 0 0 1 8.84-6.303" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
  </>
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const PlusCircleIcon = NewSessionIcon;

export const SparklesIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const ClockIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const QuestionMarkCircleIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const Cog6ToothIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213.962c.073.334.25.632.478.868.228.236.533.39.868.478l.962.213c.542.09.94.56.94 1.11v2.594c0 .55-.398 1.02-.94 1.11l-.962.213c-.334.073-.632.25-.868.478-.236.228-.39.533-.478.868l-.213.962c-.09.542-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-.962a2.25 2.25 0 0 1-.478-.868c-.085-.335-.24-.632-.478-.868a2.25 2.25 0 0 1-.868-.478l-.962-.213c-.542-.09-.94-.56-.94-1.11v-2.593c0 .55.398-1.02.94-1.11l.962-.213a2.25 2.25 0 0 1 .868-.478c.238-.228.395-.533.478-.868l.213-.962ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const SunIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const InformationCircleIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const ArrowLeftIcon = makeIcon(() => (
  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" />
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const CommandIcon = makeIcon(() => (
  <>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5h10.5v10.5H6.75z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9.75h7.5v7.5h-7.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 12h4.5v4.5h-4.5z" />
  </>
), { stroke: 'currentColor', strokeWidth: 1.75 });

export const RefreshIcon = makeIcon(() => (
  <>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 20v-5h-5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 9a7 7 0 10-1.8 7.2" />
  </>
), { stroke: 'currentColor' });
