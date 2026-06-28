import type { Aircraft, Airport, CategoryGroup } from '../types';

import aircraftJson from '../content/aircraft.json';
import airportsJson from '../content/airports.json';
import aircraftMediaJson from '../content/aircraftMedia.json';

export interface AircraftMediaEntry {
  spotPhoto?: { url: string; attribution: string; variant?: string };
  diagram?: { url: string; attribution: string };
}

export const aircraftMedia = aircraftMediaJson as Record<string, AircraftMediaEntry>;

export const aircraft = aircraftJson as Aircraft[];
export const airports = airportsJson as Airport[];

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

export function getPhotoUrl(ac: Aircraft, variant?: string): { url: string; attribution: string } {
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
