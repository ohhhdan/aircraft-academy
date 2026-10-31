/**
 * Scan images/ for aircraft photos, identify them from filenames,
 * copy into public/assets/aircraft/{id}/, and write src/content/photoCatalog.json.
 *
 * Usage:
 *   npm run sync-images
 *   node scripts/sync-images.mjs --dry-run
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import { basename, dirname, extname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const IMAGES_DIR = join(ROOT, 'images');
const PUBLIC_AIRCRAFT_DIR = join(ROOT, 'public', 'assets', 'aircraft');
const CATALOG_PATH = join(ROOT, 'src', 'content', 'photoCatalog.json');
const AIRCRAFT_PATH = join(ROOT, 'src', 'content', 'aircraft.json');
const ICAO_PATH = join(ROOT, 'src', 'content', 'icaoTypes.json');
const NOREBBO_PATH = join(ROOT, 'src', 'content', 'norebboCatalog.json');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const DRY_RUN = process.argv.includes('--dry-run');

/** Extra aliases that filenames often use but aren't in aircraft.json */
const EXTRA_ALIASES = {
  b737: ['737ng', '737 max', '737max', 'boeing 737', 'ng', 'max'],
  a320: ['a320ceo', 'a320neo', 'airbus a320', '320neo', '320ceo'],
  a321: ['a321ceo', 'a321neo', 'a321lr', 'a321xlr', 'airbus a321'],
  b787: ['787', 'b787', 'dreamliner', 'boeing 787'],
  b777: ['777', 'triple seven', 'boeing 777', '777x'],
  b747: ['747', 'jumbo', 'queen of the skies', 'boeing 747'],
  a350: ['a350', 'airbus a350'],
  a380: ['a380', 'superjumbo', 'airbus a380'],
  a330: ['a330', 'a330neo', 'airbus a330'],
  a220: ['a220', 'cs300', 'bombardier cseries', 'airbus a220'],
  e190: [
    'ejet',
    'e-jet',
    'embraer 190',
    'e170',
    'e175',
    'e195',
    'erj-190',
    'erj190',
    'erj-195',
    'erj195',
    'erj-170',
    'erj-175',
  ],
  md11: ['md-11', 'md11', 'mcdonnell douglas'],
  g650: ['g650', 'g650er', 'gulfstream'],
  citationx: ['citation x', 'citationx', 'cessna citation'],
  falcon7x: ['falcon 7x', 'falcon 8x', 'dassault falcon'],
  global7500: ['global 7500', 'global 8000', 'bombardier global'],
  phenom300: ['phenom 300', 'phenom300'],
  learjet75: ['learjet', 'learjet 75'],
  f16: ['f16', 'f-16', 'viper', 'fighting falcon'],
  f35: ['f35', 'f-35', 'lightning ii', 'lightning 2'],
  c130: ['c130', 'c-130', 'hercules', 'ac-130'],
  b52: ['b52', 'b-52', 'buff', 'stratofortress'],
  a10: ['a10', 'a-10', 'warthog', 'thunderbolt'],
  kc135: ['kc135', 'kc-135', 'stratotanker'],
  c172: ['c172', 'cessna 172', 'skyhawk'],
  pa28: ['pa28', 'pa-28', 'cherokee', 'piper'],
  kingair: ['king air', 'kingair', 'beechcraft'],
  dash8: ['dash 8', 'dash8', 'q400', 'q300', 'q200', 'de havilland'],
  atr72: ['atr 72', 'atr72', 'atr-72'],
  bell206: ['bell 206', 'jetranger', 'longranger'],
  uh60: ['uh60', 'uh-60', 'black hawk', 'blackhawk', 'hh-60'],
  h145: ['h145', 'h145m', 'airbus h145', 'ec145'],
  chinook: ['ch-47', 'ch47', 'chinook'],
  apache: ['ah-64', 'ah64', 'apache'],
  crj: ['crj', 'crj-200', 'crj-700', 'crj-900', 'canadair'],
  pc12: ['pc-12', 'pc12', 'pilatus'],
  b757: ['757', 'boeing 757'],
  b767: ['767', 'boeing 767'],
  b727: ['727', 'boeing 727'],
  a340: ['a340', 'airbus a340'],
  c909: ['c909', 'comac 909', 'comac c909', 'arj21', 'arj 21', 'arj-21', 'aj27', 'xiangfeng'],
  c919: ['c919', 'comac 919', 'comac c919'],
  ssj100: ['ssj100', 'ssj 100', 'superjet', 'sukhoi superjet', 'su95'],
  erj145: ['erj145', 'erj-145', 'erj135', 'erj-135', 'embraer 145', 'erj-140'],
  atr42: ['atr 42', 'atr42', 'atr-42'],
  bae146: ['bae 146', 'bae146', 'avro rj', 'jumbolino', 'rj85', 'rj100'],
  fokker100: ['fokker 100', 'fokker100', 'fokker 70', 'f100'],
  b717: ['717', 'b717', 'boeing 717', 'md95'],
  md80: ['md80', 'md-80', 'mad dog', 'md82', 'md83', 'md88', 'md90'],
};

function normalize(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function compact(s) {
  return normalize(s).replace(/\s+/g, '');
}

function walkImages(dir, base = dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    if (name.toLowerCase() === 'readme.md') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkImages(full, base));
    } else if (IMAGE_EXTS.has(extname(name).toLowerCase())) {
      out.push({ full, rel: relative(base, full).split('\\').join('/') });
    }
  }
  return out;
}

function loadIcaoCatalog() {
  try {
    return JSON.parse(readFileSync(ICAO_PATH, 'utf8'));
  } catch {
    return { types: {} };
  }
}

function buildAliasIndex(aircraft) {
  /** @type {Array<{ aircraftId: string, alias: string, compact: string, weight: number, variant?: string }>} */
  const entries = [];

  const add = (aircraftId, alias, weight, variant) => {
    const n = normalize(alias);
    const c = compact(alias);
    if (!n || c.length < 2) return;
    entries.push({ aircraftId, alias: n, compact: c, weight, variant });
  };

  for (const ac of aircraft) {
    add(ac.id, ac.id, 100);
    add(ac.id, ac.family, 90);
    if (ac.nickname) add(ac.id, ac.nickname, 85);
    add(ac.id, ac.manufacturer, 20);

    for (const v of ac.variants ?? []) {
      add(ac.id, v, 80, v);
      add(ac.id, `${ac.id} ${v}`, 95, v);
    }

    for (const code of ac.icaoCodes ?? []) {
      add(ac.id, code, 98);
    }

    for (const extra of EXTRA_ALIASES[ac.id] ?? []) {
      add(ac.id, extra, 70);
    }
  }

  // ICAO / IATA / marketing labels from icaoTypes.json (C909, AJ27, B738, …)
  const icaoCatalog = loadIcaoCatalog();
  for (const type of Object.values(icaoCatalog.types ?? {})) {
    if (!type.familyId) continue;
    add(type.familyId, type.icao, 97, type.variant);
    for (const iata of type.iata ?? []) add(type.familyId, iata, 88, type.variant);
    for (const alias of type.aliases ?? []) add(type.familyId, alias, 75, type.variant);
    if (type.model) add(type.familyId, type.model, 85, type.variant);
  }

  // Longer aliases first so "a321neo" beats "a32" / "a320"
  entries.sort((a, b) => b.compact.length - a.compact.length || b.weight - a.weight);
  return entries;
}

function loadNorebboCatalog() {
  try {
    return JSON.parse(readFileSync(NOREBBO_PATH, 'utf8'));
  } catch {
    return { entries: [], byImageStem: {} };
  }
}

function detectRole(stemNorm) {
  if (/\b(comparison|compare|vs|versus|side by side)\b/.test(stemNorm)) {
    return 'comparison';
  }
  // Line drawings / blueprints → identification diagrams
  if (/\b(diagram|profile|sideview|side view|lineart|line art|line drawing|silhouette|blueprint)\b/.test(stemNorm)) {
    return 'diagram';
  }
  if (/_diagram\b|\bdiagram_|\bdiagram$|line-drawing|line_drawing/.test(stemNorm.replace(/\s+/g, '_'))) {
    return 'diagram';
  }
  // Norebbo all-white side plates are the quiz/flashcard "spot" images
  if (/\bwhite\b/.test(stemNorm)) {
    return 'spot';
  }
  return 'spot';
}

function matchFile(relPath, aliasIndex, norebboIndex) {
  const fileName = basename(relPath);
  const stem = fileName.replace(extname(fileName), '');
  const parent = dirname(relPath);
  const parentToken = parent && parent !== '.' ? parent.split('/')[0] : '';
  const hayRaw = parentToken ? `${parentToken} ${stem}` : stem;
  const hayNorm = normalize(hayRaw);
  const hayCompact = compact(hayRaw);
  const role = detectRole(hayNorm);

  // Explicit id__variant pattern: b737__737-800_01
  // Also sheet-stem pattern: Comac-C909__white / Airbus-A321-P2F__line-drawing
  const dbl = stem.match(/^([A-Za-z0-9-]+)__(.+)$/);
  if (dbl) {
    const left = dbl[1];
    const rest = normalize(dbl[2].replace(/[_-]?0*\d+$/, ''));
    const restRole = detectRole(normalize(dbl[2]));
    const sheetHit = norebboIndex.get(compact(left)) || norebboIndex.get(normalize(left));
    if (sheetHit) {
      if (!sheetHit.familyId) {
        return null; // sheet concept / unmapped type — don't fuzzy-assign
      }
      return {
        aircraftId: sheetHit.familyId,
        variant: sheetHit.sheetName,
        role: restRole === 'spot' ? role : restRole,
        matchedBy: `sheet-stem:${sheetHit.imageStem}→row ${sheetHit.sheetRow}`,
        score: 1100,
        sheetRow: sheetHit.sheetRow,
      };
    }
    const idPart = compact(left);
    const idHit = aliasIndex.find((a) => a.compact === idPart && a.weight >= 100);
    if (idHit) {
      const variantHit = aliasIndex.find(
        (a) => a.aircraftId === idHit.aircraftId && a.variant && (rest.includes(a.alias) || compact(rest).includes(a.compact))
      );
      return {
        aircraftId: idHit.aircraftId,
        variant: variantHit?.variant,
        role: restRole === 'diagram' || restRole === 'comparison' ? restRole : role,
        matchedBy: `id__variant:${idHit.aircraftId}`,
        score: 1000,
      };
    }
  }

  // Whole-stem sheet match (no __ suffix)
  for (const [key, entry] of norebboIndex) {
    if (hayCompact === key || hayCompact.startsWith(key)) {
      if (!entry.familyId) continue;
      return {
        aircraftId: entry.familyId,
        variant: entry.sheetName,
        role,
        matchedBy: `sheet-stem:${entry.imageStem}→row ${entry.sheetRow}`,
        score: 1050,
        sheetRow: entry.sheetRow,
      };
    }
  }

  // Leading type token from Norebbo-style names: 707-320C_…, A320_…, ERJ-190_…
  const lead = stem.match(
    /^(A3\d{2}|A2\d{2}|B?\d{3}|DC-?\d|MD-?\d+|L-?1011|ERJ-?\d+|CRJ-?\d+|E1[789]\d|EMB-?\d+)/i
  );
  const leadCompact = lead ? compact(lead[1]) : '';

  let best = null;
  for (const alias of aliasIndex) {
    if (!hayCompact.includes(alias.compact) && !hayNorm.includes(alias.alias)) continue;
    // Prefer boundary-ish matches: avoid "a32" / "air" matching inside unrelated strings
    if (alias.compact.length < 3 && alias.weight < 90) continue;
    if (alias.compact.length <= 3 && alias.weight < 90 && !/\d/.test(alias.compact)) continue;
    let score = alias.weight * 10 + alias.compact.length;
    // Strongly prefer the type code that starts the filename (707-320 → 707, not 320→a320)
    if (leadCompact) {
      if (alias.compact === leadCompact || leadCompact.startsWith(alias.compact) || alias.compact.startsWith(leadCompact)) {
        score += 500;
      } else if (
        // Penalize Airbus 320-family aliases when the file is clearly a Boeing 7xx-320 series
        /^(707|727|737|747|757|767|777|787)/i.test(leadCompact) &&
        (alias.aircraftId === 'a320' || alias.aircraftId === 'a321')
      ) {
        score -= 800;
      }
    }
    if (!best || score > best.score) {
      best = {
        aircraftId: alias.aircraftId,
        variant: alias.variant,
        role,
        matchedBy: `alias:${alias.alias}`,
        score,
      };
    }
  }

  // Disambiguate A320 vs A321 when both could match
  if (best && (best.aircraftId === 'a320' || best.aircraftId === 'a321')) {
    if (/\ba321\b|a321/.test(hayNorm) || hayCompact.includes('a321')) {
      best = { ...best, aircraftId: 'a321', matchedBy: `${best.matchedBy}+a321-prefer` };
    } else if (/\ba320\b|a320/.test(hayNorm) || hayCompact.includes('a320') || /\ba319\b|a319/.test(hayNorm)) {
      best = { ...best, aircraftId: 'a320', matchedBy: `${best.matchedBy}+a320-prefer` };
    }
  }

  // If we matched a family but not a variant, try variant aliases for that aircraft
  if (best && !best.variant) {
    let variantBest = null;
    for (const alias of aliasIndex) {
      if (alias.aircraftId !== best.aircraftId || !alias.variant) continue;
      if (!hayCompact.includes(alias.compact) && !hayNorm.includes(alias.alias)) continue;
      const score = alias.compact.length;
      if (!variantBest || score > variantBest.score) {
        variantBest = { variant: alias.variant, score, alias: alias.alias };
      }
    }
    if (variantBest) {
      best = {
        ...best,
        variant: variantBest.variant,
        matchedBy: `${best.matchedBy}+variant:${variantBest.alias}`,
      };
    }
  }

  return best;
}

function safeSlug(s) {
  return normalize(s).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'photo';
}

function buildNorebboIndex(norebbo) {
  /** @type {Map<string, { familyId: string|null, sheetRow: number, sheetName: string, imageStem: string }>} */
  const map = new Map();
  for (const e of norebbo.entries ?? []) {
    const rec = {
      familyId: e.familyId,
      sheetRow: e.sheetRow,
      sheetName: e.sheetName,
      imageStem: e.imageStem,
    };
    map.set(compact(e.imageStem), rec);
    map.set(normalize(e.imageStem), rec);
    map.set(compact(e.sheetName), rec);
  }
  return map;
}

function main() {
  const aircraft = JSON.parse(readFileSync(AIRCRAFT_PATH, 'utf8'));
  const aliasIndex = buildAliasIndex(aircraft);
  const norebbo = loadNorebboCatalog();
  const norebboIndex = buildNorebboIndex(norebbo);
  const files = walkImages(IMAGES_DIR);

  if (!existsSync(IMAGES_DIR)) {
    mkdirSync(IMAGES_DIR, { recursive: true });
  }

  console.log(`Found ${files.length} image(s) in images/`);
  console.log(`Norebbo sheet stems loaded: ${norebbo.entries?.length ?? 0}`);

  /** @type {import('../src/types/index.ts').PhotoCatalogEntry[]} */
  const photos = [];
  const unmatched = [];
  const counters = new Map(); // aircraftId:role -> n

  // Clear previously synced copies (keep .gitkeep)
  if (!DRY_RUN && existsSync(PUBLIC_AIRCRAFT_DIR)) {
    for (const id of readdirSync(PUBLIC_AIRCRAFT_DIR)) {
      const p = join(PUBLIC_AIRCRAFT_DIR, id);
      if (!statSync(p).isDirectory()) continue;
      for (const f of readdirSync(p)) {
        if (f === '.gitkeep') continue;
        rmSync(join(p, f), { force: true });
      }
    }
  }

  for (const file of files) {
    const hit = matchFile(file.rel, aliasIndex, norebboIndex);
    if (!hit) {
      unmatched.push({ sourceFile: file.rel, reason: 'No aircraft id/family/variant match' });
      console.log(`  ? unmatched  ${file.rel}`);
      continue;
    }

    const key = `${hit.aircraftId}:${hit.role}`;
    const idx = (counters.get(key) ?? 0) + 1;
    counters.set(key, idx);

    const ext = extname(file.full).toLowerCase();
    const variantSlug = hit.variant ? `__${safeSlug(hit.variant)}` : '';
    const destName = `${hit.role}${variantSlug}_${String(idx).padStart(2, '0')}${ext}`;
    const destDir = join(PUBLIC_AIRCRAFT_DIR, hit.aircraftId);
    const destFull = join(destDir, destName);
    const publicPath = `/assets/aircraft/${hit.aircraftId}/${destName}`;

    if (!DRY_RUN) {
      mkdirSync(destDir, { recursive: true });
      copyFileSync(file.full, destFull);
    }

    const entry = {
      id: `${hit.aircraftId}-${hit.role}-${String(idx).padStart(2, '0')}${hit.variant ? `-${safeSlug(hit.variant)}` : ''}`,
      aircraftId: hit.aircraftId,
      role: hit.role,
      ...(hit.variant ? { variant: hit.variant } : {}),
      ...(hit.sheetRow ? { sheetRow: hit.sheetRow } : {}),
      sourceFile: file.rel,
      publicPath,
      attribution: /liveries\//i.test(file.rel)
        ? 'Norebbo airline livery illustration'
        : 'User provided (Norebbo pack)',
      matchedBy: hit.matchedBy,
      sortIndex: idx,
    };
    photos.push(entry);

    const label = hit.variant ? `${hit.aircraftId} / ${hit.variant}` : hit.aircraftId;
    console.log(`  ✓ ${hit.role.padEnd(11)} ${label.padEnd(36)} ← ${file.rel}`);
  }

  photos.sort((a, b) => a.aircraftId.localeCompare(b.aircraftId) || a.role.localeCompare(b.role) || a.sortIndex - b.sortIndex);

  const byAircraft = {};
  for (const p of photos) {
    if (!byAircraft[p.aircraftId]) byAircraft[p.aircraftId] = { spot: [], diagram: [], comparison: [] };
    if (!byAircraft[p.aircraftId][p.role]) byAircraft[p.aircraftId][p.role] = [];
    byAircraft[p.aircraftId][p.role].push(p);
  }

  const catalog = {
    version: 1,
    updatedAt: new Date().toISOString(),
    sourceDir: 'images',
    publicDir: 'public/assets/aircraft',
    photos,
    byAircraft,
    unmatched,
    stats: {
      sourceFiles: files.length,
      matched: photos.length,
      unmatched: unmatched.length,
      aircraftCovered: Object.keys(byAircraft).length,
    },
  };

  if (!DRY_RUN) {
    writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + '\n');
    console.log(`\nWrote ${CATALOG_PATH}`);
  } else {
    console.log('\nDry run — catalog not written.');
  }

  console.log(
    `Stats: ${catalog.stats.matched} matched, ${catalog.stats.unmatched} unmatched, ${catalog.stats.aircraftCovered}/${aircraft.length} aircraft covered`
  );

  if (unmatched.length) {
    console.log('\nUnmatched files (rename using an aircraft id, then re-run):');
    for (const u of unmatched) console.log(`  - ${u.sourceFile}`);
  }
}

main();
