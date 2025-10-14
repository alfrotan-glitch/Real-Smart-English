// components/InteractiveExercises.tsx
// Accessible, race-free, and aligned with the UI system.

import React, {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import type { CheckCircleIcon, XCircleIcon } from './Icons';

/* =========================
   Types
========================= */
type ExerciseType = 'multiple-choice' | 'fill-in-the-blank';

type Exercise = Readonly<{
  type: ExerciseType;
  question: string;
  options?: string[];
  answer: string;
}>;

export interface ExerciseData {
  title: string;
  exercises: Exercise[];
}

interface InteractiveExercisesProps {
  data: ExerciseData;
  onMistakes: (mistakes: string[]) => void;
}

type ExerciseState = {
  userAnswer: string;
  submitted: boolean;
  reported: boolean; // prevent duplicate report of the same item
};

/* =========================
   Utils
========================= */
const normalize = (s: string) =>
  s
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

/* =========================
   Component
========================= */
const InteractiveExercises: React.FC<InteractiveExercisesProps> = ({
  data,
  onMistakes,
}) => {
  const groupSeed = useId();

  const initialState = useMemo<ExerciseState[]>(
    () =>
      data.exercises.map(() => ({
        userAnswer: '',
        submitted: false,
        reported: false,
      })),
    [data.exercises]
  );

  const [exerciseStates, setExerciseStates] =
    useState<ExerciseState[]>(initialState);

  // Reset when exercises change
  useEffect(() => {
    setExerciseStates(initialState);
  }, [initialState]);

  const handleAnswerChange = useCallback((index: number, answer: string) => {
    setExerciseStates(prev => {
      if (!prev[index]) return prev;
      const next = [...prev];
      next[index] = { ...next[index], userAnswer: answer };
      return next;
    });
  }, []);

  const handleCheck = useCallback(
    (index: number) => {
      let shouldReport = false;
      let correctAnswer = '';

      setExerciseStates(prev => {
        const cur = prev[index];
        if (!cur) return prev;

        const ex = data.exercises[index];
        const user = cur.userAnswer ?? '';
        const correct = normalize(user) === normalize(ex.answer);

        if (!correct && !cur.reported) {
          shouldReport = true;
          correctAnswer = ex.answer;
        }

        const next = [...prev];
        next[index] = {
          ...cur,
          submitted: true,
          reported: cur.reported || !correct,
        };
        return next;
      });

      if (shouldReport && correctAnswer) {
        onMistakes([correctAnswer]);
      }
    },
    [data.exercises, onMistakes]
  );

  const handleFibKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCheck(index);
      }
    },
    [handleCheck]
  );

  const renderExercise = useCallback(
    (exercise: Exercise, index: number) => {
      const state =
        exerciseStates[index] ??
        ({
          userAnswer: '',
          submitted: false,
          reported: false,
        } as ExerciseState);

      const { userAnswer, submitted } = state;
      const isCorrect =
        submitted && normalize(userAnswer) === normalize(exercise.answer);
      const isIncorrect = submitted && !isCorrect;

      const groupName = `${groupSeed}-ex-${index}`;
      const inputId = `${groupSeed}-fib-${index}`;
      const qId = `${groupSeed}-q-${index}`;
      const feedbackId = `${groupSeed}-fb-${index}`;

      return (
        <div
          key={index}
          className={`p-4 border-l-4 rounded-r-lg my-4 first:mt-0 last:mb-0 transition-colors ${
            isCorrect
              ? 'border-success bg-success/10'
              : isIncorrect
              ? 'border-danger bg-danger/10'
              : 'border-white/20 bg-white/5'
          }`}
          role="group"
          aria-labelledby={qId}
          aria-describedby={submitted ? feedbackId : undefined}
        >
          <p
            id={qId}
            className="font-semibold text-text-primary flex justify-between items-center"
          >
            {index + 1}. {exercise.question.replace('___', '_____')}
          </p>

          <div className="mt-3 space-y-2">
            {exercise.type === 'multiple-choice' &&
              (exercise.options ?? []).map((option, i) => {
                const checked = userAnswer === option;
                const rightOption =
                  submitted &&
                  normalize(option) === normalize(exercise.answer);
                const chosenWrong = submitted && checked && !rightOption;

                return (
                  <label
                    key={`${groupName}-opt-${i}`}
                    className={`flex items-center space-x-3 p-2 rounded-md ${
                      !submitted ? 'cursor-pointer hover:bg-white/10' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name={groupName}
                      value={option}
                      checked={checked}
                      disabled={submitted}
                      onChange={e => handleAnswerChange(index, e.target.value)}
                      className="focus:ring-brand-from h-4 w-4 text-brand-to bg-transparent border-white/30 disabled:opacity-50"
                      aria-describedby={qId}
                    />
                    <span
                      className={[
                        rightOption ? 'text-success font-bold' : '',
                        chosenWrong ? 'text-danger' : '',
                        'text-text-secondary',
                      ].join(' ')}
                    >
                      {option}
                    </span>
                  </label>
                );
              })}

            {exercise.type === 'fill-in-the-blank' && (
              <input
                id={inputId}
                type="text"
                value={userAnswer}
                disabled={submitted}
                onChange={e => handleAnswerChange(index, e.target.value)}
                onKeyDown={e => handleFibKeyDown(e, index)}
                className="mt-1 block w-full sm:w-1/2 border border-white/20 bg-white/5 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-from focus:border-brand-from sm:text-sm text-text-primary disabled:bg-white/5"
                aria-labelledby={qId}
                aria-invalid={submitted ? isIncorrect : undefined}
                aria-describedby={submitted ? feedbackId : undefined}
                autoComplete="off"
                inputMode="text"
              />
            )}
          </div>

          <div className="mt-4 flex items-center gap-3" id={feedbackId}>
            {!submitted && (
              <button
                onClick={() => handleCheck(index)}
                className="px-4 py-1.5 bg-brand-from text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-brand-to focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cosmic focus:ring-brand-from"
              >
                Check
              </button>
            )}

            {isCorrect && (
              <div className="flex items-center text-success">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-semibold">Correct!</span>
              </div>
            )}

            {isIncorrect && (
              <div className="flex items-center text-danger">
                <XCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-semibold">
                  Not quite. The correct answer is:{' '}
                  <span className="underline">{exercise.answer}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      );
    },
    [exerciseStates, groupSeed, handleAnswerChange, handleCheck, handleFibKeyDown]
  );

  return (
    <div className="not-prose my-6">
      <h4 className="text-lg font-bold text-text-primary mb-2">
        {data.title}
      </h4>
      <div className="space-y-4">
        {data.exercises.map((ex, i) => renderExercise(ex, i))}
      </div>
    </div>
  );
};

export default memo(InteractiveExercises);
