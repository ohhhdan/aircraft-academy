# Photos drop folder

Drop your own aircraft photos here. Run **`npm run sync-photos`** to identify them from filenames, copy them into the app’s static assets, and update the photo catalog the app reads at runtime.

Wikimedia defaults stay as fallback until a local match exists.

## Naming (preferred)

Use the **aircraft id** from `src/content/aircraft.json` as the start of the filename:

| Filename | Result |
|----------|--------|
| `b737.jpg` | Spot photo for Boeing 737 |
| `b737_01.jpg` / `b737_02.webp` | Extra spot angles (first becomes primary) |
| `b737__737-800_01.jpg` | Spot for variant `737-800` |
| `b737__737 MAX 8.jpg` | Spot for `737 MAX 8` |
| `a320_diagram.png` | Profile diagram for A320 family |
| `f35__F-35B.jpg` | F-35B spot photo |

Separators `_`, `-`, and spaces are all fine. Extensions: `.jpg` `.jpeg` `.png` `.webp` `.gif`.

## Folders also work

```
photos/b737/01.jpg
photos/b737/max8.jpg
photos/a320/diagram.png
```

The parent folder name is treated like an id prefix when matching.

## Fuzzy names

If you don’t use ids, the sync script still tries family / nickname / variant tokens, e.g.:

- `Boeing_737-800_side.jpg` → `b737` / `737-800`
- `Dreamliner_ramp.jpg` → `b787`
- `Warthog.jpg` → `a10`
- `Q400.jpg` → `dash8`

Ambiguous or unmatched files are listed in the catalog under `unmatched` — rename and re-run sync.

## After dropping files

```bash
npm run sync-photos
```

Then refresh the app. Local catalog photos override bundled Wikimedia URLs (admin / IndexedDB uploads still win over both).
