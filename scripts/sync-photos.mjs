/**
 * Scan photos/ for aircraft images, identify them from filenames,
 * copy into public/assets/aircraft/{id}/, and write src/content/photoCatalog.json.
 *
 * Usage:
 *   npm run sync-photos
 *   node scripts/sync-photos.mjs --dry-run
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
const PHOTOS_DIR = join(ROOT, 'photos');
const PUBLIC_AIRCRAFT_DIR = join(ROOT, 'public', 'assets', 'aircraft');
const CATALOG_PATH = join(ROOT, 'src', 'content', 'photoCatalog.json');
const AIRCRAFT_PATH = join(ROOT, 'src', 'content', 'aircraft.json');

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
  e190: ['ejet', 'e-jet', 'embraer 190', 'e170', 'e175', 'e195'],
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

    for (const extra of EXTRA_ALIASES[ac.id] ?? []) {
      add(ac.id, extra, 70);
    }
  }

  // Longer aliases first so "a321neo" beats "a32" / "a320"
  entries.sort((a, b) => b.compact.length - a.compact.length || b.weight - a.weight);
  return entries;
}

function detectRole(stemNorm) {
  if (/\b(diagram|profile|sideview|side view|lineart|line art|silhouette)\b/.test(stemNorm)) {
    return 'diagram';
  }
  if (/_diagram\b|\bdiagram_|\bdiagram$/.test(stemNorm.replace(/\s+/g, '_'))) {
    return 'diagram';
  }
  return 'spot';
}

function matchFile(relPath, aliasIndex) {
  const fileName = basename(relPath);
  const stem = fileName.replace(extname(fileName), '');
  const parent = dirname(relPath);
  const parentToken = parent && parent !== '.' ? parent.split('/')[0] : '';
  const hayRaw = parentToken ? `${parentToken} ${stem}` : stem;
  const hayNorm = normalize(hayRaw);
  const hayCompact = compact(hayRaw);
  const role = detectRole(hayNorm);

  // Explicit id__variant pattern: b737__737-800_01
  const dbl = stem.match(/^([A-Za-z0-9-]+)__(.+)$/);
  if (dbl) {
    const idPart = compact(dbl[1]);
    const rest = normalize(dbl[2].replace(/[_-]?0*\d+$/, ''));
    const idHit = aliasIndex.find((a) => a.compact === idPart && a.weight >= 100);
    if (idHit) {
      const variantHit = aliasIndex.find(
        (a) => a.aircraftId === idHit.aircraftId && a.variant && (rest.includes(a.alias) || compact(rest).includes(a.compact))
      );
      return {
        aircraftId: idHit.aircraftId,
        variant: variantHit?.variant,
        role: detectRole(normalize(dbl[2])) === 'diagram' ? 'diagram' : role,
        matchedBy: `id__variant:${idHit.aircraftId}`,
        score: 1000,
      };
    }
  }

  let best = null;
  for (const alias of aliasIndex) {
    if (!hayCompact.includes(alias.compact) && !hayNorm.includes(alias.alias)) continue;
    // Prefer boundary-ish matches: avoid "a32" matching inside unrelated strings via min length
    if (alias.compact.length < 3 && alias.weight < 90) continue;
    const score = alias.weight * 10 + alias.compact.length;
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
    } else if (/\ba320\b|a320/.test(hayNorm) || hayCompact.includes('a320')) {
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

function main() {
  const aircraft = JSON.parse(readFileSync(AIRCRAFT_PATH, 'utf8'));
  const aliasIndex = buildAliasIndex(aircraft);
  const files = walkImages(PHOTOS_DIR);

  if (!existsSync(PHOTOS_DIR)) {
    mkdirSync(PHOTOS_DIR, { recursive: true });
  }

  console.log(`Found ${files.length} image(s) in photos/`);

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
    const hit = matchFile(file.rel, aliasIndex);
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
      sourceFile: file.rel,
      publicPath,
      attribution: 'User provided',
      matchedBy: hit.matchedBy,
      sortIndex: idx,
    };
    photos.push(entry);

    const label = hit.variant ? `${hit.aircraftId} / ${hit.variant}` : hit.aircraftId;
    console.log(`  ✓ ${hit.role.padEnd(8)} ${label.padEnd(28)} ← ${file.rel}`);
  }

  photos.sort((a, b) => a.aircraftId.localeCompare(b.aircraftId) || a.role.localeCompare(b.role) || a.sortIndex - b.sortIndex);

  const byAircraft = {};
  for (const p of photos) {
    if (!byAircraft[p.aircraftId]) byAircraft[p.aircraftId] = { spot: [], diagram: [] };
    byAircraft[p.aircraftId][p.role].push(p);
  }

  const catalog = {
    version: 1,
    updatedAt: new Date().toISOString(),
    sourceDir: 'photos',
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
