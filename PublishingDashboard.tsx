// components/PublishingDashboard.tsx
// Final, production-grade. React 19 / TS5 / Vite 7. ESM-only. English-only inside code.

import React, { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import { useAppStore } from "../store/appStore";
import { CheckCircleIcon, TrendIcon, CopyIcon, RefreshIcon } from "./Icons";

type Conn = "disconnected" | "connected";
type Upload = "idle" | "uploading" | "complete";

const PublishingDashboard: React.FC = () => {
  // minimal selectors to avoid re-renders
  const setIsPublishingDashboardOpen = useAppStore((s) => s.setIsPublishingDashboardOpen);
  const performanceHistory = useAppStore((s) => s.performanceHistory);
  const setToastMessage = useAppStore((s) => s.setToastMessage);

  // SEO + UploadPack + helpers
  const seoBundle = useAppStore((s) => s.seoBundle);
  const uploadPack = useAppStore((s) => s.uploadPack);
  const supplementalContent = useAppStore((s) => s.supplementalContent);
  const generateSeo = useAppStore((s) => s.generateSeo);

  const [connectionStatus, setConnectionStatus] = useState<Conn>("disconnected");
  const [uploadStatus, setUploadStatus] = useState<Upload>("idle");
  const [seoBusy, setSeoBusy] = useState(false);

  // focus management
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setIsPublishingDashboardOpen(false), [setIsPublishingDashboardOpen]);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const d = dialogRef.current;
    if (d) {
      const focusables = getFocusable(d);
      (focusables[0] ?? d).focus();
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocusedRef.current?.focus?.();
    };
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key === "Tab") {
        const container = dialogRef.current;
        if (!container) return;
        const focusables = getFocusable(container);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    },
    [close]
  );

  const onBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) close();
    },
    [close]
  );

  // simulate account connect/upload
  const handleConnect = useCallback(() => {
    setConnectionStatus("connected");
    setToastMessage("YouTube account connected successfully (simulation).");
  }, [setToastMessage]);

  const handleUpload = useCallback(
    (type: "draft" | "schedule") => {
      if (connectionStatus !== "connected" || uploadStatus === "uploading") return;
      setUploadStatus("uploading");
      window.setTimeout(() => {
        setUploadStatus("complete");
        setToastMessage(`Content uploaded as ${type} successfully (simulation).`);
      }, 1500);
    },
    [connectionStatus, uploadStatus, setToastMessage]
  );

  const handleClose = useCallback(() => close(), [close]);

  // performance memo
  const ctr = useMemo(() => performanceHistory?.predicted?.ctr ?? 0, [performanceHistory]);
  const ctrActual = useMemo(() => performanceHistory?.actual?.ctr ?? 0, [performanceHistory]);
  const ret = useMemo(() => performanceHistory?.predicted?.retention ?? 0, [performanceHistory]);
  const retActual = useMemo(() => performanceHistory?.actual?.retention ?? 0, [performanceHistory]);

  // copy helper
  const copy = useCallback(
    async (label: string, text?: string | null) => {
      try {
        await navigator.clipboard.writeText(text ?? "");
        setToastMessage(`${label} copied.`);
      } catch {
        setToastMessage(`Failed to copy ${label}.`);
      }
    },
    [setToastMessage]
  );

  // generate SEO / chapters on demand
  const onGenerateSeo = useCallback(async () => {
    if (seoBusy) return;
    setSeoBusy(true);
    try {
      await generateSeo();
    } finally {
      setSeoBusy(false);
    }
  }, [generateSeo, seoBusy]);

  const chaptersMissing = !seoBundle?.chapters || seoBundle.chapters.length === 0;
  const canGenerateFromSrt = (supplementalContent ?? "").trim().length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publishing-dialog-title"
      aria-describedby="publishing-dialog-desc"
      onMouseDown={onBackdropClick}
      onKeyDown={onKeyDown}
    >
      <div
        ref={dialogRef}
        className="bg-gradient-to-br from-slate-50 to-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col outline-none animate-fade-in"
        tabIndex={-1}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
          <h2 id="publishing-dialog-title" className="text-xl font-bold text-slate-800">
            Publishing Dashboard & SEO Pack
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            aria-label="Close"
            title="Close"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main id="publishing-dialog-desc" className="flex-grow p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Connection & Upload */}
          <div className="space-y-6">
            <section className="p-5 bg-white rounded-xl shadow-md border border-slate-200/80">
              <h3 className="text-lg font-bold text-slate-700 mb-3">1. Connect to YouTube</h3>
              {connectionStatus === "disconnected" ? (
                <>
                  <p className="text-sm text-slate-500 mb-4">Connect your YouTube account to enable direct publishing.</p>
                  <button
                    onClick={handleConnect}
                    className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-300"
                    type="button"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.267,4,12,4,12,4S5.733,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.733,2,12,2,12s0,4.267,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.733,20,12,20,12,20s6.267,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.267,22,12,22,12S22,7.733,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z"></path>
                    </svg>
                    Connect YouTube Account
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                  <CheckCircleIcon className="w-6 h-6" />
                  <div>
                    <p className="font-semibold">Account Connected</p>
                    <p className="text-sm">Ready to publish.</p>
                  </div>
                </div>
              )}
            </section>

            <section
              className={`p-5 bg-white rounded-xl shadow-md border border-slate-200/80 ${
                connectionStatus === "disconnected" ? "opacity-50 pointer-events-none" : ""
              }`}
              aria-disabled={connectionStatus === "disconnected" ? "true" : undefined}
            >
              <h3 className="text-lg font-bold text-slate-700 mb-3">2. Publish Content</h3>
              {uploadStatus === "complete" ? (
                <div className="flex items-center space-x-3 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                  <CheckCircleIcon className="w-6 h-6" />
                  <div>
                    <p className="font-semibold">Upload Complete!</p>
                    <button
                      onClick={() => setUploadStatus("idle")}
                      className="text-sm underline focus:outline-none focus:ring-2 focus:ring-green-300"
                      type="button"
                    >
                      Upload another
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">Choose how to publish this content to your connected channel.</p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleUpload("draft")}
                      disabled={uploadStatus === "uploading"}
                      className="flex-1 px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-700 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                      type="button"
                    >
                      {uploadStatus === "uploading" ? "Uploading..." : "Upload as Draft"}
                    </button>
                    <button
                      onClick={() => handleUpload("schedule")}
                      disabled={uploadStatus === "uploading"}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      type="button"
                    >
                      {uploadStatus === "uploading" ? "..." : "Schedule"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right: SEO & Analytics */}
          <div className="space-y-6">
            {/* SEO / UploadPack Preview */}
            <section className="p-5 bg-white rounded-xl shadow-md border border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-700">SEO & Upload Pack</h3>
                <div className="flex gap-2">
                  <button
                    onClick={onGenerateSeo}
                    disabled={seoBusy}
                    className="px-3 py-1.5 text-sm rounded-lg border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50"
                    title="Generate SEO from current context"
                    aria-label="Generate SEO"
                    type="button"
                  >
                    {seoBusy ? "Generating…" : "Generate SEO"}
                  </button>
                  {chaptersMissing && canGenerateFromSrt && (
                    <button
                      onClick={onGenerateSeo}
                      className="px-3 py-1.5 text-sm rounded-lg border border-sky-300 text-sky-700 bg-sky-50 hover:bg-sky-100 flex items-center"
                      title="Generate Chapters from SRT"
                      aria-label="Generate Chapters from SRT"
                      type="button"
                    >
                      <RefreshIcon className="w-4 h-4 mr-1" /> Chapters from SRT
                    </button>
                  )}
                </div>
              </div>

              {!seoBundle && (
                <p className="text-sm text-slate-500">
                  No SEO bundle yet. Use <strong>Generate SEO</strong> to produce Title, Description, Tags, and Chapters.
                </p>
              )}

              {seoBundle && (
                <div className="space-y-4">
                  <Row label="SEO Title" value={seoBundle.seoTitle ?? ""} onCopy={() => copy("Title", seoBundle.seoTitle)} />
                  <Row
                    label="Primary Keyword"
                    value={seoBundle.primaryKeyword || ""}
                    onCopy={() => copy("Primary Keyword", seoBundle.primaryKeyword)}
                  />
                  <Row
                    label="Description"
                    value={seoBundle.seoDescription ?? ""}
                    multiline
                    onCopy={() => copy("Description", seoBundle.seoDescription)}
                  />
                  <Row
                    label="Tags"
                    value={(seoBundle.seoTags ?? []).join(", ")}
                    onCopy={() => copy("Tags", (seoBundle.seoTags ?? []).join(", "))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Row
                      label="Video Filename"
                      value={seoBundle.filenames?.video || ""}
                      onCopy={() => copy("Video Filename", seoBundle.filenames?.video)}
                    />
                    <Row
                      label="Thumbnail Filename"
                      value={seoBundle.filenames?.thumbnail || ""}
                      onCopy={() => copy("Thumbnail Filename", seoBundle.filenames?.thumbnail)}
                    />
                  </div>
                  <ChaptersTable
                    chapters={seoBundle.chapters || []}
                    onCopyAll={() =>
                      copy(
                        "Chapters",
                        (seoBundle.chapters || [])
                          .map((c) => `${c.at} ${c.title}`)
                          .join("\n")
                      )
                    }
                  />
                </div>
              )}

              {uploadPack && (
                <div className="mt-5 pt-5 border-t border-slate-200">
                  <h4 className="text-md font-semibold text-slate-700 mb-2">Upload Pack (Final)</h4>
                  <Row label="Title" value={uploadPack.title ?? ""} onCopy={() => copy("Upload Title", uploadPack.title)} />
                  <Row
                    label="Description"
                    value={uploadPack.description ?? ""}
                    multiline
                    onCopy={() => copy("Upload Description", uploadPack.description)}
                  />
                  <Row
                    label="Tags"
                    value={(uploadPack.tags ?? []).join(", ")}
                    onCopy={() => copy("Upload Tags", (uploadPack.tags ?? []).join(", "))}
                  />
                </div>
              )}
            </section>

            {/* Analytics (simulated) */}
            <section className="p-5 bg-white rounded-xl shadow-md border border-slate-200/80">
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
                <TrendIcon className="w-6 h-6 mr-2 text-indigo-500" />
                Performance Analysis (Simulated)
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-base font-semibold text-slate-800 mb-2">Click-Through Rate (CTR)</p>
                  <div className="flex items-center space-x-4">
                    <BarChart label="AI Prediction" value={ctr} max={10} colorClass="bg-sky-500" />
                    <BarChart label="Actual" value={ctrActual} max={10} colorClass="bg-green-500" />
                  </div>
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800 mb-2">Audience Retention</p>
                  <div className="flex items-center space-x-4">
                    <BarChart label="AI Prediction" value={ret} max={100} colorClass="bg-sky-500" />
                    <BarChart label="Actual" value={retActual} max={100} colorClass="bg-green-500" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default memo(PublishingDashboard);

// ---------- helpers ----------
function getFocusable(root: HTMLElement): HTMLElement[] {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
  return nodes.filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");
}

const Row = memo(
  ({
    label,
    value,
    multiline,
    onCopy,
  }: {
    label: string;
    value: string;
    multiline?: boolean;
    onCopy: () => void;
  }) => (
    <div className="grid grid-cols-12 gap-3 items-start">
      <div className="col-span-3 text-sm font-medium text-slate-600 pt-1.5">{label}</div>
      <div className="col-span-8">
        <div
          className={`text-sm text-slate-700 ${multiline ? "whitespace-pre-wrap" : "break-words"} bg-slate-50 border border-slate-200 rounded-lg p-2.5`}
        >
          {value}
        </div>
      </div>
      <div className="col-span-1">
        <button
          onClick={onCopy}
          className="w-full h-9 inline-flex items-center justify-center rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
          aria-label={`Copy ${label}`}
          title={`Copy ${label}`}
          type="button"
        >
          <CopyIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
);

const ChaptersTable = memo(
  ({
    chapters,
    onCopyAll,
  }: {
    chapters: { at: string; title: string }[];
    onCopyAll: () => void;
  }) => {
    if (!chapters || chapters.length === 0) {
      return <p className="text-sm text-slate-500">No chapters generated yet.</p>;
    }
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700">Chapters</p>
          <button
            onClick={onCopyAll}
            className="px-2.5 py-1 text-xs rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
            aria-label="Copy all chapters"
            type="button"
          >
            Copy All
          </button>
        </div>
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-3 py-2 border-b border-slate-200 w-24">At</th>
                <th className="text-left px-3 py-2 border-b border-slate-200">Title</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((c, i) => (
                <tr key={`${c.at}-${i}`} className="odd:bg-white even:bg-slate-50">
                  <td className="px-3 py-2 text-slate-700 tabular-nums">{c.at}</td>
                  <td className="px-3 py-2 text-slate-700">{c.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

const BarChart = memo(
  ({
    label,
    value,
    max,
    colorClass,
  }: {
    label: string;
    value: number;
    max: number;
    colorClass: string;
  }) => {
    const clamped = Math.max(0, Math.min(max, value));
    const percent = Math.max(0, Math.min(100, (clamped / max) * 100));
    const textColor = colorClass.replace("bg-", "text-");
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-slate-600">{label}</span>
          <span className={`text-sm font-bold ${textColor}`}>{clamped}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  }
);
