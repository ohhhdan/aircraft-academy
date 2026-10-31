# Images drop folder

Drop Norebbo (or your own) aircraft drawings here. Run **`npm run sync-images`** to map them into the app.

## Preferred naming (matches the Google Sheet)

Each spreadsheet aircraft has an **image stem**. Name files:

```
{Sheet-Stem}__white.jpg
{Sheet-Stem}__line-drawing.jpg
{Sheet-Stem}__comparison.jpg
```

Examples (from the current pack):

| Filename | Sheet row |
|----------|-----------|
| `Comac-C909__white.jpg` | Comac C909 |
| `Comac-C909__line-drawing.jpg` | Comac C909 |
| `Airbus-A321-P2F__white.jpg` | Airbus A321(P2F) |
| `Learjet-60__line-drawing.jpg` | Learjet 60 |
| `Boeing-727-100__comparison.jpg` | Comparison graphic for that sheet type |

Full stem list: `NOREBBO_SHEET_IMAGE_MAP.csv` and `src/content/norebboCatalog.json`.

Roles:

- `__white` / `__line-drawing` / `__blueprint` → **diagram**
- `__comparison` / `__vs` → **comparison** (side-by-side variant feature)
- anything else → **spot** photo

Aircraft **id** names still work (`b737.jpg`, `c909_diagram.png`, etc.).

## After dropping files

```bash
npm run sync-images
```

Then refresh the app. Open **Index → Compare** to browse Norebbo-derived variant comparisons.
