/**
 * Resolves diagram URLs from Wikimedia API; spot photos from aircraft.json.
 * Usage: node scripts/seed-media.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { MEDIA_SOURCES } from './media-sources.mjs';

const ATTRIBUTION_DIAGRAM = 'Wikimedia Commons / Julien.scavini & contributors (technical drawing)';
const ATTRIBUTION_MILITARY_DIAGRAM = 'Wikimedia Commons / US DoD line drawing';

const aircraft = JSON.parse(
  readFileSync(new URL('../src/content/aircraft.json', import.meta.url), 'utf8')
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function commonsUrl(filename, width = 1280) {
  const title = filename.startsWith('File:') ? filename : `File:${filename}`;
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: String(width),
    format: 'json',
    origin: '*',
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': 'RunwayReference/1.0 (educational portfolio; contact: local)' },
  });
  const text = await res.text();
  if (!text.startsWith('{')) throw new Error(`API error: ${text.slice(0, 80)}`);
  const data = JSON.parse(text);
  const pages = data.query?.pages;
  if (!pages) throw new Error(`No pages for ${filename}`);
  const page = Object.values(pages)[0];
  if (page.missing) throw new Error(`File not found: ${filename}`);
  const info = page.imageinfo?.[0];
  if (!info?.thumburl && !info?.url) throw new Error(`No URL for ${filename}`);
  return info.thumburl || info.url;
}

async function resolveDiagram(filename) {
  const fallbacks = [filename];
  // Common alternate naming on Commons
  if (filename.includes(' ')) {
    fallbacks.push(filename.replace(/ /g, '_'));
  }
  for (const name of fallbacks) {
    try {
      return await commonsUrl(name, 1280);
    } catch {
      await sleep(300);
    }
  }
  throw new Error(`All fallbacks failed for ${filename}`);
}

async function main() {
  const path = new URL('../src/content/aircraftMedia.json', import.meta.url);
  let output = {};
  try {
    output = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    /* fresh */
  }

  const failures = [];

  for (const ac of aircraft) {
    const src = MEDIA_SOURCES[ac.id];
    const entry = output[ac.id] ?? {};

    const photo = ac.photos?.[0];
    if (photo?.url) {
      entry.spotPhoto = {
        url: photo.url,
        attribution: photo.attribution,
        variant: photo.variant,
      };
    }

    if (src?.diagram && !entry.diagram) {
      try {
        const url = await resolveDiagram(src.diagram);
        const isMilitary =
          src.diagram.includes('3-view') ||
          src.diagram.includes('line_drawing') ||
          src.diagram.includes('USAF') ||
          src.diagram.includes('silhouette');
        entry.diagram = {
          url,
          attribution: isMilitary ? ATTRIBUTION_MILITARY_DIAGRAM : ATTRIBUTION_DIAGRAM,
        };
      } catch (e) {
        failures.push({ id: ac.id, type: 'diagram', file: src.diagram, error: e.message });
      }
      await sleep(800);
    }

    output[ac.id] = entry;
  }

  writeFileSync(path, JSON.stringify(output, null, 2) + '\n');
  console.log(`Wrote ${Object.keys(output).length} aircraft to src/content/aircraftMedia.json`);
  if (failures.length) {
    console.warn('Diagram failures:', failures);
  }
}

main();
