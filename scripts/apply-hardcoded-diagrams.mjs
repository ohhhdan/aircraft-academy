/**
 * Merge hardcoded diagram URLs into aircraftMedia.json (fills gaps without Wikimedia API).
 */
import { readFileSync, writeFileSync } from 'fs';
import { HARDCODED_DIAGRAMS } from './hardcoded-diagrams.mjs';

const path = new URL('../src/content/aircraftMedia.json', import.meta.url);
const media = JSON.parse(readFileSync(path, 'utf8'));

let added = 0;
for (const [id, diagram] of Object.entries(HARDCODED_DIAGRAMS)) {
  if (!media[id]) media[id] = {};
  if (!media[id].diagram) {
    media[id].diagram = diagram;
    added++;
  }
}

writeFileSync(path, JSON.stringify(media, null, 2) + '\n');
console.log(`Added ${added} hardcoded diagrams`);
