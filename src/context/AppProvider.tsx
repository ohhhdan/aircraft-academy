import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppState, ExerciseSession, ModuleId } from '../types';
import { MAX_LIVES, LIFE_REGEN_MS, DEFAULT_PREFERENCES } from '../types';
import { AppContext, type AppContextValue } from './AppContext';
import aircraftData from '../content/aircraft.json';
import airportsData from '../content/airports.json';

const STORAGE_KEY = 'runway-reference-state';

const DEFAULT_STATE: AppState = {
  lives: MAX_LIVES,
  lastLifeLostAt: null,
  moduleProgress: {
    learn: { completed: 0, total: 40 },
    spotter: { completed: 0, total: 40 },
    deepdive: { completed: 0, total: 24 },
    codes: { completed: 0, total: 174 },
  },
  categoryProgress: {
    'commercial-jets': 0,
    'business-jets': 0,
    military: 0,
    propeller: 0,
    helicopter: 0,
  },
  masteredAircraft: [],
  masteredAirports: [],
  demoMode: false,
  preferences: { ...DEFAULT_PREFERENCES },
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      preferences: { ...DEFAULT_PREFERENCES, ...parsed.preferences },
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function calcLives(state: AppState): number {
  if (!state.lastLifeLostAt || state.lives >= MAX_LIVES) return state.lives;
  const elapsed = Date.now() - state.lastLifeLostAt;
  const regened = Math.floor(elapsed / LIFE_REGEN_MS);
  return Math.min(MAX_LIVES, state.lives + regened);
}

function calcNextLifeIn(state: AppState): number | null {
  const lives = calcLives(state);
  if (lives >= MAX_LIVES) return null;
  const base = state.lastLifeLostAt ?? Date.now();
  const elapsed = Date.now() - base;
  const remainder = LIFE_REGEN_MS - (elapsed % LIFE_REGEN_MS);
  return remainder;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
      return { ...DEFAULT_STATE, demoMode: true };
    }
    return loadState();
  });
  const [exerciseSession, setExerciseSession] = useState<ExerciseSession | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentLives = useMemo(() => calcLives(state), [state, tick]);
  const nextLifeIn = useMemo(() => calcNextLifeIn(state), [state, tick]);

  const startExercise = useCallback((moduleId: ModuleId) => {
    setExerciseSession({ moduleId, active: true });
  }, []);

  const endExercise = useCallback(() => {
    setExerciseSession(null);
  }, []);

  const loseLife = useCallback(() => {
    setState((prev) => {
      const lives = calcLives(prev);
      if (lives <= 0) return prev;
      const newLives = lives - 1;
      return {
        ...prev,
        lives: newLives,
        lastLifeLostAt: Date.now(),
      };
    });
  }, []);

  const recordModuleProgress = useCallback(
    (moduleId: ModuleId, completed: number, total: number) => {
      setState((prev) => ({
        ...prev,
        moduleProgress: {
          ...prev.moduleProgress,
          [moduleId]: { completed, total },
        },
      }));
    },
    []
  );

  const markAircraftMastered = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      masteredAircraft: prev.masteredAircraft.includes(id)
        ? prev.masteredAircraft
        : [...prev.masteredAircraft, id],
    }));
  }, []);

  const markAirportMastered = useCallback((iata: string) => {
    setState((prev) => ({
      ...prev,
      masteredAirports: prev.masteredAirports.includes(iata)
        ? prev.masteredAirports
        : [...prev.masteredAirports, iata],
    }));
  }, []);

  const overallProgress = useMemo(() => {
    const modules = Object.values(state.moduleProgress);
    const total = modules.reduce((s, m) => s + m.total, 0);
    const done = modules.reduce((s, m) => s + m.completed, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [state.moduleProgress]);

  const resetDemo = useCallback(() => {
    setState({ ...DEFAULT_STATE, demoMode: true });
    setExerciseSession(null);
  }, []);

  const setPreferences = useCallback((patch: Partial<AppState['preferences']>) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...patch },
    }));
  }, []);

  const value: AppContextValue = {
    state: { ...state, lives: currentLives },
    exerciseSession,
    preferences: state.preferences,
    setPreferences,
    startExercise,
    endExercise,
    loseLife,
    recordModuleProgress,
    markAircraftMastered,
    markAirportMastered,
    overallProgress,
    canStartExercise: currentLives > 0,
    nextLifeIn,
    resetDemo,
  };

  // Suppress unused variable warning for data imports used in totals validation
  void aircraftData;
  void airportsData;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
