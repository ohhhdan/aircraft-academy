import type {
  Aircraft,
  Airport,
  CategoryGroup,
  NorebboCatalog,
  PhotoCatalog,
  PhotoCatalogEntry,
} from '../types';

import aircraftJson from '../content/aircraft.json';
import airportsJson from '../content/airports.json';
import aircraftMediaJson from '../content/aircraftMedia.json';
import photoCatalogJson from '../content/photoCatalog.json';
import norebboCatalogJson from '../content/norebboCatalog.json';

export interface AircraftMediaEntry {
  spotPhoto?: { url: string; attribution: string; variant?: string };
  diagram?: { url: string; attribution: string };
}

export const aircraftMedia = aircraftMediaJson as Record<string, AircraftMediaEntry>;
export const photoCatalog = photoCatalogJson as PhotoCatalog;
export const norebboCatalog = norebboCatalogJson as NorebboCatalog;

export const aircraft = aircraftJson as Aircraft[];
export const airports = airportsJson as Airport[];

export function getNorebboEntriesForFamily(familyId: string) {
  return norebboCatalog.entries.filter((e) => e.familyId === familyId);
}

export function getComparisonsForFamily(familyId: string) {
  return norebboCatalog.comparisons.filter((c) => c.familyId === familyId);
}

export function getCatalogComparisons(aircraftId: string): PhotoCatalogEntry[] {
  return photoCatalog.byAircraft?.[aircraftId]?.comparison ?? [];
}

export function getAircraftById(id: string): Aircraft | undefined {
  return aircraft.find((a) => a.id === id);
}

export function getAircraftByCategory(group: CategoryGroup): Aircraft[] {
  return aircraft.filter((a) => a.categoryGroup === group);
}

export function getAircraftByEngineCount(group: CategoryGroup, engines: number): Aircraft[] {
  return aircraft.filter((a) => {
    if (a.categoryGroup !== group) return false;
    if (engines >= 3) return a.engineCount >= 3;
    return a.engineCount === engines;
  });
}

export function getAirportsByTier(tier: Airport['tier']): Airport[] {
  return airports.filter((a) => a.tier === tier);
}

function catalogSpots(aircraftId: string): PhotoCatalogEntry[] {
  return photoCatalog.byAircraft?.[aircraftId]?.spot ?? [];
}

function catalogDiagrams(aircraftId: string): PhotoCatalogEntry[] {
  return photoCatalog.byAircraft?.[aircraftId]?.diagram ?? [];
}

/** Local images/ catalog entries for an aircraft (after npm run sync-images). */
export function getCatalogPhotos(ac: Aircraft): {
  spot: PhotoCatalogEntry[];
  diagram: PhotoCatalogEntry[];
} {
  return {
    spot: catalogSpots(ac.id),
    diagram: catalogDiagrams(ac.id),
  };
}

function pickFromEntries(
  entries: PhotoCatalogEntry[],
  variant?: string,
  familyId?: string
): PhotoCatalogEntry | null {
  if (!entries.length) return null;
  const variantMatch = variant
    ? entries.find((s) => s.variant && s.variant.toLowerCase() === variant.toLowerCase())
    : undefined;
  if (variantMatch) return variantMatch;

  // Prefer painted airline liveries over blank white plates when both exist
  const liveries = entries.filter((s) => /livery/i.test(s.sourceFile));
  const exactWhite = entries.filter((s) => /__white\.(jpe?g|png|webp)$/i.test(s.sourceFile));
  const pool = liveries.length ? liveries : exactWhite.length ? exactWhite : entries;

  const score = (s: PhotoCatalogEntry) => {
    const f = s.sourceFile.toLowerCase();
    let n = 0;
    if (/livery/i.test(f)) n += 40;
    if (/__white\.(jpe?g|png|webp)$/i.test(f)) n += 20;
    if (/(freighter|combi|bcf|p2f|cargo|400sf)/i.test(f)) n -= 15;
    if (/(max|neo|e2)/i.test(f)) n -= 2; // prefer classic/ceo as default quiz plate
    // Prefer common “spotting” subtypes
    if (/737-800/i.test(f)) n += 12;
    if (/737-700/i.test(f)) n += 8;
    if (/a320__/i.test(f) || /airbus-a320__/i.test(f) || /a320_/i.test(f)) n += 12;
    if (familyId && f.includes(familyId.toLowerCase())) n += 3;
    n -= Math.min(f.length, 100) / 50; // slightly prefer shorter stems
    return n;
  };

  return [...pool].sort((a, b) => score(b) - score(a))[0] ?? entries[0];
}

function pickCatalogSpot(
  ac: Aircraft,
  variant?: string
): { url: string; attribution: string; variant?: string } | null {
  // Prefer explicit spot role; fall back to Norebbo white plates wrongly tagged as diagram
  const spots = catalogSpots(ac.id);
  const diagrams = catalogDiagrams(ac.id).filter((d) => /white/i.test(d.sourceFile));
  const preferred = pickFromEntries(spots.length ? spots : diagrams, variant, ac.id);
  if (!preferred) return null;
  return {
    url: preferred.publicPath,
    attribution: preferred.attribution,
    variant: preferred.variant,
  };
}

/**
 * Resolve spot photo URL.
 * Priority: local photoCatalog (spot, then white diagram) → bundled Wikimedia → overrides → aircraft.photos
 * (IndexedDB admin uploads still win via MediaContext before this is called.)
 */
export function getPhotoUrl(ac: Aircraft, variant?: string): { url: string; attribution: string } {
  const local = pickCatalogSpot(ac, variant);
  if (local?.url) return local;

  const bundled = aircraftMedia[ac.id]?.spotPhoto;
  if (bundled?.url) {
    return { url: bundled.url, attribution: bundled.attribution };
  }
  const override = ac.photoOverrides?.[0];
  if (override) {
    return { url: override, attribution: 'User provided' };
  }
  const photo = variant
    ? ac.photos.find((p) => p.variant === variant) ?? ac.photos[0]
    : ac.photos[0];
  return photo ?? { url: '', attribution: '' };
}

export function getDiagramUrl(ac: Aircraft): { url: string; attribution?: string } | null {
  const diagrams = catalogDiagrams(ac.id);
  const line =
    diagrams.find((d) => /line-drawing|blueprint|diagram/i.test(d.sourceFile)) ?? diagrams[0];
  if (line) {
    return { url: line.publicPath, attribution: line.attribution };
  }
  // Fall back to a spot white plate if that's all we have
  const spot = catalogSpots(ac.id)[0];
  if (spot) {
    return { url: spot.publicPath, attribution: spot.attribution };
  }
  const bundled = aircraftMedia[ac.id]?.diagram;
  if (bundled?.url) return bundled;
  return null;
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickRandom<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, count);
}

export function formatLifeTimer(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
