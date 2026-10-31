import type { Aircraft } from '../types';
import { getAircraftById } from './data';
import skyFactsCatalog from '../content/aircraftSkyFacts.json';

export interface AircraftFact {
  label: string;
  value: string;
}

type SkyFact = {
  firstFlight?: number;
  inService?: number;
  wingspanM?: number;
  cruiseSpeedKt?: number;
  seats?: string;
};

function skyFor(id: string): SkyFact | undefined {
  return (skyFactsCatalog.byId as Record<string, SkyFact>)[id];
}

function formatCount(n: number): string {
  if (n <= 0) return 'None in service';
  if (n >= 1000) return `≈${n.toLocaleString()}`;
  return `≈${n.toLocaleString()}`;
}

/** SkyCards-style labeled facts for Learn / Index headers. */
export function getAircraftFacts(ac: Aircraft): AircraftFact[] {
  const sky = skyFor(ac.id);
  const facts: AircraftFact[] = [
    { label: 'Manufacturer', value: ac.manufacturer },
    { label: 'First flight', value: String(sky?.firstFlight ?? ac.introYear) },
  ];

  if (sky?.inService != null) {
    facts.push({ label: 'Number in service', value: formatCount(sky.inService) });
  }

  facts.push(
    { label: 'Engines', value: String(ac.engineCount) },
    { label: 'Range', value: `${ac.rangeNm.toLocaleString()} nm` }
  );

  if (sky?.wingspanM != null) {
    facts.push({ label: 'Wingspan', value: `${sky.wingspanM} m` });
  }
  if (sky?.cruiseSpeedKt != null) {
    facts.push({ label: 'Cruise speed', value: `${sky.cruiseSpeedKt} kt` });
  }
  if (sky?.seats) {
    facts.push({ label: 'Seats', value: sky.seats.replace(/[–—]/g, '-') });
  }

  if (ac.skycardsCategories?.length) {
    facts.push({ label: 'Category', value: ac.skycardsCategories.slice(0, 3).join(', ') });
  }

  if (ac.icaoCodes?.length) {
    facts.push({ label: 'ICAO types', value: ac.icaoCodes.slice(0, 6).join(', ') });
  }

  const rivals = ac.equivalents
    .map((id) => getAircraftById(id)?.family)
    .filter((name): name is string => Boolean(name));
  if (rivals.length) {
    facts.push({ label: 'Rival', value: rivals.join(', ') });
  }

  return facts;
}
