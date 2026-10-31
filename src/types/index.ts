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

/** Role of a file in the local images/ → photoCatalog pipeline */
export type PhotoCatalogRole = 'spot' | 'diagram' | 'comparison';

export interface PhotoCatalogEntry {
  id: string;
  aircraftId: string;
  role: PhotoCatalogRole;
  variant?: string;
  /** Google Sheet row this Norebbo/image stem maps to */
  sheetRow?: number;
  sourceFile: string;
  publicPath: string;
  attribution: string;
  matchedBy: string;
  sortIndex: number;
}

export interface PhotoCatalogAircraftBucket {
  spot: PhotoCatalogEntry[];
  diagram: PhotoCatalogEntry[];
  comparison?: PhotoCatalogEntry[];
}

export interface NorebboCatalogEntry {
  sheetRow: number;
  sheetName: string;
  imageStem: string;
  familyId: string | null;
  norebboUrl: string | null;
  norebboTitle?: string | null;
  variants: string[];
  hasComparison: boolean;
  preferredFilenames: {
    white: string;
    lineDrawing: string;
    comparison: string;
  };
}

export interface NorebboComparison {
  id: string;
  kind: 'image' | 'peers';
  title: string;
  leftLabel?: string;
  rightLabel?: string;
  sheetRow: number;
  sheetName: string;
  familyId: string | null;
  imageFile?: string;
  imageUrl?: string;
  norebboUrl?: string | null;
  suggestedLocalName?: string;
}

export interface NorebboCatalog {
  version: number;
  source: string;
  sheetId: string;
  updatedAt: string;
  note?: string;
  entries: NorebboCatalogEntry[];
  comparisons: NorebboComparison[];
  byImageStem: Record<string, number>;
  byFamilyId: Record<string, number[]>;
}

export interface PhotoCatalog {
  version: number;
  updatedAt: string | null;
  sourceDir: string;
  publicDir: string;
  photos: PhotoCatalogEntry[];
  byAircraft: Record<string, PhotoCatalogAircraftBucket>;
  unmatched: Array<{ sourceFile: string; reason: string }>;
  stats: {
    sourceFiles: number;
    matched: number;
    unmatched: number;
    aircraftCovered: number;
  };
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
  /** ICAO Doc 8643 type designators linked to this family (e.g. AJ27, C909) */
  icaoCodes?: string[];
}

export interface IcaoTypeRecord {
  icao: string;
  iata: string[];
  model: string;
  manufacturer: string | null;
  familyId: string | null;
  variant: string | null;
  aliases: string[];
  aeroapi: {
    manufacturer?: string | null;
    type?: string | null;
    description?: string | null;
    engine_count?: number | null;
    engine_type?: string | null;
    fetchedAt?: string;
    missing?: boolean;
  } | null;
  marketingAlias?: boolean;
}

export interface IcaoTypeCatalog {
  version: number;
  updatedAt: string;
  source: string;
  note?: string;
  count: number;
  mappedToFamily: number;
  types: Record<string, IcaoTypeRecord>;
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
  /** Duolingo-style gamification */
  xp: number;
  streak: number;
  /** YYYY-MM-DD in local time of last practice */
  lastPracticeDate: string | null;
  dailyXp: number;
  /** Crowns 0–5 per lesson path node id */
  nodeCrowns: Record<string, number>;
  /** Ordered list of completed node ids (at least once) */
  completedNodes: string[];
  /** Aircraft ids missed recently — Practice Weak Spots queue */
  mistakeAircraftIds: string[];
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
    description: 'Narrowbody and widebody passenger jets.',
    unlockOrder: 0,
  },
  {
    id: 'business-jets',
    label: 'Business Jets',
    skycardsTag: 'Jet',
    description: 'Corporate and private jets.',
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
    description: 'Turboprops and piston aircraft.',
    unlockOrder: 3,
  },
  {
    id: 'helicopter',
    label: 'Helicopter',
    skycardsTag: 'Helicopter',
    description: 'Rotorcraft.',
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

export const DEFAULT_GAME_STATS = {
  xp: 0,
  streak: 0,
  lastPracticeDate: null as string | null,
  dailyXp: 0,
  nodeCrowns: {} as Record<string, number>,
  completedNodes: [] as string[],
  mistakeAircraftIds: [] as string[],
};
