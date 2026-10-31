import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { AirportTier } from '../types';

const MODULE_LABELS: Record<string, string> = {
  learn: 'Key Features',
  spotter: 'Identify by Photo',
  deepdive: 'Deep Dive',
  codes: 'Airport Codes',
};

function formatLifeTimer(ms: number): string {
  const mins = Math.ceil(ms / 60000);
  return mins <= 1 ? '~1 min' : `~${mins} min`;
}

export function UserProfile() {
  const { state, overallProgress, canStartExercise, nextLifeIn, preferences, setPreferences, resetDemo } = useApp();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const initials = 'SP';

  return (
    <div className="user-profile" ref={panelRef}>
      <button
        type="button"
        className="user-profile-trigger pressable"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="user-profile-avatar">{initials}</span>
        <span className="user-profile-pct">{overallProgress}%</span>
      </button>

      {open && (
        <div className="user-profile-panel" role="dialog" aria-label="Spotter profile">
          <div className="user-profile-header">
            <span className="user-profile-avatar user-profile-avatar--lg">{initials}</span>
            <div>
              <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Spotter profile</div>
              <div className="mono text-muted" style={{ fontSize: 10, letterSpacing: '0.1em' }}>FIELD JOURNAL</div>
            </div>
          </div>

          <div className="user-profile-stat-grid">
            <div className="user-profile-stat">
              <span className="text-muted">XP</span>
              <span className="serif" style={{ fontSize: 24, fontWeight: 600, color: 'var(--ochre)' }}>{state.xp}</span>
            </div>
            <div className="user-profile-stat">
              <span className="text-muted">Streak</span>
              <span className="serif" style={{ fontSize: 24, fontWeight: 600 }}>🔥 {state.streak}</span>
            </div>
            <div className="user-profile-stat">
              <span className="text-muted">Progress</span>
              <span className="serif" style={{ fontSize: 24, fontWeight: 600, color: 'var(--green)' }}>{overallProgress}%</span>
            </div>
          </div>
          <div className="mastery-bar" style={{ marginBottom: 16 }}>
            <div className="mastery-bar-fill" style={{ width: `${overallProgress}%` }} />
          </div>

          <div className="user-profile-lives">
            <span className="text-muted">Hearts</span>
            <span>
              <span style={{ color: 'var(--brick)' }}>♥</span> {state.lives}
              {!canStartExercise && nextLifeIn != null && (
                <span className="text-muted" style={{ fontSize: 12, marginLeft: 8 }}>
                  +1 in {formatLifeTimer(nextLifeIn)}
                </span>
              )}
            </span>
          </div>

          <div className="mono text-muted" style={{ fontSize: 10, letterSpacing: '0.12em', margin: '18px 0 10px' }}>
            Module progress
          </div>
          {Object.entries(state.moduleProgress).map(([id, prog]) => {
            const pct = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
            return (
              <div key={id} className="user-profile-module">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>{MODULE_LABELS[id] ?? id}</span>
                  <span className="text-muted">{pct}%</span>
                </div>
                <div className="progress-bar" style={{ marginTop: 4 }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}

          <div className="mono text-muted" style={{ fontSize: 10, letterSpacing: '0.12em', margin: '18px 0 10px' }}>
            Default difficulty
          </div>

          <label className="user-profile-field">
            <span>Photo ID level</span>
            <select
              value={preferences.spotterMode}
              onChange={(e) => setPreferences({ spotterMode: e.target.value as 'easy' | 'hard' })}
            >
              <option value="easy">Type ID (easier)</option>
              <option value="hard">Variant ID (harder)</option>
            </select>
          </label>

          <label className="user-profile-field">
            <span>Airport codes tier</span>
            <select
              value={preferences.codesTier}
              onChange={(e) => setPreferences({ codesTier: e.target.value as AirportTier })}
            >
              <option value="easy">Ground Level</option>
              <option value="medium">Cruising</option>
              <option value="hard">High Altitude</option>
            </select>
          </label>

          <label className="user-profile-field user-profile-field--check">
            <input
              type="checkbox"
              checked={preferences.showLearnLinks}
              onChange={(e) => setPreferences({ showLearnLinks: e.target.checked })}
            />
            <span>Show study tips after wrong answers</span>
          </label>

          <div className="user-profile-footer">
            <Link to="/airpedia" className="top-bar-link" onClick={() => setOpen(false)}>
              ⌕ Open index
            </Link>
            <button type="button" className="btn btn-secondary pressable" style={{ padding: '8px 14px', fontSize: 13 }} onClick={resetDemo}>
              Reset progress
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
