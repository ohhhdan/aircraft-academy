/**
 * Verify all media URLs return HTTP 200. Run: node scripts/verify-media-urls.mjs
 */
import { readFileSync } from 'fs';

const UA = 'RunwayReference/1.0 (media verify; contact: local dev)';
const DELAY_MS = 1200;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const media = JSON.parse(
  readFileSync(new URL('../src/content/aircraftMedia.json', import.meta.url), 'utf8')
);

async function checkUrl(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': UA },
    });
    if (res.ok) return { ok: true };
    if (res.status === 429 && attempt < 2) {
      await sleep(3000 * (attempt + 1));
      continue;
    }
    return { ok: false, status: res.status };
  }
}

const failures = [];
const entries = Object.entries(media);

for (let i = 0; i < entries.length; i++) {
  const [id, entry] = entries[i];
  for (const type of ['spotPhoto', 'diagram']) {
    const item = entry[type];
    if (!item?.url) {
      failures.push({ id, type, error: 'missing' });
      continue;
    }
    try {
      const result = await checkUrl(item.url);
      if (!result.ok) failures.push({ id, type, url: item.url, status: result.status });
    } catch (e) {
      failures.push({ id, type, url: item.url, error: e.message });
    }
    await sleep(DELAY_MS);
  }
}

if (failures.length) {
  console.error('Failed URLs:', failures);
  process.exitCode = 1;
} else {
  console.log(`All ${entries.length} aircraft media URLs OK`);
}
