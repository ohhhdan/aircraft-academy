import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { to: '/learn', label: 'Learn', icon: 'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z' },
  { to: '/spotter', label: 'Spot', icon: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a5 5 0 100-10 5 5 0 000 10z' },
  { to: '/deepdive', label: 'Deep', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
  { to: '/codes', label: 'Codes', icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z' },
  { to: '/airpedia', label: 'Index', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
];

export function BottomNav() {
  const { exerciseSession } = useApp();
  const location = useLocation();
  const inExercise = exerciseSession?.active ?? false;

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="bottom-nav-inner">
        {NAV_ITEMS.map((item) => {
          const isAirpedia = item.to === '/airpedia';
          const locked = isAirpedia && inExercise;
          const isActive = location.pathname === item.to;

          if (locked) {
            return (
              <span key={item.to} className="nav-item locked" title="Finish quiz to open Index">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                {item.label}
              </span>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={item.icon} />
              </svg>
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
