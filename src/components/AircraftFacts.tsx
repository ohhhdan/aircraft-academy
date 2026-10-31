import type { Aircraft } from '../types';
import { getAircraftFacts } from '../utils/aircraftFacts';

export function AircraftFacts({ aircraft }: { aircraft: Aircraft }) {
  const facts = getAircraftFacts(aircraft);

  return (
    <dl className="aircraft-facts" aria-label={`${aircraft.family} facts`}>
      {facts.map((fact) => (
        <div key={fact.label} className="aircraft-fact">
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
