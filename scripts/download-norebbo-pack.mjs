/**
 * Download blank/line/comparison plates from every Norebbo page in
 * norebboCatalog.json into images/, named to match sheet stems.
 *
 *   node scripts/download-norebbo-pack.mjs
 *   node scripts/download-norebbo-pack.mjs --limit=5
 *   node scripts/download-norebbo-pack.mjs --force
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'images');
const CATALOG = join(ROOT, 'src', 'content', 'norebboCatalog.json');
const LOG = join(ROOT, 'scripts', 'norebbo-download-log.json');

const FORCE = process.argv.includes('--force');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

const UA = 'Mozilla/5.0 (compatible; SpotterFieldGuide/1.0; +local aircraft quiz pack)';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalize(s) {
  return String(s)
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function compact(s) {
  return normalize(s).replace(/\s+/g, '');
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

async function downloadTo(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  return dest;
}

function stripSizeSuffix(url) {
  return url
    .replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp)$)/i, '')
    .replace(/_sm(?=\.(?:jpe?g|png|webp)$)/i, '');
}

function roleFrom(alt, file) {
  const h = `${alt} ${file}`.toLowerCase();
  if (/compar|difference|side.?by.?side|versus|\bvs\b/.test(h)) return 'comparison';
  if (/line.?drawing|blueprint|wireframe|technical/.test(h)) return 'line-drawing';
  if (/white|blank|all.?white|side.?view|side.?profile|template/.test(h)) return 'white';
  if (/_white|white_/.test(file.toLowerCase())) return 'white';
  if (/line.?draw|blueprint/.test(file.toLowerCase())) return 'line-drawing';
  return null;
}

function variantSlug(alt, file, stemTokens) {
  const h = normalize(`${alt} ${file}`);
  const bits = [];
  if (/combi|special freighter|\bsf\b|bcf|p2f|freighter|cargo/.test(h)) {
    if (/combi/.test(h)) bits.push('combi');
    else if (/bcf/.test(h)) bits.push('bcf');
    else if (/p2f/.test(h)) bits.push('p2f');
    else bits.push('freighter');
  }
  if (/without (blended )?winglets|no winglets|naked/.test(h)) bits.push('no-winglets');
  else if (/split scimitar/.test(h)) bits.push('split-scimitar');
  else if (/sharklet/.test(h)) bits.push('sharklets');
  else if (/blended winglet/.test(h)) bits.push('blended-winglets');
  else if (/\bwinglet/.test(h) && !/without/.test(h)) bits.push('winglets');
  if (/pratt|p.?w|pw\b/.test(h)) bits.push('pw');
  if (/rolls|royce|\brr\b/.test(h)) bits.push('rr');
  if (/\bge\b|general electric|cf6|ge90|genx/.test(h)) bits.push('ge');
  if (/cfm56/.test(h)) bits.push('cfm56');
  if (/v2500|iae/.test(h)) bits.push('v2500');
  if (/leap/.test(h)) bits.push('leap');
  if (/\bneo\b/.test(h)) bits.push('neo');
  if (/\bceo\b/.test(h)) bits.push('ceo');
  if (/passenger/.test(h)) bits.push('passenger');
  // drop tokens that are just the aircraft identity
  const filtered = bits.filter((b) => !stemTokens.has(b));
  return filtered.join('-') || 'base';
}

function pageTokens(entry) {
  const raw = `${entry.sheetName} ${entry.imageStem} ${entry.norebboTitle || ''} ${(entry.norebboUrl || '').split('/').pop()}`;
  const toks = new Set(
    normalize(raw)
      .split(' ')
      .filter((t) => t.length >= 2 && !['and', 'with', 'without', 'the', 'blank', 'illustration', 'templates', 'template', 'side', 'view', 'plus', 'including', 'versions', 'engines', 'engine'].includes(t))
  );
  return toks;
}

function scoreRelevance(alt, file, tokens) {
  const hay = compact(`${alt} ${file}`);
  let score = 0;
  for (const t of tokens) {
    const c = compact(t);
    if (c.length < 2) continue;
    if (hay.includes(c)) score += c.length >= 4 ? 3 : 1;
  }
  // strong model number boosts
  const nums = [...tokens].filter((t) => /\d/.test(t));
  for (const n of nums) {
    if (hay.includes(compact(n))) score += 5;
  }
  return score;
}

function extractImages(html) {
  const out = [];
  const re = /<img\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const src = tag.match(/(?:src|data-src|data-lazy-src)="([^"]+)"/i)?.[1];
    const srcset = tag.match(/srcset="([^"]+)"/i)?.[1];
    const alt = tag.match(/alt="([^"]*)"/i)?.[1] || '';
    const urls = [];
    if (src) urls.push(src.split('?')[0]);
    if (srcset) {
      for (const part of srcset.split(',')) {
        const u = part.trim().split(/\s+/)[0];
        if (u) urls.push(u.split('?')[0]);
      }
    }
    for (const u of urls) {
      if (!u.includes('wp-content/uploads')) continue;
      if (/logo|avatar|cropped|favicon|emoji|youtube|facebook|twitter|instagram|gravatar/i.test(u)) continue;
      out.push({ url: u, alt: alt.replace(/&amp;/g, '&').replace(/&#8217;/g, "'") });
    }
  }
  return out;
}

function pickBestUrl(candidates) {
  // prefer non-resized, non-_sm, largest path as proxy
  const ranked = [...new Set(candidates)].map((u) => {
    let score = 0;
    if (!/-\d+x\d+\./i.test(u)) score += 50;
    if (!/_sm\./i.test(u)) score += 20;
    if (/\.png$/i.test(u)) score += 2;
    score += Math.min(u.length, 200) / 100;
    return { u, score };
  });
  ranked.sort((a, b) => b.score - a.score);
  return ranked[0]?.u;
}

function groupKey(role, variant) {
  return `${variant}::${role}`;
}

async function processEntry(entry, log) {
  if (!entry.norebboUrl) {
    return { skipped: true, reason: 'no url' };
  }
  const html = await fetchText(entry.norebboUrl);
  const imgs = extractImages(html);
  const tokens = pageTokens(entry);
  const stemTokens = new Set(normalize(entry.imageStem).split(' '));

  // Score and keep page-relevant images
  const scored = imgs
    .map((im) => ({ ...im, score: scoreRelevance(im.alt, im.url.split('/').pop(), tokens) }))
    .filter((im) => im.score >= 4);

  // Fallback: if scoring too strict, take first content images before related posts
  // by requiring at least one digit/model token match when available
  let pool = scored;
  if (pool.length < 2) {
    pool = imgs
      .map((im) => ({ ...im, score: scoreRelevance(im.alt, im.url.split('/').pop(), tokens) }))
      .filter((im) => im.score >= 2);
  }

  // Deduplicate by preferred full URL + role/variant
  const byGroup = new Map();
  for (const im of pool) {
    const file = im.url.split('/').pop();
    const role = roleFrom(im.alt, file);
    if (!role) continue;
    const variant = variantSlug(im.alt, file, stemTokens);
    const full = stripSizeSuffix(im.url);
    const key = groupKey(role, variant);
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(full);
    if (full !== im.url) byGroup.get(key).push(im.url);
  }

  // Prefer white + line-drawing; keep comparison if present
  // Limit variants: keep all distinct white/line pairs (usually 1–4)
  const saved = [];
  const variantsSeen = new Set();
  for (const [key, urls] of byGroup) {
    const [variant, role] = key.split('::');
    variantsSeen.add(variant);
    const suffix = variant === 'base' ? role : `${variant}-${role}`;
    const ext = (pickBestUrl(urls) || urls[0]).match(/\.(jpe?g|png|webp)$/i)?.[0]?.toLowerCase() || '.jpg';
    const destName = `${entry.imageStem}__${suffix}${ext === '.jpeg' ? '.jpg' : ext}`;
    const dest = join(OUT, destName);
    if (existsSync(dest) && !FORCE) {
      saved.push({ destName, skipped: true });
      continue;
    }
    const candidates = [...new Set(urls.map(stripSizeSuffix).concat(urls))];
    let ok = false;
    let lastErr = null;
    for (const u of candidates) {
      try {
        await downloadTo(u, dest);
        // reject tiny failures
        const { size } = await import('fs').then((fs) => fs.statSync(dest));
        if (size < 4000) {
          lastErr = `too small ${size}`;
          continue;
        }
        saved.push({ destName, url: u, bytes: size });
        ok = true;
        break;
      } catch (e) {
        lastErr = String(e.message || e);
      }
    }
    if (!ok) saved.push({ destName, error: lastErr });
    await sleep(120);
  }

  return {
    sheetRow: entry.sheetRow,
    sheetName: entry.sheetName,
    url: entry.norebboUrl,
    variants: [...variantsSeen],
    saved,
  };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
  const entries = catalog.entries.filter((e) => e.norebboUrl);
  const results = existsSync(LOG) && !FORCE ? JSON.parse(readFileSync(LOG, 'utf8')) : { runs: [] };
  const doneRows = new Set((results.runs || []).filter((r) => r.ok).map((r) => r.sheetRow));

  let n = 0;
  for (const entry of entries) {
    if (n >= LIMIT) break;
    if (!FORCE && doneRows.has(entry.sheetRow)) {
      // still ensure files exist; if none for stem, re-do
      const has = existsSync(OUT) &&
        (await import('fs')).readdirSync(OUT).some((f) => f.startsWith(entry.imageStem + '__'));
      if (has) continue;
    }
    n += 1;
    process.stdout.write(`\n[${entry.sheetRow}] ${entry.sheetName}\n`);
    try {
      const result = await processEntry(entry, results);
      const ok = (result.saved || []).some((s) => s.bytes || s.skipped);
      console.log(
        `  → ${(result.saved || []).map((s) => (s.error ? `ERR ${s.destName}` : s.destName)).join('\n     ') || '(none)'}`
      );
      results.runs = (results.runs || []).filter((r) => r.sheetRow !== entry.sheetRow);
      results.runs.push({ sheetRow: entry.sheetRow, ok, ...result, at: new Date().toISOString() });
      writeFileSync(LOG, JSON.stringify(results, null, 2) + '\n');
    } catch (e) {
      console.error('  FAIL', e.message || e);
      results.runs = (results.runs || []).filter((r) => r.sheetRow !== entry.sheetRow);
      results.runs.push({ sheetRow: entry.sheetRow, ok: false, error: String(e.message || e), at: new Date().toISOString() });
      writeFileSync(LOG, JSON.stringify(results, null, 2) + '\n');
    }
    await sleep(250);
  }

  const files = (await import('fs')).readdirSync(OUT).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  console.log(`\nDone. images/ now has ${files.length} files. Log: ${LOG}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
