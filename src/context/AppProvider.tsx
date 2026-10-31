import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppState, ExerciseSession, ModuleId } from '../types';
import { MAX_LIVES, LIFE_REGEN_MS, DEFAULT_PREFERENCES, DEFAULT_GAME_STATS } from '../types';
import { AppContext, type AppContextValue, type LessonCompleteResult } from './AppContext';
import { DAILY_XP_GOAL, MAX_CROWNS, getNodeById } from '../content/lessonPath';
import { calcStreakAfterPractice, todayKey } from '../utils/game';
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
  ...DEFAULT_GAME_STATS,
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const today = todayKey();
    let dailyXp = parsed.dailyXp ?? 0;
    // Reset daily XP if calendar day changed
    if (parsed.lastPracticeDate && parsed.lastPracticeDate !== today) {
      // keep streak logic for display; daily XP resets until they practice
      dailyXp = 0;
    }
    return {
      ...DEFAULT_STATE,
      ...parsed,
      preferences: { ...DEFAULT_PREFERENCES, ...parsed.preferences },
      xp: parsed.xp ?? 0,
      streak: parsed.streak ?? 0,
      lastPracticeDate: parsed.lastPracticeDate ?? null,
      dailyXp,
      nodeCrowns: parsed.nodeCrowns ?? {},
      completedNodes: parsed.completedNodes ?? [],
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

  const awardLessonComplete = useCallback(
    (input: {
      nodeId?: string | null;
      moduleId: ModuleId;
      correct: number;
      total: number;
      baseXp?: number;
    }): LessonCompleteResult => {
      const node = input.nodeId ? getNodeById(input.nodeId) : undefined;
      const accuracy = input.total > 0 ? input.correct / input.total : 0;
      const perfect = input.total > 0 && input.correct === input.total;
      let gained = input.baseXp ?? node?.xpReward ?? 15;
      gained += Math.round(input.correct * 1.5);
      if (perfect) gained += 10;

      const prevCrowns = input.nodeId ? state.nodeCrowns[input.nodeId] ?? 0 : 0;
      const { streak, isNewDay } = calcStreakAfterPractice(state.streak, state.lastPracticeDate);
      const dailyXp = (isNewDay ? 0 : state.dailyXp) + gained;
      let crowns = prevCrowns;
      let leveledNode = false;
      if (input.nodeId && accuracy >= 0.6) {
        const next = Math.min(MAX_CROWNS, prevCrowns + (perfect ? 2 : 1));
        leveledNode = next > prevCrowns;
        crowns = next;
      }

      setState((prev) => {
        const mod = prev.moduleProgress[input.moduleId];
        const newCompleted = Math.min(mod.completed + input.correct, mod.total);
        const completedNodes =
          input.nodeId && !prev.completedNodes.includes(input.nodeId)
            ? [...prev.completedNodes, input.nodeId]
            : prev.completedNodes;
        return {
          ...prev,
          xp: prev.xp + gained,
          streak,
          lastPracticeDate: todayKey(),
          dailyXp,
          nodeCrowns: input.nodeId
            ? { ...prev.nodeCrowns, [input.nodeId]: crowns }
            : prev.nodeCrowns,
          completedNodes,
          moduleProgress: {
            ...prev.moduleProgress,
            [input.moduleId]: { completed: newCompleted, total: mod.total },
          },
        };
      });

      return {
        xpGained: gained,
        streak,
        dailyXp,
        dailyGoal: DAILY_XP_GOAL,
        crowns,
        perfect,
        leveledNode,
      };
    },
    [state.streak, state.dailyXp, state.nodeCrowns]
  );

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
    awardLessonComplete,
    overallProgress,
    canStartExercise: currentLives > 0,
    nextLifeIn,
    resetDemo,
    dailyGoal: DAILY_XP_GOAL,
  };

  void aircraftData;
  void airportsData;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
