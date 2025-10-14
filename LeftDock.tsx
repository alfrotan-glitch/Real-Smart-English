// components/LeftDock.tsx
// Clean, accessible, and aligned with the rest of the UI system.

import React, { memo, useCallback, useId, useMemo, useRef, useState } from 'react';
import type { useAppStore } from '../store/appStore';
import type {
  TrashIcon,
  UploadIcon,
  ChannelIcon,
  PlaylistIcon,
  PlusCircleIcon,
  XCircleIcon,
  DnaIcon,
} from './Icons';
import type { DnaSection, InputField, TextareaField } from './FormControls';
import PrismCard from './PrismCard';

/* =========================
   Utils
========================= */
const parseSrtContent = (srtText: string): string => {
  // Normalize line endings and strip sequence numbers + timestamps, then collapse to a single space
  const normalized = srtText.replace(/\r\n?/g, '\n');
  const noTimestamps = normalized.replace(
    /\d{2}:\d{2}:\d{2},\d{3}\s-->\s\d{2}:\d{2}:\d{2},\d{3}/g,
    ''
  );
  const noSeqNums = noTimestamps.replace(/^\s*\d+\s*$/gm, '');
  return noSeqNums
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .join(' ');
};

/* =========================
   Component
========================= */
const LeftDock: React.FC = () => {
  const {
    channelName,
    setChannelName,
    channelDescription,
    setChannelDescription,
    targetAudience,
    setTargetAudience,
    supplementalContent,
    setSupplementalContent,
    previousContent,
    addPreviousContent,
    removePreviousContent,
    clearPreviousContent,
    learnerInterests,
    addLearnerInterest,
    removeLearnerInterest,
    learnerDNA,
  } = useAppStore();

  const inputSeed = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [newInterest, setNewInterest] = useState('');
  const [showAddContent, setShowAddContent] = useState(false);
  const [newContentTitle, setNewContentTitle] = useState('');
  const [newContentSummary, setNewContentSummary] = useState('');

  const hasSupplementalContent = useMemo(
    () => supplementalContent.trim().length > 0,
    [supplementalContent]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Only accept .srt explicitly (UI already restricts via accept)
      if (!/\.srt$/i.test(file.name)) return;

      const reader = new FileReader();
      reader.onload = ev => {
        const text = String(ev.target?.result ?? '');
        const parsed = parseSrtContent(text);
        setSupplementalContent(parsed);
        setUploadedFileName(file.name);
      };
      reader.readAsText(file);
    },
    [setSupplementalContent]
  );

  const clearSupplemental = useCallback(() => {
    setSupplementalContent('');
    setUploadedFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [setSupplementalContent]);

  const handleAddInterest = useCallback(
    (ev: React.FormEvent) => {
      ev.preventDefault();
      const v = newInterest.trim();
      if (!v) return;
      addLearnerInterest(v);
      setNewInterest('');
    },
    [addLearnerInterest, newInterest]
  );

  const handleAddContentItem = useCallback(() => {
    const title = newContentTitle.trim();
    const summary = newContentSummary.trim();
    if (!title || !summary) return;

    addPreviousContent({ title, summary });
    setNewContentTitle('');
    setNewContentSummary('');
    setShowAddContent(false);
  }, [addPreviousContent, newContentTitle, newContentSummary]);

  const srtInputId = `${inputSeed}-srt-upload`;

  return (
    <div className="space-y-4">
      {/* Channel Identity */}
      <PrismCard title="Channel Identity" icon={<ChannelIcon className="w-6 h-6 text-accent" />}>
        <InputField
          id={`${inputSeed}-channel-name`}
          label="Channel Name"
          value={channelName}
          onChange={setChannelName}
          placeholder="e.g., Learn English Online"
          className="bg-glass/50 border-white/20 rounded-button"
        />
        <TextareaField
          id={`${inputSeed}-channel-description`}
          label="Channel Description"
          value={channelDescription}
          onChange={setChannelDescription}
          placeholder="e.g., A friendly channel for intermediate learners..."
          rows={4}
        />
        <TextareaField
          id={`${inputSeed}-target-audience`}
          label="Target Audience"
          value={targetAudience}
          onChange={setTargetAudience}
          placeholder="e.g., B1-B2 level students..."
          rows={2}
        />
      </PrismCard>

      {/* Context Library */}
      <PrismCard title="Context Library" icon={<PlaylistIcon className="w-6 h-6 text-accent" />}>
        <div className="flex justify-between items-center mb-1.5">
          <label
            htmlFor={`${inputSeed}-supplemental-content`}
            className="text-sm font-medium text-text-secondary"
          >
            Paste Text or Upload SRT
          </label>
          {hasSupplementalContent && (
            <button
              type="button"
              onClick={clearSupplemental}
              className="text-xs text-danger hover:text-danger/80 font-medium flex items-center"
            >
              <TrashIcon className="w-3 h-3 mr-1" /> Clear
            </button>
          )}
        </div>

        <TextareaField
          id={`${inputSeed}-supplemental-content`}
          label=""
          value={supplementalContent}
          onChange={v => {
            setSupplementalContent(v);
            if (uploadedFileName) setUploadedFileName(null);
          }}
          rows={4}
          placeholder="Paste your script or text here..."
        />

        <div className="mt-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept=".srt"
            className="hidden"
            id={srtInputId}
          />
          <label
            htmlFor={srtInputId}
            className="w-full cursor-pointer flex items-center justify-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg bg-white/5 hover:bg-white/10"
          >
            <UploadIcon className="w-5 h-5 mr-2 text-text-secondary/80" />
            Upload .srt file
          </label>
          {uploadedFileName && (
            <p className="text-xs text-text-secondary/80 mt-2 text-center" aria-live="polite">
              File loaded: <span className="font-medium">{uploadedFileName}</span>
            </p>
          )}
        </div>

        <hr className="border-t border-white/10 my-4" />

        <p className="text-sm font-medium text-text-secondary">Previous Content History</p>

        {previousContent.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 mt-2">
            {previousContent.map(item => (
              <div key={item.id} className="p-2 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-text-primary text-sm">{item.title}</p>
                  <button
                    type="button"
                    onClick={() => removePreviousContent(item.id)}
                    className="text-text-secondary/50 hover:text-danger flex-shrink-0 ml-2"
                    aria-label={`Remove "${item.title}"`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">{item.summary}</p>
              </div>
            ))}
          </div>
        )}

        {showAddContent && (
          <div className="p-2 bg-brand-from/10 border border-brand-from/20 rounded-lg mt-2 space-y-2">
            <InputField
              id={`${inputSeed}-new-content-title`}
              label=""
              value={newContentTitle}
              onChange={setNewContentTitle}
              placeholder="Content Title"
            />
            <TextareaField
              id={`${inputSeed}-new-content-summary`}
              label=""
              value={newContentSummary}
              onChange={setNewContentSummary}
              placeholder="Summary..."
              rows={2}
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddContent(false)}
                className="px-3 py-1 text-sm text-text-secondary rounded-md hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddContentItem}
                className="px-3 py-1 text-sm text-white bg-brand-from rounded-md hover:bg-brand-to disabled:opacity-60"
                disabled={!newContentTitle.trim() || !newContentSummary.trim()}
              >
                Add
              </button>
            </div>
          </div>
        )}

        <div className="mt-2 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowAddContent(true)}
            className="w-full text-sm font-medium text-brand-from hover:text-brand-to flex items-center justify-center py-1.5 border-2 border-dashed border-brand-from/20 hover:border-brand-from/50 rounded-lg"
          >
            <PlusCircleIcon className="w-4 h-4 mr-1" /> Add Content
          </button>
          {previousContent.length > 0 && (
            <button
              type="button"
              onClick={clearPreviousContent}
              className="flex-shrink-0 text-xs text-danger hover:text-danger/80 font-medium flex items-center"
              aria-label="Clear all previous content"
            >
              <TrashIcon className="w-3 h-3 mr-1" /> Clear
            </button>
          )}
        </div>
      </PrismCard>

      {/* Learner Profile */}
      <PrismCard title="Learner Profile" icon={<DnaIcon className="w-6 h-6 text-accent" />}>
        <div className="p-3 bg-white/5 rounded-lg">
          <p className="text-xs text-text-secondary/80 mb-2">
            Add the learner&apos;s interests to make content more engaging.
          </p>

          {learnerInterests.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {learnerInterests.map(interest => (
                <div
                  key={interest}
                  className="flex items-center bg-brand-from/20 text-brand-from text-xs font-medium pl-2.5 pr-1 py-0.5 rounded-full"
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeLearnerInterest(interest)}
                    className="ml-1 flex-shrink-0"
                    aria-label={`Remove interest ${interest}`}
                  >
                    <XCircleIcon className="w-4 h-4 text-brand-from/50 hover:text-brand-from" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddInterest} className="flex items-center space-x-2">
            <InputField
              id={`${inputSeed}-new-interest`}
              label=""
              value={newInterest}
              onChange={setNewInterest}
              placeholder="e.g., Space Exploration"
            />
            <button
              type="submit"
              className="px-3 py-2 text-sm text-white bg-brand-from rounded-md hover:bg-brand-to font-semibold disabled:opacity-60"
              disabled={!newInterest.trim()}
            >
              Add
            </button>
          </form>
        </div>

        {learnerDNA && (
          <div className="mt-4 space-y-3 text-xs">
            <DnaSection title="Strengths" items={learnerDNA.strengths} color="green" />
            <DnaSection
              title="Persistent Weaknesses"
              items={learnerDNA.persistentWeaknesses}
              color="red"
            />
            <DnaSection
              title="Inferred Interests"
              items={learnerDNA.inferredInterests}
              color="blue"
            />
            <DnaSection
              title="Next Recommended Steps"
              items={learnerDNA.nextRecommendedSteps}
              color="purple"
            />
          </div>
        )}
      </PrismCard>
    </div>
  );
};

export default memo(LeftDock);
