// components/BookletDisplay.tsx
// Production-grade, chain-consistent with store/types. English-only inside code.

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

import {
  ErrorIcon,
  InfoIcon,
  BoldIcon,
  ItalicIcon,
  ListUlIcon,
  ListOlIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  SpeakerIcon,
  ElevenLabsIcon,
  SpinnerIcon,
} from "./Icons";

import { generateGlossary } from "../services/geminiService";
import InteractiveQuiz, { type QuizData } from "./InteractiveQuiz";
import InteractiveExercises, { type ExerciseData } from "./InteractiveExercises";
import { usePodcastPlayer, type DialogueLine } from "../hooks/usePodcastPlayer";
import { useAppStore } from "../store/appStore";
import PronunciationCoachModal from "./PronunciationCoachModal";
import { LEVELS, type LevelId } from "../types/levelConfig";
import { prepPodcastForTTS, type TTSChunk } from "../utils/ttsPrep";
import GenerationCouncilView from "./GenerationCouncilView";
import {
  TabButton,
  VoiceSelector,
  TTSChunkDisplay,
  ThemeSelector,
  CopyBar,
  ActionButton,
  ExportMenu,
  InteractionToolbar,
} from "./BookletSubcomponents";
import { PodcastMode } from "../types";

const themes: Record<string, string> = {
  Modern:
    "prose-invert prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-a:text-accent prose-blockquote:border-l-accent/50 prose-blockquote:bg-accent/10",
  Classic:
    "prose-invert font-serif prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-a:text-accent prose-blockquote:border-l-accent/50 prose-blockquote:bg-accent/10",
};

type FormatType = "bold" | "italic" | "h1" | "h2" | "ul" | "ol";

/* ---------- Output Card (tabbed, with overlay and export menu) ---------- */
const OutputCard: React.FC<{
  isLoading: boolean;
  status: "ready" | "error" | "loading";
  onExportPdf: () => void;
  onExportText: (type: "md" | "txt" | "json") => void;
  showExportMenu: boolean;
  toggleExportMenu: () => void;
  children: React.ReactNode;
}> = memo(
  ({
    isLoading,
    status,
    onExportPdf,
    onExportText,
    showExportMenu,
    toggleExportMenu,
    children,
  }) => {
    return (
      <div className="relative flex flex-col bg-glass/60 backdrop-blur-lg border border-white/20 rounded-card shadow-card flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-glass/80">
          <div className="text-sm text-text-secondary">
            {status === "loading" && "Generating..."}
            {status === "ready" && "Ready"}
            {status === "error" && "Error occurred"}
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1 text-xs bg-accent rounded-md hover:bg-accent/80 text-white disabled:opacity-50"
              onClick={onExportPdf}
              disabled={isLoading}
              type="button"
            >
              Export PDF
            </button>
            <div className="relative">
              <button
                className="px-3 py-1 text-xs bg-white/15 rounded-md hover:bg-white/25 text-text-primary"
                onClick={toggleExportMenu}
                disabled={isLoading}
                type="button"
              >
                Export
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-1 bg-glass/80 backdrop-blur-lg border border-white/20 rounded-md shadow-lg z-20">
                  <button
                    className="block w-full px-4 py-2 text-sm hover:bg-white/10 text-left"
                    onClick={() => onExportText("md")}
                    type="button"
                  >
                    Markdown (.md)
                  </button>
                  <button
                    className="block w-full px-4 py-2 text-sm hover:bg-white/10 text-left"
                    onClick={() => onExportText("txt")}
                    type="button"
                  >
                    Text (.txt)
                  </button>
                  <button
                    className="block w-full px-4 py-2 text-sm hover:bg-white/10 text-left"
                    onClick={() => onExportText("json")}
                    type="button"
                  >
                    JSON (.json)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 text-text-primary select-text">
          {children}
        </div>
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-card z-10">
            <SpinnerIcon className="w-12 h-12 text-white animate-spin" />
          </div>
        )}
      </div>
    );
  }
);

const MarkdownToolbar = memo(function MarkdownToolbar({
  onApplyFormat,
}: {
  onApplyFormat: (type: FormatType) => void;
}) {
  return (
    <div className="flex items-center space-x-2 p-2 bg-slate-100 border-b border-slate-300 rounded-t-md">
      <button
        title="Bold"
        onClick={() => onApplyFormat("bold")}
        className="p-2 rounded hover:bg-slate-200"
        type="button"
      >
        <BoldIcon className="w-5 h-5" />
      </button>
      <button
        title="Italic"
        onClick={() => onApplyFormat("italic")}
        className="p-2 rounded hover:bg-slate-200"
        type="button"
      >
        <ItalicIcon className="w-5 h-5" />
      </button>
      <div className="w-px h-6 bg-slate-300 mx-1" />
      <button
        title="Heading 1"
        onClick={() => onApplyFormat("h1")}
        className="p-2 rounded hover:bg-slate-200 font-bold"
        type="button"
      >
        H1
      </button>
      <button
        title="Heading 2"
        onClick={() => onApplyFormat("h2")}
        className="p-2 rounded hover:bg-slate-200 font-bold"
        type="button"
      >
        H2
      </button>
      <div className="w-px h-6 bg-slate-300 mx-1" />
      <button
        title="Unordered List"
        onClick={() => onApplyFormat("ul")}
        className="p-2 rounded hover:bg-slate-200"
        type="button"
      >
        <ListUlIcon className="w-5 h-5" />
      </button>
      <button
        title="Ordered List"
        onClick={() => onApplyFormat("ol")}
        className="p-2 rounded hover:bg-slate-200"
        type="button"
      >
        <ListOlIcon className="w-5 h-5" />
      </button>
    </div>
  );
});

const MarkdownEditor = memo(function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const applyFormat = useCallback(
    (type: FormatType) => {
      const ed = editorRef.current;
      if (!ed) return;
      const { selectionStart, selectionEnd, value: v } = ed;
      const sel = v.substring(selectionStart, selectionEnd);
      let newText = "";
      switch (type) {
        case "bold":
          newText = `**${sel || "text"}**`;
          break;
        case "italic":
          newText = `*${sel || "text"}*`;
          break;
        case "h1":
        case "h2": {
          const prefix = type === "h1" ? "# " : "## ";
          const lineStart = v.lastIndexOf("\n", selectionStart - 1) + 1;
          const lineEnd = v.indexOf("\n", selectionEnd);
          const finalLineEnd = lineEnd === -1 ? v.length : lineEnd;
          const curLine = v.substring(lineStart, finalLineEnd);
          const formatted = prefix + curLine.replace(/^#+\s*/, "");
          const next = v.substring(0, lineStart) + formatted + v.substring(finalLineEnd);
          onChange(next);
          setTimeout(() => {
            ed.focus();
            ed.setSelectionRange(lineStart, lineStart + formatted.length);
          }, 0);
          return;
        }
        case "ul":
        case "ol": {
          const lines = (sel || "item 1\nitem 2").split("\n");
          const formattedLines = lines.map((ln, i) => {
            if (!ln.trim()) return ln;
            return type === "ul" ? `- ${ln}` : `${i + 1}. ${ln}`;
          });
          newText = formattedLines.join("\n");
          break;
        }
        default:
          newText = sel;
      }
      const next = v.substring(0, selectionStart) + newText + v.substring(selectionEnd);
      onChange(next);
      setTimeout(() => {
        ed.focus();
        ed.setSelectionRange(selectionStart, selectionStart + newText.length);
      }, 0);
    },
    [onChange]
  );
  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="border border-slate-300 rounded-md flex flex-col flex-grow">
        <MarkdownToolbar onApplyFormat={applyFormat} />
        <textarea
          ref={editorRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full flex-grow p-4 font-mono text-sm bg-white rounded-b-md focus:outline-none resize-none"
          aria-label="Markdown editor"
        />
      </div>
    </div>
  );
});

/* ===============================
   Main Component
=============================== */
const BookletDisplay: React.FC = () => {
  const {
    generationStep,
    error,
    topic,
    level,
    insightsContent,
    bookletPart,
    setBookletPart,
    podcastScript,
    setPodcastScript,
    showNotesContent,
    setShowNotesContent,
    socialMediaTeaserContent,
    setSocialMediaTeaserContent,
    dailyScript,
    activeTab,
    setActiveTab,
    theme,
    setTheme,
    refineScript,
    isCopilotActive,
    illustrations,
    generateIllustrations,
    isGeneratingIllustrations,
    generateCoverImage,
    isGeneratingCover,
    podcastMode,
    host1Persona,
    handleMistakes,
  } = useAppStore();

  const displayRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isGeneratingGlossary, setIsGeneratingGlossary] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [pronunciationModal, setPronunciationModal] = useState<{ isOpen: boolean; text: string }>({
    isOpen: false,
    text: "",
  });
  const [ttsChunks, setTtsChunks] = useState<TTSChunk[] | null>(null);
  const [isPreparingTTS, setIsPreparingTTS] = useState(false);

  const [hosts, setHosts] = useState<string[]>([]);
  const { play, pause, stop, isPlaying, voices, playbackRate, setPlaybackRate, voiceMap, setVoiceMap } =
    usePodcastPlayer({ hosts });

  // Stop audio on content changes to avoid race conditions
  useEffect(() => {
    stop();
  }, [
    bookletPart,
    podcastScript,
    insightsContent,
    showNotesContent,
    socialMediaTeaserContent,
    generationStep,
    stop,
  ]);

  // Match playback rate to level config WPM
  useEffect(() => {
    const config = LEVELS[level as LevelId];
    if (config) {
      const baseWPM = 140;
      const targetWPM = config.paceWPM;
      const rate = targetWPM / baseWPM;
      setPlaybackRate(rate);
    }
  }, [level, setPlaybackRate]);

  // Parse podcast lines for dialogue mode to collect host names
  useEffect(() => {
    if (podcastScript && podcastMode === PodcastMode.Dialogue) {
      setTtsChunks(null);
      const lines = podcastScript.split("\n").filter((l) => l.trim() !== "");
      const hostSet = new Set<string>();
      lines.forEach((line) => {
        const match = line.match(/^\*\*([A-Za-z0-9_]+):\*\*\s*/);
        if (match) hostSet.add(match[1]);
      });
      setHosts(Array.from(hostSet));
    } else {
      setHosts([]);
    }
  }, [podcastScript, podcastMode]);

  // Which content to show per tab
  const contentToDisplay = useMemo(() => {
    switch (activeTab) {
      case "insights":
        return insightsContent;
      case "booklet":
        return bookletPart;
      case "podcast":
        return podcastScript;
      case "show_notes":
        return showNotesContent;
      case "teaser":
        return socialMediaTeaserContent;
      case "daily_script":
        return dailyScript ? JSON.stringify(dailyScript, null, 2) : "";
      default:
        return "";
    }
  }, [
    activeTab,
    insightsContent,
    bookletPart,
    podcastScript,
    showNotesContent,
    socialMediaTeaserContent,
    dailyScript,
  ]);

  const isEditableTab = useMemo(
    () => ["booklet", "podcast", "show_notes", "teaser"].includes(activeTab),
    [activeTab]
  );

  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      if (activeTab === "booklet") setBookletPart(editedContent);
      else if (activeTab === "podcast") setPodcastScript(editedContent);
      else if (activeTab === "show_notes") setShowNotesContent(editedContent);
      else if (activeTab === "teaser") setSocialMediaTeaserContent(editedContent);
      setIsEditing(false);
    } else {
      setEditedContent(contentToDisplay || "");
      setIsEditing(true);
    }
  }, [
    isEditing,
    activeTab,
    contentToDisplay,
    setBookletPart,
    setPodcastScript,
    setShowNotesContent,
    setSocialMediaTeaserContent,
  ]);

  // Export: PDF
  const handleDownloadPdf = useCallback(async () => {
    setShowExportMenu(false);
    const sourceElement = displayRef.current;
    if (!sourceElement || isEditing) return;

    // wait a tick and ensure fonts are ready
    await new Promise((r) => setTimeout(r, 50));
    const fonts = (document as unknown as { fonts?: { ready?: Promise<void> } }).fonts;
    if (fonts?.ready) {
      await fonts.ready;
    }

    // offscreen container for crisp capture
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0px";
    container.style.width = "1050px";
    container.style.backgroundColor = "white";
    const contentClone = document.createElement("div");
    contentClone.className = sourceElement.className;
    contentClone.innerHTML = sourceElement.innerHTML;
    container.appendChild(contentClone);
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pdfWidth - margin * 2;
      const ratio = canvas.width / contentWidth;
      const imgHeightInPdf = canvas.height / ratio;

      let heightLeft = imgHeightInPdf;
      let position = 0;
      const pageContentHeight = pdfHeight - margin * 2;
      pdf.addImage(imgData, "PNG", margin, margin, contentWidth, imgHeightInPdf);
      heightLeft -= pageContentHeight;

      let pageCount = 1;
      while (heightLeft > 0) {
        position -= pageContentHeight;
        pdf.addPage();
        pageCount++;
        pdf.addImage(imgData, "PNG", margin, position + margin, contentWidth, imgHeightInPdf);
        heightLeft -= pageContentHeight;
      }

      pdf.setFontSize(10);
      pdf.setTextColor(150);
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        const text = `Page ${i} of ${pageCount}`;
        // typings are loose in jsPDF for this call
        const textWidth =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (pdf.getStringUnitWidth(text) * (pdf.getFontSize() as any)) / (pdf as any).internal.scaleFactor;
        pdf.text(text, pdfWidth - margin - textWidth, pdfHeight - margin / 2);
      }
      const fileName = `${(topic || "lesson").replace(/ /g, "_")}_${(level || "A1")}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      document.body.removeChild(container);
    }
  }, [isEditing, topic, level]);

  // Generate glossary (booklet only)
  const handleGenerateGlossary = useCallback(async () => {
    setIsGeneratingGlossary(true);
    try {
      const items = await generateGlossary(bookletPart, level);
      const glossaryMd =
        "\n\n## Glossary\n\n" +
        items.map((it: { term: string; definition: string }) => `**${it.term}:** ${it.definition}`).join("\n\n");
      setBookletPart((bookletPart || "") + glossaryMd);
    } catch (e) {
      console.error("Failed to generate glossary:", e);
    } finally {
      setIsGeneratingGlossary(false);
    }
  }, [bookletPart, level, setBookletPart]);

  // Export: text formats
  const handleDownloadText = useCallback(
    (type: "md" | "txt" | "json") => {
      setShowExportMenu(false);
      const content = contentToDisplay || "";
      const fileName = `${(topic || "lesson").replace(/ /g, "_")}_${activeTab}.${type}`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [contentToDisplay, topic, activeTab]
  );

  // Copy helper
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyStatus("copied");
        setTimeout(() => setCopyStatus("idle"), 2000);
      })
      .catch((e) => console.error("Clipboard copy failed:", e));
  }, []);

  // TTS preparation for pro voices
  const handlePrepareTTS = useCallback(() => {
    if (!podcastScript) return;
    setIsPreparingTTS(true);
    setTimeout(() => {
      const chunks = prepPodcastForTTS(podcastScript, level as LevelId);
      setTtsChunks(chunks);
      setIsPreparingTTS(false);
    }, 50);
  }, [podcastScript, level]);

  // Play podcast (monologue or dialogue)
  const handlePlayPodcast = useCallback(() => {
    if (!podcastScript) return;
    if (podcastMode === PodcastMode.Monologue) {
      const hostName = String(host1Persona || "").split(":")[0].trim() || "Host";
      const playlist: DialogueLine[] = [
        {
          host: hostName,
          text: podcastScript.replace(/\[.*?\]/g, "").replace(/—/g, "..."),
        },
      ];
      play(playlist);
    } else {
      const chunks = prepPodcastForTTS(podcastScript, level as LevelId);
      const playlist: DialogueLine[] = chunks.map((chunk) => ({
        host: chunk.speaker,
        text: chunk.text.replace(/—/g, "..."),
      }));
      play(playlist);
    }
  }, [podcastScript, level, play, podcastMode, host1Persona]);

  // Readability wrapper for Markdown nodes
  const ReadableText = memo(function ReadableText({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div className="relative group">{children}</div>;
  });

  // Markdown custom renderers: interactive JSON blocks and illustrations
  const markdownComponents = useMemo<Components>(
    () => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      code({ inline, className, children, ...props }: any) {
        const clz = typeof className === "string" ? className : "";
        const match = /language-json:(quiz|exercises)/.exec(clz);
        if (!inline && match) {
          const type = match[1] as "quiz" | "exercises";
          const jsonString = String(children ?? "").trim();
          if (!jsonString.endsWith("}") && !jsonString.endsWith("]")) {
            return (
              <div className="not-prose text-gray-500 italic my-4 p-4 bg-gray-50 rounded-md">
                Loading interactive component...
              </div>
            );
          }
          try {
            if (type === "quiz") {
              const quizData: QuizData = JSON.parse(jsonString);
              return <InteractiveQuiz data={quizData} onMistakes={handleMistakes} />;
            }
            const exerciseData: ExerciseData = JSON.parse(jsonString);
            return <InteractiveExercises data={exerciseData} onMistakes={handleMistakes} />;
          } catch (e) {
            console.error("Failed to parse JSON:", e, "\nJSON string:", jsonString);
            return (
              <div className="not-prose text-red-500 italic my-4 p-4 bg-red-50 rounded-md">
                Error loading interactive component.
              </div>
            );
          }
        }
        // @ts-expect-error react-markdown prop passthrough typing is permissive
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
      // @ts-expect-error react-markdown runtime element typing
      p: ({ ...props }) => (
        <ReadableText>
          {/* @ts-expect-error forwarding unknown markdown props */}
          <p {...props} />
        </ReadableText>
      ),
      // @ts-expect-error react-markdown runtime element typing
      li: ({ ...props }) => (
        <ReadableText>
          {/* @ts-expect-error forwarding unknown markdown props */}
          <li {...props} />
        </ReadableText>
      ),
      // @ts-expect-error react-markdown runtime element typing
      blockquote: ({ ...props }) => (
        <ReadableText>
          {/* @ts-expect-error forwarding unknown markdown props */}
          <blockquote {...props} />
        </ReadableText>
      ),
      // @ts-expect-error react-markdown image node typing
      img: ({ src, ...props }: { src?: string }) => {
        const s = src ?? "";
        const illustrationMatch = s.match(/^illustration:(.*)/);
        if (illustrationMatch) {
          const id = illustrationMatch[1].trim();
          const found = illustrations.find((ill) => ill.id === id);
          if (found) {
            return (
              <img
                src={`data:image/png;base64,${found.imageBytes}`}
                alt="Illustration"
                className="w-full h-auto object-cover rounded-card shadow-glow mb-6"
              />
            );
          }
          return (
            <div className="not-prose my-6 p-4 bg-slate-100 rounded-md text-slate-500 text-center italic">
              Illustration placeholder
            </div>
          );
        }
        // @ts-expect-error forward original props from react-markdown
        return <img src={s} {...props} />;
      },
    }),
    [illustrations, handleMistakes]
  );

  // Empty/ready/planning states
  if (generationStep === "idle" || error) {
    return (
      <div className="bg-glass/70 backdrop-blur-xl rounded-card shadow-card border border-white/10 h-full flex flex-col justify-center items-center p-8">
        {error ? (
          <div className="text-center">
            <ErrorIcon className="h-12 w-12 text-danger mb-4" />
            <h3 className="text-lg font-semibold text-text-primary">An Error Occurred</h3>
            <p className="text-danger mt-1">{error}</p>
          </div>
        ) : (
          <div className="text-center">
            <InfoIcon className="h-12 w-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold text-text-primary">Ready to Create?</h3>
            <p className="text-text-secondary mt-2 max-w-sm">Configure your lesson and click "Generate Story".</p>
          </div>
        )}
      </div>
    );
  }

  if (generationStep === "planning" || generationStep === "generating") {
    return (
      <div className="bg-glass/70 backdrop-blur-card rounded-card shadow-card border border-white/10 h-full overflow-hidden">
        <GenerationCouncilView />
      </div>
    );
  }

  // Final rendered UI
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <InteractionToolbar
        isCopilotActive={isCopilotActive}
        displayRef={displayRef as React.RefObject<HTMLDivElement>}
        refineScript={refineScript}
        activeTab={activeTab}
        isEditing={isEditing}
      />

      <PronunciationCoachModal
        isOpen={pronunciationModal.isOpen}
        onClose={() => setPronunciationModal({ isOpen: false, text: "" })}
        originalText={pronunciationModal.text}
      />

      <div className="flex-shrink-0 border-b border-white/10 flex items-center justify-between px-4 py-2 bg-glass/80">
        <TabButton.Container>
          {insightsContent && <TabButton id="insights" label="Plan" />}
          {bookletPart && <TabButton id="booklet" label="Booklet" />}
          {podcastScript && <TabButton id="podcast" label="Podcast" />}
          {showNotesContent && <TabButton id="show_notes" label="Notes" />}
          {socialMediaTeaserContent && <TabButton id="teaser" label="Teaser" />}
          {dailyScript && <TabButton id="daily_script" label="Daily Script" />}
        </TabButton.Container>

        <div className="flex items-center space-x-2">
          {activeTab === "booklet" && (
            <>
              <ActionButton
                onClick={handleGenerateGlossary}
                isLoading={isGeneratingGlossary}
                label="Glossary"
                ariaLabel="Generate glossary"
              />
              <ActionButton
                onClick={generateCoverImage}
                isLoading={isGeneratingCover}
                label="Cover"
                ariaLabel="Generate cover image"
              />
              <ActionButton
                onClick={generateIllustrations}
                isLoading={isGeneratingIllustrations}
                label="Illustrations"
                ariaLabel="Generate illustrations"
              />
              <div className="w-px h-6 bg-white/10 mx-1" />
            </>
          )}

          {isEditableTab && (
            <ActionButton.Edit onToggle={handleEditToggle} isEditing={isEditing} activeTab={activeTab} />
          )}

          <div className="relative">
            <ActionButton.Export onToggle={() => setShowExportMenu((v) => !v)} />
            {showExportMenu && (
              <ExportMenu
                onPdf={handleDownloadPdf}
                onText={handleDownloadText}
                activeTab={activeTab}
                onDismiss={() => setShowExportMenu(false)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden p-2">
        <OutputCard
          isLoading={false}
          status="ready"
          onExportPdf={handleDownloadPdf}
          onExportText={handleDownloadText}
          showExportMenu={showExportMenu}
          toggleExportMenu={() => setShowExportMenu((v) => !v)}
        >
          {isEditing ? (
            <MarkdownEditor value={editedContent} onChange={setEditedContent} />
          ) : (
            <div ref={displayRef}>
              <article className={`prose lg:prose-lg max-w-none ${themes[theme] || themes.Modern]}`}>
                <ReactMarkdown components={markdownComponents}>{contentToDisplay}</ReactMarkdown>
              </article>
            </div>
          )}
        </OutputCard>
      </div>

      {activeTab === "booklet" && (
        <div className="mt-2 px-4">
          <ThemeSelector theme={theme} themes={themes} setTheme={setTheme} />
        </div>
      )}

      {isEditing && (
        <CopyBar content={editedContent} copyStatus={copyStatus} onCopy={() => handleCopy(editedContent)} />
      )}

      {activeTab === "podcast" && podcastScript && (
        <div className="flex-shrink-0 border-t border-white/10 bg-black/20 p-3 flex flex-col gap-4">
          {/* Podcast controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <div className="flex items-center space-x-2">
              <button
                onClick={isPlaying ? pause : handlePlayPodcast}
                className="p-2 bg-brand-from text-white rounded-full shadow-md hover:bg-brand-to"
                type="button"
              >
                {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
              </button>
              <button
                onClick={stop}
                className="p-2 bg-white/20 text-text-primary rounded-full hover:bg-white/30"
                type="button"
              >
                <StopIcon className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-1">
                <SpeakerIcon className="w-5 h-5 text-text-secondary" />
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                  className="w-24 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {hosts.map((host) => (
                <VoiceSelector
                  key={host}
                  host={host}
                  voiceMap={voiceMap}
                  voices={voices}
                  onChange={(voiceName) =>
                    setVoiceMap((prev) => ({
                      ...prev,
                      [host]: voices.find((v) => v.name === voiceName),
                    }))
                  }
                />
              ))}
            </div>
          </div>

          {podcastMode === PodcastMode.Dialogue && (
            <div className="border-t border-white/10 pt-3 w-full">
              <button
                onClick={handlePrepareTTS}
                disabled={isPreparingTTS}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-text-secondary bg-white/5 hover:bg-white/10 disabled:bg-slate-100/10 disabled:text-text-secondary/50"
                type="button"
              >
                {isPreparingTTS ? (
                  <SpinnerIcon className="w-5 h-5 mr-2" />
                ) : (
                  <ElevenLabsIcon className="w-5 h-5 mr-2 text-text-secondary" />
                )}
                {isPreparingTTS ? "Preparing..." : "Prepare for Pro TTS (ElevenLabs)"}
              </button>

              {ttsChunks && <TTSChunkDisplay chunks={ttsChunks} level={level as LevelId} onCopy={handleCopy} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookletDisplay;
