import { createContext, useContext } from 'react';
import type { AppState, ExerciseSession, ModuleId, UserPreferences } from '../types';

export interface LessonCompleteResult {
  xpGained: number;
  streak: number;
  dailyXp: number;
  dailyGoal: number;
  crowns: number;
  perfect: boolean;
  leveledNode: boolean;
}

export interface AppContextValue {
  state: AppState;
  exerciseSession: ExerciseSession | null;
  preferences: UserPreferences;
  setPreferences: (patch: Partial<UserPreferences>) => void;
  startExercise: (moduleId: ExerciseSession['moduleId']) => void;
  endExercise: () => void;
  loseLife: () => void;
  recordModuleProgress: (moduleId: keyof AppState['moduleProgress'], completed: number, total: number) => void;
  markAircraftMastered: (id: string) => void;
  markAirportMastered: (iata: string) => void;
  awardLessonComplete: (input: {
    nodeId?: string | null;
    moduleId: ModuleId;
    correct: number;
    total: number;
    baseXp?: number;
  }) => LessonCompleteResult;
  recordMistake: (aircraftId: string) => void;
  clearMistake: (aircraftId: string) => void;
  overallProgress: number;
  canStartExercise: boolean;
  nextLifeIn: number | null;
  resetDemo: () => void;
  dailyGoal: number;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
