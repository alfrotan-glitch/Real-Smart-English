// components/BookletSubcomponents.tsx
// Final, production-grade. React 19 / TS5 / Vite 7. ESM-only. English-only inside code.

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useAppStore } from "../store/appStore";
import type { Tab } from "../types";
import type { TTSChunk } from "../utils/ttsPrep";
import type { LevelId } from "../types/levelConfig";
import { getApiErrorMessage } from "../utils/errorHandler";

import {
  DownloadIcon,
  EditIcon,
  SaveIcon,
  RemoveHighlightIcon,
  CheckCircleIcon,
  TrendIcon,
  BookletIcon,
  PodcastIcon,
  ExportIcon,
  CopyIcon,
  MarkdownIcon,
  TextFileIcon,
  ClipboardListIcon,
  SpinnerIcon,
  MagicWandIcon,
  MicrophoneIcon,
  GlossaryIcon,
  CoverImageIcon,
  IllustrationIcon,
  BrainIcon,
} from "./Icons";

/* ===============================
   Constants
=============================== */

const HIGHLIGHT_COLORS = ["#FFF3A3", "#FFA6C1", "#A4E8FF", "#A3F5B8"] as const;

/* ===============================
   Tabs
=============================== */

type TabButtonProps = {
  id: Tab;
  label: string;
  onClick?: () => void;
};

const TabButtonInner: React.FC<TabButtonProps> = ({ id, label, onClick }) => {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const active = activeTab === id;

  const icons: Record<Tab, React.ReactNode> = {
    insights: <TrendIcon className="w-5 h-5" />,
    booklet: <BookletIcon className="w-5 h-5" />,
    podcast: <PodcastIcon className="w-5 h-5" />,
    show_notes: <ClipboardListIcon className="w-5 h-5" />,
    teaser: <MagicWandIcon className="w-5 h-5" />,
    daily_script: <BrainIcon className="w-5 h-5" />,
  };

  const handleClick = () => {
    setActiveTab(id);
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        active ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
      }`}
      type="button"
      aria-current={active ? "page" : undefined}
    >
      {icons[id]}
      <span>{label}</span>
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-from to-brand-to rounded-full" />
      )}
    </button>
  );
};

const TabButtonContainer = ({ children }: { children: React.ReactNode }) => (
  <nav className="flex items-center" aria-label="Tabs">
    {children}
  </nav>
);

export const TabButton = Object.assign(memo(TabButtonInner), {
  Container: TabButtonContainer,
});

/* ===============================
   Podcast line
=============================== */

export const PodcastLine = memo(function PodcastLine({
  host,
  children,
  isHighlighted,
  textToPractice,
  onPractice,
}: {
  host: string;
  children: React.ReactNode;
  isHighlighted: boolean;
  textToPractice: string;
  onPractice: (text: string) => void;
}) {
  // safe primary-host extraction without "Object is possibly 'undefined'"
  const host1Persona = useAppStore(s => s.host1Persona);

  // pick first token before ":"; fall back to "Host" if persona is empty or missing
  const host1Name = ((host1Persona ?? "Host").split(":")[0] || "Host").trim();

  const isPrimary = host === host1Name;
  const barColor = isPrimary ? "bg-brand-from" : "bg-accent";
  const nameColor = isPrimary ? "text-brand-from font-bold" : "text-accent font-bold";


  return (
    <div
      className={`group flex items-start space-x-3 my-4 p-2 rounded-lg transition-colors duration-300 ${
        isHighlighted ? "bg-accent/10" : ""
      }`}
    >
      <div className={`flex-shrink-0 w-2 h-6 mt-1 ${barColor} rounded-full`} />
      <div className="flex-1">
        <span className={nameColor}>{host}:</span>
        <div className="inline ml-2 text-text-primary">{children}</div>
      </div>
      <button
        onClick={() => onPractice(textToPractice)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-opacity"
        type="button"
        aria-label="Practice line"
        title="Practice line"
      >
        <MicrophoneIcon className="w-5 h-5 text-text-secondary" />
      </button>
    </div>
  );
});

/* ===============================
   Voice selector
=============================== */

type MaybeVoice = SpeechSynthesisVoice | null | undefined;

export const VoiceSelector = memo(function VoiceSelector({
  host,
  voiceMap,
  voices,
  onChange,
}: {
  host: string;
  voiceMap: Record<string, MaybeVoice>;
  voices: SpeechSynthesisVoice[];
  /** Parent passes (voiceName) only. Component already knows host. */
  onChange: (voiceName: string) => void;
}) {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor={`voice-${host}`} className="text-sm font-medium text-text-secondary">
        {host}:
      </label>
      <select
        id={`voice-${host}`}
        value={voiceMap[host]?.name || ""}
        onChange={(e) => onChange(e.target.value)}
        className="block w-44 pl-3 pr-10 py-1.5 text-sm rounded-md shadow-sm bg-slate-100/10 text-text-primary border-white/20 focus:bg-slate-900/50 focus:ring-2 focus:ring-brand-from focus:border-brand-from"
      >
        <option value="">Default</option>
        {voices.map((v) => (
          <option key={v.name} value={v.name}>
            {v.name} ({v.lang})
          </option>
        ))}
      </select>
    </div>
  );
});

/* ===============================
   TTS chunks display
=============================== */

export const TTSChunkDisplay = memo(function TTSChunkDisplay({
  chunks,
  level, // reserved for future level-aware formatting
  onCopy,
}: {
  chunks: TTSChunk[];
  level: LevelId;
  onCopy: (text: string) => void;
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    onCopy(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="mt-4 p-4 bg-brand-from/10 border border-brand-from/20 rounded-lg text-sm text-text-secondary">
      <h4 className="font-bold text-base mb-2 text-text-primary">Pro TTS Audio Chunks</h4>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {chunks.map((chunk, index) => (
          <div
            key={`${chunk.speaker}-${index}`}
            className="p-2.5 bg-white/5 border border-white/10 rounded-lg flex items-start gap-3"
          >
            <span className="font-bold text-brand-from">{chunk.speaker}:</span>
            <p className="flex-1 text-text-secondary">{chunk.text}</p>
            <button
              onClick={() => handleCopy(chunk.text, index)}
              className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary/70 hover:text-text-primary flex-shrink-0"
              type="button"
              aria-label="Copy chunk text"
              title="Copy"
            >
              {copiedIndex === index ? (
                <CheckCircleIcon className="w-5 h-5 text-success" />
              ) : (
                <CopyIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

/* ===============================
   Theme selector
=============================== */

export const ThemeSelector = memo(function ThemeSelector({
  theme,
  themes,
  setTheme,
}: {
  theme: string;
  themes: Record<string, string>;
  setTheme: (t: string) => void;
}) {
  return (
    <div className="flex-shrink-0 border-t border-white/10 bg-cosmic/50 p-3 flex items-center justify-end">
      <div className="flex items-center space-x-2">
        <label htmlFor="theme-select" className="text-sm font-medium text-text-secondary">
          Theme:
        </label>
        <select
          id="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="block pl-3 pr-10 py-1.5 text-sm rounded-md shadow-sm bg-slate-100/10 text-text-primary border-white/20 focus:bg-slate-900/50 focus:ring-2 focus:ring-brand-from focus:border-brand-from"
        >
          {Object.keys(themes).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});

/* ===============================
   Copy bar
=============================== */

export const CopyBar = memo(function CopyBar({
  content,
  copyStatus,
  onCopy,
}: {
  content: string;
  copyStatus: "idle" | "copied";
  onCopy: (c: string) => void;
}) {
  return (
    <div className="flex-shrink-0 border-t border-white/10 bg-cosmic/50 p-3 flex items-center justify-end">
      <button
        onClick={() => onCopy(content)}
        className="p-2 flex items-center space-x-2 rounded-md bg-white/10 hover:bg-white/20 text-text-primary"
        type="button"
      >
        <span>{copyStatus === "copied" ? "Copied!" : "Copy"}</span>
        {copyStatus === "copied" ? (
          <CheckCircleIcon className="w-5 h-5 text-success" />
        ) : (
          <CopyIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  );
});

/* ===============================
   Action buttons
=============================== */

const ICONS_FOR_LABEL: Record<string, React.ReactNode> = {
  Glossary: <GlossaryIcon className="w-5 h-5" />,
  Cover: <CoverImageIcon className="w-5 h-5" />,
  Illustrations: <IllustrationIcon className="w-5 h-5" />,
};

type ActionButtonProps = {
  onClick: () => void;
  isLoading: boolean;
  label: string;
  ariaLabel?: string;
};

const ActionButtonFC: React.FC<ActionButtonProps> = ({ onClick, isLoading, label, ariaLabel }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    aria-label={ariaLabel || label}
    className="group inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/12 shadow-sm text-text-secondary hover:bg-white/20 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
    type="button"
  >
    {isLoading ? <SpinnerIcon className="w-5 h-5" /> : ICONS_FOR_LABEL[label] ?? null}
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const ActionButtonEdit = ({
  onToggle,
  isEditing,
  activeTab,
}: {
  onToggle: () => void;
  isEditing: boolean;
  activeTab: Tab;
}) => {
  if (!["booklet", "podcast", "show_notes", "teaser"].includes(activeTab)) return null;
  const label = isEditing ? "Save" : "Edit";
  return (
    <button
      onClick={onToggle}
      className={`group inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/12 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent ${
        isEditing
          ? "bg-brand-from/20 text-brand-from"
          : "bg-white/10 text-text-secondary hover:bg-white/20 hover:text-text-primary"
      }`}
      type="button"
      aria-label={label}
    >
      {isEditing ? <SaveIcon className="w-5 h-5" /> : <EditIcon className="w-5 h-5" />}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

const ActionButtonExport = ({ onToggle }: { onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className="group inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/12 shadow-sm text-text-secondary hover:bg-white/20 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
    type="button"
    aria-label="Export"
  >
    <ExportIcon className="w-5 h-5" />
    <span className="text-sm font-medium">Export</span>
  </button>
);

export const ActionButton = Object.assign(memo(ActionButtonFC), {
  Edit: memo(ActionButtonEdit),
  Export: memo(ActionButtonExport),
});

/* ===============================
   Export menu
=============================== */

export const ExportMenu = memo(function ExportMenu({
  onPdf,
  onText,
  activeTab,
  onDismiss,
}: {
  onPdf: () => void;
  onText: (t: "md" | "txt" | "json") => void;
  activeTab: Tab;
  onDismiss: () => void;
}) {
  return (
    <div
      className="absolute right-0 mt-2 w-56 origin-top-right bg-cosmic rounded-md shadow-lg ring-1 ring-white/10 z-30"
      onMouseLeave={onDismiss}
      role="menu"
      aria-label="Export options"
    >
      <div className="py-1">
        {activeTab === "booklet" && (
          <button
            onClick={onPdf}
            className="text-text-secondary flex items-center w-full px-4 py-2 text-sm hover:bg-white/10"
            type="button"
            role="menuitem"
          >
            <DownloadIcon className="w-5 h-5 mr-3" />
            Export as PDF
          </button>
        )}
        {["booklet", "show_notes", "teaser"].includes(activeTab) && (
          <button
            onClick={() => onText("md")}
            className="text-text-secondary flex items-center w-full px-4 py-2 text-sm hover:bg-white/10"
            type="button"
            role="menuitem"
          >
            <MarkdownIcon className="w-5 h-5 mr-3" />
            Export as Markdown
          </button>
        )}
        {activeTab === "podcast" && (
          <button
            onClick={() => onText("txt")}
            className="text-text-secondary flex items-center w-full px-4 py-2 text-sm hover:bg-white/10"
            type="button"
            role="menuitem"
          >
            <TextFileIcon className="w-5 h-5 mr-3" />
            Export as Text
          </button>
        )}
      </div>
    </div>
  );
});

/* ===============================
   Copilot / Interaction toolbar
=============================== */

const QUICK_FIXES = [
  { label: "Simplify", command: "Make this simpler and easier to understand." },
  { label: "Expand", command: "Expand on this with more details or an example." },
  { label: "Proofread", command: "Correct any grammar or spelling mistakes in this text." },
] as const;

type RefineFn = (
  selection: { text: string; contextBefore: string; contextAfter: string },
  command: string,
  activeTab: Tab
) => Promise<void>;

export const InteractionToolbar = memo(function InteractionToolbar({
  isCopilotActive,
  displayRef,
  refineScript,
  activeTab,
  isEditing,
}: {
  isCopilotActive: boolean;
  displayRef: React.RefObject<HTMLDivElement | null>;
  refineScript: RefineFn;
  activeTab: Tab;
  isEditing: boolean;
}) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const currentRangeRef = useRef<Range | null>(null);
  const [copilot, setCopilot] = useState<{
    visible: boolean;
    top: number;
    left: number;
    prompt: string;
    selection: string;
    isRefining: boolean;
  }>({
    visible: false,
    top: 0,
    left: 0,
    prompt: "",
    selection: "",
    isRefining: false,
  });

  const applyHighlight = useCallback((color: string) => {
    if (currentRangeRef.current) {
      const mark = document.createElement("mark");
      mark.style.backgroundColor = color;
      mark.style.color = "inherit";
      try {
        currentRangeRef.current.surroundContents(mark);
      } catch (e) {
        console.error("Could not apply highlight:", getApiErrorMessage(e));
      }
      currentRangeRef.current = null;
      window.getSelection()?.removeAllRanges();
    }
    setCopilot((p) => ({ ...p, visible: false }));
  }, []);

  const clearHighlight = useCallback(() => {
    // Remove nearest <mark> around current selection if present
    const selection = window.getSelection();
    if (selection?.rangeCount) {
      let ancestor: Node | null = selection.getRangeAt(0).commonAncestorContainer;
      if (ancestor.nodeType === Node.TEXT_NODE) ancestor = (ancestor as Node).parentElement;
      const mark = (ancestor as Element | null)?.closest?.("mark");
      if (mark) {
        const parent = mark.parentNode as Node & ParentNode;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        (parent as Element).normalize?.();
      }
    }
    currentRangeRef.current = null;
    window.getSelection()?.removeAllRanges();
    setCopilot((p) => ({ ...p, visible: false }));
  }, []);

  const executeRefine = useCallback(
    async (command: string) => {
      if (!copilot.selection) return;
      setCopilot((p) => ({ ...p, isRefining: true, prompt: command }));

      let contextBefore = "";
      let contextAfter = "";
      if (currentRangeRef.current) {
        const range = currentRangeRef.current;
        const startText = range.startContainer.textContent || "";
        const endText = range.endContainer.textContent || startText;
        contextBefore = startText.substring(Math.max(0, range.startOffset - 150), range.startOffset);
        contextAfter = endText.substring(range.endOffset, Math.min(endText.length, range.endOffset + 150));
      }

      try {
        await refineScript({ text: copilot.selection, contextBefore, contextAfter }, command, activeTab);
      } finally {
        window.getSelection()?.removeAllRanges();
        setCopilot({
          visible: false,
          top: 0,
          left: 0,
          prompt: "",
          selection: "",
          isRefining: false,
        });
      }
    },
    [copilot.selection, activeTab, refineScript]
  );

  const handleRefineWithPrompt = useCallback(() => {
    if (copilot.prompt) void executeRefine(copilot.prompt);
  }, [copilot.prompt, executeRefine]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isEditing) return;
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const containerEl = displayRef.current;
          if (containerEl && containerEl.contains(range.commonAncestorContainer)) {
            if (isCopilotActive) {
              const rect = range.getBoundingClientRect();
              const parentEl = containerEl.parentElement;
              if (!parentEl) {
                setCopilot((p) => ({ ...p, visible: false }));
                return;
              }
              const containerRect = parentEl.getBoundingClientRect();
              setCopilot({
                visible: true,
                top: rect.top - containerRect.top + parentEl.scrollTop - 150,
                left: rect.left - containerRect.left + rect.width / 2,
                selection: selection.toString(),
                prompt: "",
                isRefining: false,
              });
              currentRangeRef.current = range;
            }
            return;
          }
        }
        setCopilot((p) => ({ ...p, visible: false }));
      }, 10);
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (copilot.visible && toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setCopilot((p) => ({ ...p, visible: false }));
      }
    };
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isEditing, isCopilotActive, copilot.visible, displayRef]);

  if (!copilot.visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="absolute z-20 bg-slate-800 rounded-lg shadow-xl p-3 flex flex-col items-center space-y-2 transform -translate-x-1/2 w-80"
      style={{ top: `${copilot.top}px`, left: `${copilot.left}px` }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex items-center space-x-2 w-full">
        <input
          type="text"
          value={copilot.prompt}
          onChange={(e) => setCopilot((p) => ({ ...p, prompt: e.target.value }))}
          placeholder="e.g., Make this clearer…"
          className="flex-grow bg-slate-700 text-white placeholder-slate-400 text-sm rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={copilot.isRefining}
          onKeyDown={(e) => e.key === "Enter" && handleRefineWithPrompt()}
          aria-label="Refine prompt"
        />
        <button
          onClick={handleRefineWithPrompt}
          disabled={!copilot.prompt || copilot.isRefining}
          className="p-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          type="button"
          aria-label="Run refine"
          title="Run refine"
        >
          {copilot.isRefining ? <SpinnerIcon className="w-5 h-5" /> : <MagicWandIcon className="w-5 h-5" />}
        </button>
      </div>

      <div className="w-full h-px bg-slate-800/60" />

      <div className="w-full grid grid-cols-3 gap-1">
        {QUICK_FIXES.map((fix) => (
          <button
            key={fix.label}
            onClick={() => void executeRefine(fix.command)}
            disabled={copilot.isRefining}
            className="px-2 py-1 text-xs bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 disabled:opacity-50"
            type="button"
          >
            {fix.label}
          </button>
        ))}
      </div>

      <div className="w-full h-px bg-slate-800/60" />

      <div className="flex items-center justify-center space-x-2 pt-1">
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => applyHighlight(color)}
            className="w-6 h-6 rounded-full border-2 border-white/50 transition-transform hover:scale-110"
            style={{ backgroundColor: color }}
            aria-label={`Highlight ${color}`}
            type="button"
            title={`Highlight ${color}`}
          />
        ))}
        <div className="w-px h-5 bg-slate-600 mx-1" />
        <button
          onClick={clearHighlight}
          className="flex items-center justify-center w-6 h-6 rounded-full transition-colors hover:bg-slate-700"
          aria-label="Remove highlight"
          type="button"
          title="Remove highlight"
        >
          <RemoveHighlightIcon className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
});

/* ===============================
   Callout
=============================== */

export const Callout = memo(function Callout({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="not-prose my-4 p-4 rounded-lg flex items-start space-x-3 bg-indigo-50 border border-indigo-200/80">
      <div className="flex-shrink-0 text-indigo-500 mt-0.5">{icon}</div>
      <div className="text-indigo-800 text-base">{children}</div>
    </div>
  );
});
