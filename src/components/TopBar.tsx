import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserProfile } from './UserProfile';

export function TopBar() {
  const { exerciseSession } = useApp();
  const location = useLocation();
  const inExercise = exerciseSession?.active ?? false;
  const isHome = location.pathname === '/';
  const isIndex = location.pathname === '/airpedia';

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
          {!inExercise && !isIndex && (
            <Link to="/airpedia" className="top-bar-link">
              ⌕ Index
            </Link>
          )}
          {!isHome && !inExercise && (
            <Link to="/" className="top-bar-link">
              Home
            </Link>
          )}
          <UserProfile />
        </div>
      </div>
    </header>
  );
}
