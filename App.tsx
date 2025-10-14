// src/App.tsx
// Ultimate Pro (vFinal): production-grade, SSR-safe, exactOptionalPropertyTypes-safe, low-rerender selectors

import React, {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GenerateIcon } from "./components/Icons";
import Toast from "./components/Toast";
import { useAppStore } from "./store/appStore";
import type { GenerationStep } from "./types/index";

// ----------------------------- lazy registry + smart preload -----------------------------
const Lazy = {
  HomeScreen: lazy(() => import("./components/HomeScreen")),
  ControlPanel: lazy(() => import("./components/ControlPanel")),
  LeftDock: lazy(() => import("./components/LeftDock")),
  BookletDisplay: lazy(() => import("./components/BookletDisplay")),
  PublishingDashboard: lazy(() => import("./components/PublishingDashboard")),
  GrowthToolsModal: lazy(() => import("./components/GrowthToolsModal")),
  Starfield: lazy(() => import("./components/Starfield")),
} as const;

type LazyKey = keyof typeof Lazy;

const preloadMap: Partial<Record<LazyKey, () => void>> = {
  ControlPanel: () => void import("./components/ControlPanel"),
  LeftDock: () => void import("./components/LeftDock"),
  BookletDisplay: () => void import("./components/BookletDisplay"),
  PublishingDashboard: () => void import("./components/PublishingDashboard"),
  GrowthToolsModal: () => void import("./components/GrowthToolsModal"),
};

/** Idle preload with safe fallback, returns a cancel function */
const requestIdle = (cb: () => void, timeout = 200): (() => void) => {
  if (typeof window === "undefined") return () => {};
  const w = window as {
    requestIdleCallback?: (f: () => void, o?: { timeout?: number }) => number;
    cancelIdleCallback?: (id: number) => void;
    setTimeout: typeof window.setTimeout;
    clearTimeout: typeof window.clearTimeout;
  };
  if (w.requestIdleCallback && w.cancelIdleCallback) {
    const id = w.requestIdleCallback(cb, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const t = w.setTimeout(cb, timeout);
  return () => w.clearTimeout(t);
};

const smartPreload = () => {
  if (typeof navigator === "undefined") return;
  // Network Information API is optional; guard it
  const conn = (navigator as any)?.connection?.effectiveType as
    | "slow-2g"
    | "2g"
    | "3g"
    | "4g"
    | undefined;
  const ok = conn === "4g" || conn === undefined;
  if (!ok) return;
  requestIdle(() => {
    preloadMap.ControlPanel?.();
    preloadMap.LeftDock?.();
    preloadMap.BookletDisplay?.();
  });
};

// ----------------------------- a11y + motion utils -----------------------------
const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => setReduced(!!mq.matches);
    update();

    const handler = () => update();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    // Legacy Safari
    // @ts-ignore
    mq.addListener?.(handler);
    return () => {
      // @ts-ignore
      mq.removeListener?.(handler);
    };
  }, []);
  return reduced;
};

// ----------------------------- global error boundary -----------------------------
interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  fallbackKey?: React.Key;
  children?: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; prevKey: React.Key | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, prevKey: props.fallbackKey ?? null };
  }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  static getDerivedStateFromProps(
    nextProps: ErrorBoundaryProps,
    prevState: { hasError: boolean; prevKey: React.Key | null }
  ) {
    const nextKey = nextProps.fallbackKey ?? null;
    if (nextKey !== prevState.prevKey) {
      return { hasError: false, prevKey: nextKey };
    }
    return null;
  }
  override componentDidCatch(_error: unknown, _info: unknown) {}
  override render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <div className="p-4">Something went wrong.</div>;
    }
    return this.props.children;
  }
}

// ----------------------------- stepper -----------------------------
const stepOrder: Record<GenerationStep, number> = {
  idle: 1,
  planning: 2,
  generating: 3,
  complete: 5,
  error: 1,
} as const;

const stepsConfig = [
  { number: 1, label: "Lesson" },
  { number: 2, label: "AI & Persona" },
  { number: 3, label: "Podcast" },
  { number: 4, label: "Review" },
  { number: 5, label: "Export" },
] as const;

const Stepper = memo(function Stepper() {
  const generationStep = useAppStore((s) => s.generationStep);
  const current = stepOrder[generationStep];
  return (
    <nav
      className="bg-glass/80 backdrop-blur-card border-b border-t border-white/10"
      aria-label="Content Creation Steps"
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <ol className="stepper" role="list">
          {stepsConfig.map((step, idx) => {
            const active = current >= step.number;
            return (
              <React.Fragment key={step.number}>
                <li
                  className={`step ${active ? "active" : "inactive"}`}
                  aria-current={active ? "step" : undefined}
                >
                  <div className="step-icon" aria-hidden="true" title={`Step ${step.number}`}>
                    {step.number}
                  </div>
                  <span className="hidden sm:inline">{step.label}</span>
                </li>
                {idx < stepsConfig.length - 1 && (
                  <div
                    className={`step-line ${current >= step.number + 1 ? "active" : ""}`}
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </nav>
  );
});

// ----------------------------- builder screen -----------------------------
type Particle = { id: number; x: number; y: number; size: number };

const BuilderScreen = memo(function BuilderScreen({
  isLoading,
  onGenerate,
  ctaRef,
  buttonText,
  particles,
  prefersReducedMotion,
}: {
  isLoading: boolean;
  onGenerate: () => void;
  ctaRef: React.RefObject<HTMLButtonElement | null>;
  buttonText: string;
  particles: Particle[];
  prefersReducedMotion: boolean;
}) {
  return (
    <div className="flex-grow flex flex-col">
      <main
        id="main"
        className="flex-grow grid grid-cols-12 gap-6 p-6 h-full min-h-0"
        role="main"
        tabIndex={-1}
      >
        <aside className="col-span-12 lg:col-span-3 h-full overflow-y-auto relative">
          <div className="absolute top-0 left-4 h-full w-px bg-gradient-to-b from-brand-from/0 via-brand-from/30 to-brand-from/0" />
          <Suspense fallback={<div className="p-4 text-text-secondary">Loading tools…</div>}>
            <Lazy.LeftDock />
          </Suspense>
        </aside>

        <div className="col-span-12 lg:col-span-4 flex flex-col h-full min-h-0">
          <div className="flex-grow overflow-y-auto p-1" style={{ perspective: "1000px" }}>
            <Suspense fallback={<div className="p-4 text-text-secondary">Loading panel…</div>}>
              <Lazy.ControlPanel />
            </Suspense>
          </div>
          <div className="flex-shrink-0 pt-6 relative">
            <button
              ref={ctaRef}
              type="button"
              onClick={onGenerate}
              disabled={isLoading}
              className="relative overflow-hidden w-full flex items-center justify-center px-6 py-3 border border-transparent text-lg font-semibold rounded-2xl shadow-panel text-white bg-gradient-to-r from-brand-from to-brand-to hover:from-brand-from/90 hover:to-brand-to/90 focus:outline-none focus:ring-4 focus:ring-brand-from/40 disabled:from-brand-from/50 disabled:to-brand-to/50 disabled:cursor-not-allowed transition-transform duration-200 transform hover:scale-[1.02] active:scale-[0.98] cta-sheen cta-pulse"
              aria-busy={isLoading}
              aria-live="polite"
            >
              <GenerateIcon className={`h-7 w-7 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              <span>{buttonText}</span>
            </button>

            {!prefersReducedMotion &&
              particles.map((p) => (
                <div
                  key={p.id}
                  className="particle"
                  style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
                  aria-hidden="true"
                />
              ))}
          </div>
        </div>

        <section
          className="col-span-12 lg:col-span-5 min-w-0 h-full relative"
          aria-label="Generated Content"
        >
          <div className="absolute top-0 right-4 h-full w-px bg-gradient-to-b from-accent/0 via-accent/30 to-accent/0" />
          <Suspense fallback={<div className="p-6 text-text-secondary">Loading content…</div>}>
            <Lazy.BookletDisplay />
          </Suspense>
        </section>
      </main>
    </div>
  );
});

// ----------------------------- root app -----------------------------
const App: React.FC = () => {
  // fine-grained selectors to minimize rerenders
  const toastMessage = useAppStore((s) => s.toastMessage);
  const setToastMessage = useAppStore((s) => s.setToastMessage);
  const loadSession = useAppStore((s) => s.loadSession);
  const isPublishingDashboardOpen = useAppStore((s) => s.isPublishingDashboardOpen);
  const isGrowthToolsModalOpen = useAppStore((s) => s.isGrowthToolsModalOpen);
  const currentScreen = useAppStore((s) => s.currentScreen);
  const generationStep = useAppStore((s) => s.generationStep);
  const generateContent = useAppStore((s) => s.generateContent);
  const isDailyScriptEngineEnabled = useAppStore((s) => s.isDailyScriptEngineEnabled);

  const prefersReducedMotion = usePrefersReducedMotion();

  // FX particles
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleId = useRef(0);
  const particleTimeoutRef = useRef<number | null>(null);
  const ctaRef = useRef<HTMLButtonElement | null>(null);

  const isLoading = useMemo(
    () => generationStep === "planning" || generationStep === "generating",
    [generationStep]
  );

  // boot
  useEffect(() => {
    loadSession();
    smartPreload();
  }, [loadSession]);

  // page visibility class toggle
  useEffect(() => {
    const onVisibility = () => {
      if (typeof document === "undefined") return;
      document.body.classList.toggle("page-hidden", document.hidden);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // opportunistic deep preload after idle (second wave)
  useEffect(() => {
    const cancel = requestIdle(() => {
      void Promise.allSettled([
        import("./components/PublishingDashboard"),
        import("./components/GrowthToolsModal"),
      ]);
    }, 600);
    return cancel;
  }, []);

  // particles
  const spawnParticles = useCallback((rect: DOMRect) => {
    const count = 12;
    const items: Particle[] = Array.from({ length: count }).map(() => {
      particleId.current += 1;
      return {
        id: particleId.current,
        x: rect.left + rect.width * Math.random(),
        y: rect.top + rect.height * Math.random(),
        size: Math.random() * 4 + 2,
      };
    });
    setParticles(items);
    if (particleTimeoutRef.current) window.clearTimeout(particleTimeoutRef.current);
    particleTimeoutRef.current = window.setTimeout(() => setParticles([]), 280);
  }, []);

  useEffect(() => {
    return () => {
      if (particleTimeoutRef.current) window.clearTimeout(particleTimeoutRef.current);
    };
  }, []);

  const handleGenerateClick = useCallback(() => {
    generateContent();
    if (prefersReducedMotion) return;
    const el = ctaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    spawnParticles(rect);
  }, [generateContent, prefersReducedMotion, spawnParticles]);

  // autofocus main on builder entry
  useEffect(() => {
    if (currentScreen === "builder") {
      document.getElementById("main")?.focus?.();
    }
  }, [currentScreen]);

  const buttonText = useMemo(() => {
    if (generationStep === "planning") return "Planning…";
    if (generationStep === "generating") return "Generating…";
    return isDailyScriptEngineEnabled ? "Generate Daily Script" : "Generate Story";
  }, [generationStep, isDailyScriptEngineEnabled]);

  return (
    <div className="min-h-screen bg-cosmic font-sans text-text-primary flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white/10 focus:text-white focus:px-3 focus:py-2 focus:rounded"
      >
        Skip to content
      </a>

      <Suspense fallback={null}>
        <Lazy.Starfield />
      </Suspense>

      <div className="fixed inset-0 bg-gradient-to-b from-[rgba(6,10,24,0.75)] to-[rgba(6,10,24,0.92)] -z-10" />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />

      {isPublishingDashboardOpen && (
        <ErrorBoundary
          fallbackKey="publishing"
          fallback={<div className="p-4">Publishing dashboard failed to load.</div>}
        >
          <Suspense fallback={<div className="p-6 text-text-secondary">Opening publishing dashboard…</div>}>
            <Lazy.PublishingDashboard />
          </Suspense>
        </ErrorBoundary>
      )}

      {isGrowthToolsModalOpen && (
        <ErrorBoundary
          fallbackKey="growth-tools"
          fallback={<div className="p-4">Growth tools failed to load.</div>}
        >
          <Suspense fallback={<div className="p-6 text-text-secondary">Loading growth tools…</div>}>
            <Lazy.GrowthToolsModal />
          </Suspense>
        </ErrorBoundary>
      )}

      {currentScreen === "builder" && <Stepper />}

      <div className="flex-grow flex flex-col">
        <ErrorBoundary
          fallbackKey={currentScreen}
          fallback={
            <div className="flex-grow flex items-center justify-center text-text-secondary p-8">
              Screen failed to load.
            </div>
          }
        >
          <Suspense
            fallback={
              <div className="flex-grow flex items-center justify-center text-text-secondary">
                Loading Screen...
              </div>
            }
          >
            {currentScreen === "home" ? (
              <Lazy.HomeScreen />
            ) : (
              <BuilderScreen
                isLoading={isLoading}
                onGenerate={handleGenerateClick}
                ctaRef={ctaRef}
                buttonText={buttonText}
                particles={particles}
                prefersReducedMotion={prefersReducedMotion}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </div>

      <footer
        className="flex-shrink-0 py-3 px-4 sm:px-6 lg:px-8 bg-glass/50 backdrop-blur-lg border-t border-white/10"
        role="contentinfo"
      />
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {buttonText}
      </div>
    </div>
  );
};

export default App;
