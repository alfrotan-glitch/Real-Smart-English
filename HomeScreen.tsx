// components/HomeScreen.tsx
// Minimal re-renders, a11y-forward, store-aligned.

import React, { memo, useCallback, useMemo } from 'react';
import type { useAppStore } from '../store/appStore';
import type {
  PlusCircleIcon,
  SparklesIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
  SunIcon,
  InformationCircleIcon,
} from './Icons';

/* =========================
   Presentational pieces
========================= */
type QuickStartCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
};

const QuickStartCard = memo(function QuickStartCard({
  icon,
  title,
  description,
  onClick,
  className,
}: QuickStartCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-5 bg-glass/70 backdrop-blur-card rounded-card shadow-card border border-white/10 transition-all duration-300 ease-in-out hover:bg-white/20 hover:shadow-glow hover:-translate-y-1 hover:border-brand-to/50 ${
        className || ''
      }`}
      aria-label={title}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0 text-accent bg-accent/10 p-3 rounded-full" aria-hidden="true">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
      </div>
    </button>
  );
});

type DockItemProps = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
};

const DockItem = memo(function DockItem({ icon, label, onClick }: DockItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center space-y-1 p-2 rounded-lg text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors group"
      aria-label={label}
    >
      {icon}
      <span className="text-xs font-medium transition-opacity opacity-0 group-hover:opacity-100">{label}</span>
    </button>
  );
});

/* =========================
   Main Screen
========================= */
const HomeScreen: React.FC = () => {
  const { setCurrentScreen, startNewSession } = useAppStore();

  const handleCreateNew = useCallback(() => {
    startNewSession();
    setCurrentScreen('builder');
  }, [startNewSession, setCurrentScreen]);

  const goToBuilder = useCallback(() => setCurrentScreen('builder'), [setCurrentScreen]);

  // Stable data for rendering lists
  const quickCards = useMemo<QuickStartCardProps[]>(
    () => [
      {
        icon: <PlusCircleIcon className="w-6 h-6" />,
        title: 'Create New',
        description: 'Start a fresh project from scratch.',
        onClick: handleCreateNew,
        className: 'animate-slide-up',
      },
      {
        icon: <SparklesIcon className="w-6 h-6" />,
        title: 'Presets',
        description: 'Explore popular lesson configurations.',
        onClick: goToBuilder,
      },
      {
        icon: <ClockIcon className="w-6 h-6" />,
        title: 'Recent Projects',
        description: 'Pick up where you left off.',
      },
      {
        icon: <QuestionMarkCircleIcon className="w-6 h-6" />,
        title: 'Help & Shortcuts',
        description: 'Learn the ropes and speed up.',
      },
    ],
    [handleCreateNew, goToBuilder]
  );

  const dockItems = useMemo<DockItemProps[]>(
    () => [
      { icon: <ClockIcon className="w-6 h-6" />, label: 'History' },
      { icon: <Cog6ToothIcon className="w-6 h-6" />, label: 'Settings' },
      { icon: <SunIcon className="w-6 h-6" />, label: 'Theme' },
      { icon: <InformationCircleIcon className="w-6 h-6" />, label: 'About' },
    ],
    []
  );

  return (
    <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-12 gap-8">
        {/* Main content */}
        <div className="col-span-12 lg:col-span-11 flex flex-col justify-center">
          {/* Hero */}
          <div className="text-center lg:text-left mb-12">
            <h1 className="text-5xl md:text-6xl font-brand bg-clip-text text-transparent bg-gradient-to-r from-brand-from to-brand-to">
              Build compelling ESL monologues
            </h1>
            <p className="mt-4 text-xl text-text-secondary max-w-2xl mx-auto lg:mx-0">
              Cosmic calm, crystal-clear controls, professional results.
            </p>
          </div>

          {/* Quick start */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickCards.map((card) => (
              <QuickStartCard key={card.title} {...card} />
            ))}
          </div>
        </div>

        {/* Side dock */}
        <aside className="hidden lg:col-span-1 lg:flex flex-col items-center justify-center">
          <div
            className="p-2 space-y-2 bg-glass/70 backdrop-blur-card rounded-panel shadow-panel border border-white/10"
            role="toolbar"
            aria-label="Quick tools"
          >
            {dockItems.map((it) => (
              <DockItem key={it.label} {...it} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default memo(HomeScreen);
