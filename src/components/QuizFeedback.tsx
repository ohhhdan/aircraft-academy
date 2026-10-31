import type { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'teal';

interface QuizFeedbackProps {
  correct: boolean;
  explanation: string;
  learnMore?: ReactNode;
  onNext?: () => void;
  onRetry?: () => void;
  onShowAnswer?: () => void;
  nextLabel?: string;
  buttonVariant?: ButtonVariant;
  /** First-try XP chip shown on correct answers */
  xpGained?: number | null;
}

export function QuizFeedback({
  correct,
  explanation,
  learnMore,
  onNext,
  onRetry,
  onShowAnswer,
  nextLabel = 'Next →',
  buttonVariant = 'primary',
  xpGained = null,
}: QuizFeedbackProps) {
  const btnClass = buttonVariant === 'teal' ? 'btn btn-teal pressable' : 'btn btn-primary pressable';

  return (
    <div className={`feedback-banner ${correct ? 'feedback-banner--ok' : 'feedback-banner--err'}`} role="status">
      <div className="feedback-banner-body">
        <div className={`feedback-banner-head ${correct ? 'feedback-banner-head--ok' : 'feedback-banner-head--err'}`}>
          {correct ? 'CORRECT' : 'INCORRECT'}
          {correct && xpGained != null && xpGained > 0 && (
            <span className="feedback-xp-chip">+{xpGained} XP</span>
          )}
        </div>
        {explanation ? <p className="feedback-banner-text">{explanation}</p> : null}
        {!correct && learnMore && (
          <p className="feedback-banner-learn">{learnMore}</p>
        )}
      </div>
      <div className="feedback-banner-actions">
        {!correct && onRetry && (
          <button type="button" className="btn btn-secondary pressable" onClick={onRetry}>
            Try again
          </button>
        )}
        {!correct && onShowAnswer && (
          <button type="button" className="btn btn-secondary pressable" onClick={onShowAnswer}>
            Show answer
          </button>
        )}
        {onNext && (correct || !onRetry) && (
          <button type="button" className={btnClass} onClick={onNext}>
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export type OptionMarkState = 'default' | 'correct' | 'incorrect' | 'dimmed';

export function getOptionMarkState(
  optionKey: string,
  chosen: string | null,
  correct: string,
  answered: boolean,
  /** When false, do not highlight the right answer yet (e.g. early retries). */
  revealCorrect = true
): OptionMarkState {
  if (!answered && !revealCorrect) {
    if (optionKey === chosen) return 'incorrect';
    return 'default';
  }
  if (!answered) return 'default';
  if (revealCorrect && optionKey === correct) return 'correct';
  if (optionKey === chosen) return 'incorrect';
  if (revealCorrect) return 'dimmed';
  return 'default';
}

export function OptionContent({ label, state }: { label: string; state: OptionMarkState }) {
  return (
    <span className={`option-content ${state !== 'default' ? `option-content--${state}` : ''}`}>
      {state === 'correct' && <span className="option-mark option-mark--correct" aria-hidden="true">✓</span>}
      {state === 'incorrect' && <span className="option-mark option-mark--incorrect" aria-hidden="true">✗</span>}
      <span>{label}</span>
    </span>
  );
}

export function optionBtnClass(state: OptionMarkState, extra = ''): string {
  const base = `option-btn pressable ${extra}`.trim();
  if (state === 'correct') return `${base} correct`;
  if (state === 'incorrect') return `${base} incorrect`;
  if (state === 'dimmed') return `${base} dimmed`;
  return base;
}

export function pickerCardClass(state: OptionMarkState, extra = ''): string {
  const base = `picker-card pressable ${extra}`.trim();
  if (state === 'correct') return `${base} selected-correct`;
  if (state === 'incorrect') return `${base} selected-wrong`;
  if (state === 'dimmed') return `${base} dimmed`;
  return base;
}
