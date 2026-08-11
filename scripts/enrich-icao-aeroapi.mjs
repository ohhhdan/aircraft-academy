/**
 * Enrich icaoTypes.json via FlightAware AeroAPI.
 *
 * AeroAPI endpoint (single type lookup only — no bulk list):
 *   GET https://aeroapi.flightaware.com/aeroapi/aircraft/types/{icao}
 *   Header: x-apikey: <key>
 *
 * Setup:
 *   set AEROAPI_KEY in the environment (do not commit keys)
 *   Windows PowerShell:  $env:AEROAPI_KEY="your_key"
 *   bash:                export AEROAPI_KEY=your_key
 *
 * Usage:
 *   npm run enrich-icao
 *   npm run enrich-icao -- --limit=50
 *   npm run enrich-icao -- --only=AJ27,C919,B738
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = join(ROOT, 'src', 'content', 'icaoTypes.json');
const BASE = 'https://aeroapi.flightaware.com/aeroapi';

function argValue(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchType(icao, key) {
  const res = await fetch(`${BASE}/aircraft/types/${encodeURIComponent(icao)}`, {
    headers: {
      'x-apikey': key,
      Accept: 'application/json',
      'User-Agent': 'AircraftAcademy/1.0 (educational portfolio)',
    },
  });
  if (res.status === 404) return { missing: true };
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${icao}: HTTP ${res.status} ${text.slice(0, 160)}`);
  }
  return res.json();
}

async function main() {
  const key = process.env.AEROAPI_KEY || process.env.FLIGHTAWARE_API_KEY;
  if (!key) {
    console.error(`
Missing AEROAPI_KEY.

FlightAware AeroAPI does not expose a bulk "list all aircraft types" endpoint —
only per-code lookup: GET /aircraft/types/{icao}.

Set your key (do not paste it into chat / commit it):

  PowerShell:  $env:AEROAPI_KEY="YOUR_KEY"
  bash:        export AEROAPI_KEY=YOUR_KEY

Then: npm run enrich-icao
`);
    process.exit(1);
  }

  const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
  const only = argValue('only')?.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  const limit = Number(argValue('limit') || 0);

  let codes = Object.keys(catalog.types).filter((c) => !catalog.types[c].marketingAlias);
  if (only?.length) codes = codes.filter((c) => only.includes(c));
  // Prefer unenriched first
  codes.sort((a, b) => {
    const ae = catalog.types[a].aeroapi ? 1 : 0;
    const be = catalog.types[b].aeroapi ? 1 : 0;
    return ae - be || a.localeCompare(b);
  });
  if (limit > 0) codes = codes.slice(0, limit);

  console.log(`Enriching ${codes.length} ICAO type(s) via AeroAPI…`);
  let ok = 0;
  let missing = 0;
  let failed = 0;

  for (const icao of codes) {
    try {
      const data = await fetchType(icao, key);
      if (data.missing) {
        catalog.types[icao].aeroapi = { missing: true, fetchedAt: new Date().toISOString() };
        missing++;
        console.log(`  · ${icao} not found`);
      } else {
        catalog.types[icao].aeroapi = {
          manufacturer: data.manufacturer ?? null,
          type: data.type ?? null,
          description: data.description ?? null,
          engine_count: data.engine_count ?? null,
          engine_type: data.engine_type ?? null,
          fetchedAt: new Date().toISOString(),
        };
        if (data.manufacturer && !catalog.types[icao].manufacturer) {
          catalog.types[icao].manufacturer = data.manufacturer;
        }
        ok++;
        console.log(`  ✓ ${icao} — ${data.manufacturer ?? '?'} ${data.type ?? ''} (${data.description ?? ''})`);
      }
    } catch (e) {
      failed++;
      console.warn(`  ✗ ${icao}: ${e.message}`);
      if (/401|403|quota|rate/i.test(e.message)) {
        console.warn('Stopping early (auth/rate limit). Partial catalog saved.');
        break;
      }
    }
    await sleep(250);
  }

  catalog.updatedAt = new Date().toISOString();
  catalog.aeroapiEnrichedAt = new Date().toISOString();
  writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`\nDone. ok=${ok} missing=${missing} failed=${failed}`);
  console.log(`Wrote ${CATALOG}`);
}

main();
