import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Aircraft, Airport } from '../types';

export function spotterLearnMore(aircraft: Aircraft, showLinks: boolean): ReactNode {
  const tip = aircraft.keyFeatures[0] ?? aircraft.callouts[0]?.label ?? 'fuselage profile and engines';
  if (!showLinks) {
    return `Study ${aircraft.family} in the Index and look for: ${tip}. The Key Features module has full specimen plates with diagrams.`;
  }
  return (
    <>
      Study{' '}
      <Link to="/airpedia" state={{ highlight: aircraft.id }}>
        {aircraft.family} in the Index
      </Link>{' '}
      and look for: <strong>{tip}</strong>. For diagrams and spotting features, open the{' '}
      <Link to="/learn">Key Features</Link> module and log the specimen to your journal.
    </>
  );
}

export function codesLearnMore(airport: Airport, showLinks: boolean): ReactNode {
  const mnemonic = airport.hint ?? `${airport.name} in ${airport.country}`;
  if (!showLinks) {
    return `Remember: ${airport.iata} = ${airport.city}. Mnemonic: ${mnemonic}. Flip through flashcards at this level before quizzing again.`;
  }
  return (
    <>
      <strong>{airport.iata}</strong> serves {airport.city}, {airport.country} ({airport.name}). Mnemonic: {mnemonic}.
      Review all codes at this level in the Index airports tab, then retry.
    </>
  );
}

export function recallLearnMore(aircraft: Aircraft, calloutLabel: string, showLinks: boolean): ReactNode {
  const callout = aircraft.callouts.find((c) => c.label === calloutLabel);
  if (!showLinks) {
    return `Re-read the ${aircraft.family} specimen plate and focus on "${calloutLabel}"${callout ? `: ${callout.description}` : ''}.`;
  }
  return (
    <>
      Re-study the <Link to="/learn">{aircraft.family} specimen plate</Link>. The feature &ldquo;{calloutLabel}&rdquo;
      {callout ? <> — {callout.description}</> : ''} — is the key tell for this type.
    </>
  );
}

export function deepDiveLearnMore(topic: string, showLinks: boolean): ReactNode {
  if (!showLinks) {
    return `Review ${topic} in the Index — compare specs side by side. The Deep Dive module builds on Key Features study.`;
  }
  return (
    <>
      Review {topic} in the <Link to="/airpedia">Index</Link> and compare specs. If unsure, study related types in{' '}
      <Link to="/learn">Key Features</Link> first.
    </>
  );
}
