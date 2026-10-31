import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MAX_LIVES } from '../types';
import { formatLifeTimer } from '../utils/data';
import { UserProfile } from './UserProfile';

export function TopBar() {
  const { exerciseSession, state, nextLifeIn } = useApp();
  const location = useLocation();
  const inExercise = exerciseSession?.active ?? false;
  const isHome = location.pathname === '/';
  const isIndex = location.pathname === '/airpedia';
  const regenerating = nextLifeIn != null && state.lives < MAX_LIVES;

  return (
    <header className="top-bar">
      <div className="top-bar-inner">
        <Link to="/" className="top-bar-logo">
          <div className="top-bar-mark">✈</div>
          <div>
            <div className="serif top-bar-title">Field Guide</div>
            <div className="mono top-bar-sub">Spotter&apos;s Logbook</div>
          </div>
        </Link>

        <div className="top-bar-actions">
          {!inExercise && (
            <div className="top-bar-game-stats" aria-label="Streak and XP">
              <span className="top-stat" title="Streak">
                🔥 {state.streak}
              </span>
              <span className="top-stat" title="XP">
                ⚡ {state.xp}
              </span>
            </div>
          )}
          {!inExercise && !isIndex && (
            <Link to="/airpedia" className="top-bar-link">
              ⌕ Index
            </Link>
          )}
          {!isHome && !inExercise && (
            <Link to="/" className="top-bar-link">
              Path
            </Link>
          )}
          <div
            className="top-hearts"
            title={regenerating ? `Next heart in ${formatLifeTimer(nextLifeIn!)}` : `${state.lives} of ${MAX_LIVES} hearts`}
            aria-label={`${state.lives} of ${MAX_LIVES} hearts${regenerating ? `, next in ${formatLifeTimer(nextLifeIn!)}` : ''}`}
          >
            <span className="top-hearts-icon" aria-hidden>
              ♥
            </span>
            <span className="top-hearts-count">{state.lives}</span>
            {regenerating && (
              <span className="top-hearts-timer mono">{formatLifeTimer(nextLifeIn!)}</span>
            )}
          </div>
          <UserProfile />
        </div>
      </div>
    </header>
  );
}
