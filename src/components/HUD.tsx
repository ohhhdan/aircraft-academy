import { useApp } from '../context/AppContext';
import { MAX_LIVES } from '../types';
import { formatLifeTimer } from '../utils/data';

export function HUD() {
  const { state, overallProgress, nextLifeIn } = useApp();

  return (
    <div className="hud-bar">
      <div className="lives" aria-label={`${state.lives} of ${MAX_LIVES} lives`}>
        {Array.from({ length: MAX_LIVES }).map((_, i) => (
          <svg
            key={i}
            className={`heart ${i < state.lives ? '' : 'empty'}`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ))}
        {nextLifeIn !== null && state.lives < MAX_LIVES && (
          <span className="timestamp" style={{ marginLeft: 8 }}>
            +1 in {formatLifeTimer(nextLifeIn)}
          </span>
        )}
      </div>
      <div className="dossier-ring">
        <svg className="ring-chart" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--line-subtle)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="var(--green)"
            strokeWidth="3"
            strokeDasharray={`${overallProgress * 0.94} 100`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
        <span>Dossier {overallProgress}%</span>
      </div>
    </div>
  );
}
