// components/InteractiveQuiz.tsx
// Accessible, stable, and aligned with the UI system.

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
type QuestionType = 'multiple-choice' | 'true-false' | 'fill-in-the-blank';

type Question = Readonly<{
  type: QuestionType;
  question: string;
  options?: string[];
  answer: string | boolean;
}>;

export interface QuizData {
  title: string;
  questions: Question[];
}

interface InteractiveQuizProps {
  data: QuizData;
  onMistakes: (mistakes: string[]) => void;
}

/* =========================
   Utils
========================= */
const normalize = (s: string) =>
  s
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const isCorrectAnswer = (q: Question, val: unknown): boolean => {
  if (q.type === 'fill-in-the-blank') {
    return (
      typeof val === 'string' &&
      typeof q.answer === 'string' &&
      normalize(val) === normalize(q.answer)
    );
  }
  // multiple-choice / true-false
  return val === q.answer || String(val) === String(q.answer);
};

/* =========================
   Component
========================= */
const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({ data, onMistakes }) => {
  const groupSeed = useId();

  const [userAnswers, setUserAnswers] = useState<Record<number, string | boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  // Reset state when quiz data changes
  useEffect(() => {
    setUserAnswers({});
    setSubmitted(false);
  }, [data]);

  const handleAnswerChange = useCallback((index: number, answer: string | boolean) => {
    setUserAnswers(prev => (prev[index] === answer ? prev : { ...prev, [index]: answer }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (submitted) return;
      setSubmitted(true);

      const mistakes: string[] = [];
      data.questions.forEach((q, idx) => {
        const ua = userAnswers[idx];
        if (!isCorrectAnswer(q, ua)) mistakes.push(String(q.answer));
      });
      if (mistakes.length) onMistakes(mistakes);
    },
    [submitted, data.questions, userAnswers, onMistakes]
  );

  const score = useMemo(() => {
    if (!submitted) return 0;
    return data.questions.reduce(
      (acc, q, i) => (isCorrectAnswer(q, userAnswers[i]) ? acc + 1 : acc),
      0
    );
  }, [submitted, data.questions, userAnswers]);

  const renderQuestion = useCallback(
    (question: Question, index: number) => {
      const ua = userAnswers[index];
      const answered = ua !== undefined;
      const correct = submitted && isCorrectAnswer(question, ua);
      const incorrect = submitted && answered && !correct;

      const groupName = `${groupSeed}-q-${index}`;
      const labelId = `${groupSeed}-lbl-${index}`;
      const fibId = `${groupSeed}-fib-${index}`;
      const fbId = `${groupSeed}-fb-${index}`;

      return (
        <div
          key={groupName}
          className={`p-4 border rounded-lg transition-colors ${
            correct
              ? 'border-success/30 bg-success/10'
              : incorrect
              ? 'border-danger/30 bg-danger/10'
              : 'border-white/20 bg-white/5'
          }`}
          role="group"
          aria-labelledby={labelId}
          aria-describedby={submitted ? fbId : undefined}
        >
          <p id={labelId} className="font-semibold text-text-primary flex items-center">
            {index + 1}. {question.question.replace('___', '_____')}
            {submitted && (
              <span className="ml-2" aria-hidden="true">
                {correct ? (
                  <CheckCircleIcon className="h-5 w-5 text-success" />
                ) : incorrect ? (
                  <XCircleIcon className="h-5 w-5 text-danger" />
                ) : null}
              </span>
            )}
          </p>

          <div className="mt-3 space-y-2">
            {question.type === 'multiple-choice' &&
              (question.options ?? []).map((option, i) => {
                const optKey = `${groupName}-opt-${i}-${option}`;
                const checked = ua === option;
                const rightOption =
                  submitted &&
                  normalize(option) === normalize(String(question.answer));
                const chosenWrong = submitted && checked && !rightOption;

                return (
                  <label
                    key={optKey}
                    className={`flex items-center space-x-3 p-2 rounded-md ${
                      submitted ? '' : 'cursor-pointer hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name={groupName}
                      value={option}
                      checked={checked === true}
                      disabled={submitted}
                      onChange={() => handleAnswerChange(index, option)}
                      className="focus:ring-brand-from h-4 w-4 text-brand-to bg-transparent border-white/30"
                      aria-describedby={labelId}
                    />
                    <span
                      className={
                        rightOption
                          ? 'text-success font-semibold'
                          : chosenWrong
                          ? 'text-danger'
                          : 'text-text-secondary'
                      }
                    >
                      {option}
                    </span>
                  </label>
                );
              })}

            {question.type === 'true-false' && (
              <>
                <label
                  className={`flex items-center space-x-3 p-2 rounded-md ${
                    submitted ? '' : 'cursor-pointer hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name={groupName}
                    value="true"
                    checked={ua === true}
                    disabled={submitted}
                    onChange={() => handleAnswerChange(index, true)}
                    className="focus:ring-brand-from h-4 w-4 text-brand-to bg-transparent border-white/30"
                    aria-describedby={labelId}
                  />
                  <span className="text-text-secondary">True</span>
                </label>
                <label
                  className={`flex items-center space-x-3 p-2 rounded-md ${
                    submitted ? '' : 'cursor-pointer hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name={groupName}
                    value="false"
                    checked={ua === false}
                    disabled={submitted}
                    onChange={() => handleAnswerChange(index, false)}
                    className="focus:ring-brand-from h-4 w-4 text-brand-to bg-transparent border-white/30"
                    aria-describedby={labelId}
                  />
                  <span className="text-text-secondary">False</span>
                </label>
              </>
            )}

            {question.type === 'fill-in-the-blank' && (
              <input
                id={fibId}
                type="text"
                value={typeof ua === 'string' ? ua : ''}
                disabled={submitted}
                onChange={e => handleAnswerChange(index, e.target.value)}
                className="mt-1 block w-full sm:w-1/2 border border-white/20 bg-white/5 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-from focus:border-brand-from sm:text-sm text-text-primary disabled:bg-white/5"
                aria-labelledby={labelId}
                aria-invalid={submitted ? Boolean(answered && !correct) : undefined}
                aria-describedby={submitted ? fbId : undefined}
                autoComplete="off"
                inputMode="text"
              />
            )}
          </div>

          {incorrect && (
            <p id={fbId} className="text-sm text-danger mt-2">
              Correct answer:{' '}
              <span className="font-semibold underline">{String(question.answer)}</span>
            </p>
          )}
        </div>
      );
    },
    [groupSeed, userAnswers, submitted, handleAnswerChange]
  );

  return (
    <div className="not-prose my-6 p-6 bg-cosmic/50 border border-white/10 rounded-xl shadow-sm backdrop-blur-sm">
      <h3 className="text-xl font-bold text-text-primary mb-4">{data.title}</h3>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {data.questions.map((q, i) => renderQuestion(q, i))}

        {!submitted ? (
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-brand-from to-brand-to text-white font-semibold rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cosmic focus:ring-brand-from"
          >
            Check Answers
          </button>
        ) : (
          <div
            className="mt-6 p-4 text-center bg-brand-from/10 border border-brand-from/20 rounded-lg"
            aria-live="polite"
          >
            <p className="text-lg font-bold text-brand-from">
              Quiz Complete! You scored {score} out of {data.questions.length}.
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default memo(InteractiveQuiz);
