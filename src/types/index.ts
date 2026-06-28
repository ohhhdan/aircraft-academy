export type AircraftRole = 'commercial' | 'business' | 'military' | 'general' | 'helicopter';

export type CategoryGroup =
  | 'commercial-jets'
  | 'business-jets'
  | 'military'
  | 'propeller'
  | 'helicopter';

export interface DiagramCallout {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
}

export interface AircraftPhoto {
  url: string;
  attribution: string;
  variant?: string;
}

export interface Aircraft {
  id: string;
  family: string;
  variants: string[];
  manufacturer: string;
  skycardsCategories: string[];
  categoryGroup: CategoryGroup;
  engineCount: number;
  introYear: number;
  nickname: string | null;
  rangeNm: number;
  role: AircraftRole;
  equivalents: string[];
  businessOrLeisure?: 'business' | 'leisure' | 'both';
  keyFeatures: string[];
  geekFacts: string[];
  diagramId: string;
  callouts: DiagramCallout[];
  photos: AircraftPhoto[];
  photoOverrides?: string[];
  needsUserPhotos?: boolean;
  spotterLocations?: string[];
}

export type AirportTier = 'easy' | 'medium' | 'hard';

export interface Airport {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  tier: AirportTier;
  hint?: string;
}

export type ModuleId = 'learn' | 'spotter' | 'deepdive' | 'codes';

export interface ModuleProgress {
  completed: number;
  total: number;
}

export interface UserPreferences {
  spotterMode: 'easy' | 'hard';
  codesTier: AirportTier;
  showLearnLinks: boolean;
}

export interface AppState {
  lives: number;
  lastLifeLostAt: number | null;
  moduleProgress: Record<ModuleId, ModuleProgress>;
  categoryProgress: Record<CategoryGroup, number>;
  masteredAircraft: string[];
  masteredAirports: string[];
  demoMode: boolean;
  preferences: UserPreferences;
}

export interface ExerciseSession {
  moduleId: ModuleId;
  active: boolean;
}

export type DeepDiveExerciseType =
  | 'equivalent'
  | 'mission'
  | 'timeline'
  | 'range';

export interface CategoryMeta {
  id: CategoryGroup;
  label: string;
  skycardsTag: string;
  description: string;
  unlockOrder: number;
}

export const CATEGORY_ORDER: CategoryMeta[] = [
  {
    id: 'commercial-jets',
    label: 'Commercial Jets',
    skycardsTag: 'Airliner',
    description: 'Narrowbody and widebody passenger jets — start with the types you see at every major hub.',
    unlockOrder: 0,
  },
  {
    id: 'business-jets',
    label: 'Business Jets',
    skycardsTag: 'Jet',
    description: 'Corporate and private jets — from light jets to ultra-long-range flagships.',
    unlockOrder: 1,
  },
  {
    id: 'military',
    label: 'Military',
    skycardsTag: 'Military',
    description: 'Fighters, tankers, transports, and bombers in active service worldwide.',
    unlockOrder: 2,
  },
  {
    id: 'propeller',
    label: 'Propeller / Piston',
    skycardsTag: 'Propeller',
    description: 'Turboprops and piston aircraft — trainers, commuters, and classics.',
    unlockOrder: 3,
  },
  {
    id: 'helicopter',
    label: 'Helicopter',
    skycardsTag: 'Helicopter',
    description: 'Rotorcraft from light trainers to heavy-lift military workhorses.',
    unlockOrder: 4,
  },
];

export const STORY_HEADLINE =
  'The Hidden Fleet: tracing shadow charters across Europe';

export const MAX_LIVES = 5;
export const LIFE_REGEN_MS = 30 * 60 * 1000;

export const DEFAULT_PREFERENCES: UserPreferences = {
  spotterMode: 'easy',
  codesTier: 'easy',
  showLearnLinks: true,
};
