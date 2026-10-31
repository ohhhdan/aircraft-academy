import { Link } from 'react-router-dom';
import type { LessonCompleteResult } from '../context/AppContext';

interface LessonCompleteProps {
  result: LessonCompleteResult;
  score: number;
  total: number;
  title?: string;
  onAgain?: () => void;
}

export function LessonComplete({ result, score, total, title = 'Lesson complete!', onAgain }: LessonCompleteProps) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="lesson-complete">
      <div className={`lesson-complete-burst ${result.perfect ? 'is-perfect' : ''}`} aria-hidden>
        {result.perfect ? 'PERFECT' : 'NICE'}
      </div>
      <h2 className="serif lesson-complete-title">{title}</h2>
      <p className="lesson-complete-score">
        {score}/{total} correct · {pct}%
      </p>

      <div className="lesson-complete-stats">
        <div className="lesson-stat">
          <div className="lesson-stat-label">XP earned</div>
          <div className="lesson-stat-value">+{result.xpGained}</div>
        </div>
        <div className="lesson-stat">
          <div className="lesson-stat-label">Streak</div>
          <div className="lesson-stat-value">🔥 {result.streak}</div>
        </div>
        <div className="lesson-stat">
          <div className="lesson-stat-label">Daily goal</div>
          <div className="lesson-stat-value">
            {result.dailyXp}/{result.dailyGoal}
          </div>
        </div>
        {result.crowns > 0 && (
          <div className="lesson-stat">
            <div className="lesson-stat-label">Crowns</div>
            <div className="lesson-stat-value">{'♛'.repeat(result.crowns)}</div>
          </div>
        )}
      </div>

      <div className="lesson-complete-actions">
        <Link to="/" className="btn btn-primary pressable">
          Continue path →
        </Link>
        {onAgain && (
          <button type="button" className="btn btn-secondary pressable" onClick={onAgain}>
            Practice again
          </button>
        )}
      </div>
    </div>
  );
}
