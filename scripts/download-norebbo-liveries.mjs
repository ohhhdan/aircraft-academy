/**
 * Crawl Norebbo airline-liveries category (4 pages), download side-view
 * livery illustrations into images/liveries/, and write a catalog + log.
 *
 *   node scripts/download-norebbo-liveries.mjs
 *   node scripts/download-norebbo-liveries.mjs --limit=3
 *   node scripts/download-norebbo-liveries.mjs --force
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'images', 'liveries');
const CATALOG = join(ROOT, 'src', 'content', 'norebboLiveryCatalog.json');
const LOG = join(ROOT, 'scripts', 'norebbo-livery-download-log.json');
const CSV = join(ROOT, 'NOREBBO_LIVERY_IMAGE_MAP.csv');

const FORCE = process.argv.includes('--force');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

const UA = 'Mozilla/5.0 (compatible; SpotterFieldGuide/1.0; +local aircraft quiz pack)';
const CATEGORY_PAGES = [
  'https://www.norebbo.com/category/airline-liveries/',
  'https://www.norebbo.com/category/airline-liveries/page/2/',
  'https://www.norebbo.com/category/airline-liveries/page/3/',
  'https://www.norebbo.com/category/airline-liveries/page/4/',
];

/** Meta / tutorial posts that are not airline livery galleries */
const SKIP_SLUGS = new Set([
  'airline-livery-design',
  'how-to-add-realistic-color-and-highlights-to-my-free-side-view-airliner-templates',
]);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripSizeSuffix(url) {
  return url
    .replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp)$)/i, '')
    .replace(/_sm(?=\.(?:jpe?g|png|webp)$)/i, '');
}

function slugFromUrl(url) {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, '');
    return path.split('/').filter(Boolean).pop() || '';
  } catch {
    return '';
  }
}

function airlineSlugFromPost(slug) {
  return slug
    .replace(/-livery$/i, '')
    .replace(/^new-/i, '')
    .replace(/-new$/i, '')
    .replace(/-streamers-tail-design$/i, '')
    .replace(/-saul-bass-retro-/i, '-')
    .replace(/-retro-/i, '-');
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

function extractEntryContent(html) {
  const m = html.match(/class="[^"]*entry-content[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*(?:<footer|<!--|<\/article)/i);
  if (m) return m[0];
  // Fallback: between entry-content-wrap open and related posts
  const start = html.search(/class="[^"]*entry-content[^"]*"/i);
  if (start < 0) return html;
  const end = html.search(/class="[^"]*entry-related|id="comments"|class="[^"]*related-posts/i);
  return html.slice(start, end > start ? end : start + 200000);
}

function extractImages(htmlChunk) {
  const out = [];
  const re = /<img\b[^>]*>/gi;
  let m;
  while ((m = re.exec(htmlChunk))) {
    const tag = m[0];
    const src = tag.match(/(?:src|data-src|data-lazy-src)="([^"]+)"/i)?.[1];
    const srcset = tag.match(/srcset="([^"]+)"/i)?.[1];
    const alt = decodeHtml(tag.match(/alt="([^"]*)"/i)?.[1] || '');
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
      if (/logo|avatar|cropped|favicon|emoji|youtube|facebook|twitter|instagram|gravatar|engio/i.test(u)) {
        continue;
      }
      out.push({ url: u, alt });
    }
  }
  return out;
}

function pickBestUrl(candidates) {
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

/** True if filename/alt looks like a side-view aircraft illustration (not a collage/hero). */
function isAircraftPlate(file, alt, airlineHint) {
  const f = file.toLowerCase();
  const a = alt.toLowerCase();

  // Skip blank white *templates* (747-400_white.jpg), not paint names like blue_and_white
  if (
    /(?:^|[_-])(?:all[_-]?)?white(?:[_-](?:template|plate|side))?\.(?:jpe?g|png|webp)$/i.test(f) &&
    !/(?:_and_white|white_background|livery|airline|colors)/i.test(f)
  ) {
    return false;
  }
  if (/adding_color_to_norebbo|tutorial|step[_-]?\d|color-palette|logo\.|sunburst|vertical-stabilizer/i.test(f)) {
    return false;
  }
  // Tail/color collage boards without a type
  if (/(tail-designs|tail-colors|livery-colors|stabilizer)/i.test(f) && !hasTypeToken(f) && !hasTypeToken(a)) {
    return false;
  }

  // Hero / collage without a type code
  if (/tails?\.jpg$|livery\.jpg$|livery-history|overview/.test(f) && !hasTypeToken(f)) {
    if (!hasTypeToken(a) && !/side profile/.test(a)) return false;
  }

  if (hasTypeToken(f) || hasTypeToken(a)) return true;
  if (/side profile|side view illustration/.test(a)) return true;
  if (airlineHint && f.includes(airlineHint.replace(/-/g, '_')) && hasTypeToken(`${f} ${a}`)) return true;
  return false;
}

function hasTypeToken(s) {
  // Underscores count as word chars in JS \b, so use a custom boundary.
  // Allow subtype suffixes like a321lr / a321neo / a321xlr attached to the type code.
  return /(?:^|[^a-z0-9])(a3\d{2}(?:neo|lr|xlr|ceo)?|a2\d{2}|a319|a320|a321|b?\d{3}(?:-\d{1,3})?|dc-?\d|md-?\d+|l-?1011|erj(?:-\d+)?|crj(?:-\d+)?|atr|e1[789]\d|e195|c9\d{2}|737|747|757|767|777|787|707|717|727|max)(?![a-z0-9])/i.test(
    s
  );
}

/** Pull a short type slug from alt/filename for dest naming when the file lacks one. */
function typeSlugFrom(file, alt) {
  const hay = `${file} ${alt}`;
  const m = hay.match(
    /(?:^|[^a-z0-9])(a3\d{2}(?:neo|lr|xlr|ceo)?|a2\d{2}|erj-?\d+|crj-?\d+|e1[789]\d|e195|l-?1011|dc-?\d(?:-\d+)?|md-?\d+|7\d{2}(?:-\d+)?(?:er|lr|f)?|a3[0-8]\d(?:-\d+)?)/i
  );
  return m ? m[1].replace(/\s+/g, '') : '';
}

function listCategoryPosts(html) {
  const posts = [];
  const re = /class="entry-title"><a href="([^"]+)" rel="bookmark">([^<]+)/gi;
  let m;
  while ((m = re.exec(html))) {
    const url = m[1];
    const title = decodeHtml(m[2]).trim();
    const slug = slugFromUrl(url);
    if (!slug || SKIP_SLUGS.has(slug)) continue;
    posts.push({ url, title, slug });
  }
  return posts;
}

function destNameFor(url, airlineSlug, alt = '') {
  let file = basename(stripSizeSuffix(url));
  // Normalize jpeg → jpg
  file = file.replace(/\.jpeg$/i, '.jpg');
  const ext = file.match(/\.(jpe?g|png|webp)$/i)?.[0] || '.jpg';
  let stem = file.replace(/\.(jpe?g|png|webp)$/i, '');

  // If the file has no type token but the alt does, prefix it (helps sync matching)
  if (!hasTypeToken(stem)) {
    const type = typeSlugFrom(stem, alt);
    if (type) stem = `${type}_${stem}`;
  }

  // Ensure "livery" appears so sync prefers these as spot photos
  if (!/livery/i.test(stem)) {
    const airlineBit = airlineSlug ? `_${airlineSlug.replace(/-/g, '_')}` : '';
    if (!airlineBit || stem.toLowerCase().includes(airlineSlug.replace(/-/g, '_'))) {
      stem = `${stem}_livery`;
    } else {
      stem = `${stem}${airlineBit}_livery`;
    }
  }
  // Collapse double underscores / spaces
  return `${stem}${ext}`.replace(/\s+/g, '_').replace(/_+/g, '_');
}

async function processPost(post) {
  const html = await fetchText(post.url);
  const chunk = extractEntryContent(html);
  const imgs = extractImages(chunk);
  const airlineSlug = airlineSlugFromPost(post.slug);
  const airlineHint = airlineSlug.replace(/-/g, '_');

  const byFile = new Map();
  for (const im of imgs) {
    const full = stripSizeSuffix(im.url);
    const file = basename(full);
    if (!isAircraftPlate(file, im.alt, airlineHint)) continue;
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file).push(full, im.url);
  }

  const saved = [];
  for (const [file, urls] of byFile) {
    const alt = imgs.find((i) => basename(stripSizeSuffix(i.url)) === file)?.alt || '';
    const destName = destNameFor(pickBestUrl(urls) || urls[0], airlineSlug, alt);
    const dest = join(OUT, destName);
    if (existsSync(dest) && !FORCE) {
      saved.push({ destName, sourceFile: file, skipped: true, alt });
      continue;
    }
    const candidates = [...new Set(urls.map(stripSizeSuffix).concat(urls))];
    let ok = false;
    let lastErr = null;
    for (const u of candidates) {
      try {
        await downloadTo(u, dest);
        const { size } = await import('fs').then((fs) => fs.statSync(dest));
        if (size < 4000) {
          lastErr = `too small ${size}`;
          continue;
        }
        saved.push({ destName, sourceFile: file, url: u, bytes: size, alt });
        ok = true;
        break;
      } catch (e) {
        lastErr = String(e.message || e);
      }
    }
    if (!ok) saved.push({ destName, sourceFile: file, error: lastErr, alt });
    await sleep(100);
  }

  return {
    slug: post.slug,
    title: post.title,
    url: post.url,
    airlineSlug,
    imageCount: saved.filter((s) => s.bytes || s.skipped).length,
    saved,
  };
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  console.log('Crawling airline-liveries category pages…');
  const seen = new Map();
  for (const pageUrl of CATEGORY_PAGES) {
    const html = await fetchText(pageUrl);
    for (const post of listCategoryPosts(html)) {
      if (!seen.has(post.slug)) seen.set(post.slug, post);
    }
    console.log(`  ${pageUrl} → running total ${seen.size} posts`);
    await sleep(200);
  }

  const posts = [...seen.values()];
  console.log(`\nFound ${posts.length} livery posts (after skipping tutorials).\n`);

  const results = existsSync(LOG) && !FORCE ? JSON.parse(readFileSync(LOG, 'utf8')) : { runs: [] };
  const done = new Set((results.runs || []).filter((r) => r.ok).map((r) => r.slug));

  const catalogEntries = [];
  let n = 0;
  for (const post of posts) {
    if (n >= LIMIT) break;
    if (!FORCE && done.has(post.slug)) {
      const prior = (results.runs || []).find((r) => r.slug === post.slug && r.ok);
      if (prior) {
        catalogEntries.push({
          slug: post.slug,
          title: post.title,
          url: post.url,
          airlineSlug: prior.airlineSlug || airlineSlugFromPost(post.slug),
          images: (prior.saved || [])
            .filter((s) => s.bytes || s.skipped)
            .map((s) => ({ destName: s.destName, sourceFile: s.sourceFile, url: s.url, alt: s.alt || '' })),
        });
        continue;
      }
    }
    n += 1;
    process.stdout.write(`[${n}] ${post.title}\n`);
    try {
      const result = await processPost(post);
      const ok = (result.saved || []).some((s) => s.bytes || s.skipped);
      console.log(
        `  → ${result.imageCount} image(s)\n     ${(result.saved || [])
          .map((s) => (s.error ? `ERR ${s.destName}` : s.destName))
          .join('\n     ') || '(none)'}`
      );
      results.runs = (results.runs || []).filter((r) => r.slug !== post.slug);
      results.runs.push({ ...result, ok, at: new Date().toISOString() });
      writeFileSync(LOG, JSON.stringify(results, null, 2) + '\n');
      catalogEntries.push({
        slug: post.slug,
        title: post.title,
        url: post.url,
        airlineSlug: result.airlineSlug,
        images: (result.saved || [])
          .filter((s) => s.bytes || s.skipped)
          .map((s) => ({ destName: s.destName, sourceFile: s.sourceFile, url: s.url, alt: s.alt || '' })),
      });
    } catch (e) {
      console.error('  FAIL', e.message || e);
      results.runs = (results.runs || []).filter((r) => r.slug !== post.slug);
      results.runs.push({
        slug: post.slug,
        title: post.title,
        url: post.url,
        ok: false,
        error: String(e.message || e),
        at: new Date().toISOString(),
      });
      writeFileSync(LOG, JSON.stringify(results, null, 2) + '\n');
    }
    await sleep(250);
  }

  const catalog = {
    version: 1,
    source: 'https://www.norebbo.com/category/airline-liveries/',
    pages: 4,
    updatedAt: new Date().toISOString().slice(0, 10),
    note: 'Norebbo airline livery side-view illustrations for Spotter quiz photos. Files live under images/liveries/.',
    entries: catalogEntries,
  };
  writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n');

  const csvLines = ['slug,airlineSlug,destName,sourceFile,url'];
  for (const e of catalogEntries) {
    for (const im of e.images || []) {
      csvLines.push(
        [e.slug, e.airlineSlug, im.destName, im.sourceFile, im.url || '']
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(',')
      );
    }
  }
  writeFileSync(CSV, csvLines.join('\n') + '\n');

  const files = (await import('fs')).readdirSync(OUT).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  console.log(`\nDone. images/liveries/ has ${files.length} files.`);
  console.log(`Catalog: ${CATALOG}`);
  console.log(`CSV: ${CSV}`);
  console.log(`Log: ${LOG}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
