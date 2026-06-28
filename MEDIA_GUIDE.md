# Media Guide — Better Images for Runway Reference

The auto-generated SVG silhouettes are placeholders only. Use the **admin panel** or the instructions below to get portfolio-quality visuals.

## Admin panel (recommended)

Open **`/admin`** while running the app (e.g. `http://localhost:5173/admin`).

For each of the 40 aircraft you can set:

| Slot | Used in | What to upload |
|------|---------|----------------|
| **Spot photo** | Spotter Verification | Real ramp/airborne photo for identification |
| **Profile diagram** | Feature Academy, Airpedia | Side-view illustration with key features labeled |

**Per aircraft you can:**
- Upload a file (JPG, PNG, WebP, SVG)
- Paste an image URL (Wikimedia Commons, etc.)
- Add attribution / photo credit
- Clear and replace anytime

Images are stored in your browser (IndexedDB). Use **Export media pack** to back up as JSON, and **Import** to restore on another machine or after deploy.

Footer link: **Media admin** on the main app.

---

## How to instruct the AI for better images

### For spot photos (real aircraft)

Ask me to:

> "Find Wikimedia Commons photos for `[aircraft id]` — side or 3-quarter ramp view, min 1280px, clear livery, good for identification. Add direct `upload.wikimedia.org` URLs and attribution to `aircraft.json`, or paste them into `/admin`."

**Good sources:**
- [Wikimedia Commons](https://commons.wikimedia.org) — search `"Boeing 737" side view`
- Use the **direct image URL** (`upload.wikimedia.org/.../1280px-...jpg`), not the file page
- Prefer: consistent angle, uncluttered background, sharp focus on nose/engines/tail

**For hard-mode variants**, specify:
> "I need two photos of 737-800 and 737 MAX 8 from the same angle — emphasize chevron nacelle vs flat-bottom NG engine."

### For profile diagrams (illustrations)

Auto-SVG will never match a proper technical illustration. Ask me to:

> "Source side-profile diagram images for commercial narrowbodies — clean line art or cutaway style with visible wing, engines, tail, and nose. Prefer Wikimedia technical diagrams or FAA/airline training materials. Upload via admin or add URLs."

**What works well:**
- Side-view line drawings (like aircraft recognition cards)
- Diagrams from Wikipedia aircraft articles (often CC-licensed)
- Annotated images you've created in Figma/Illustrator (export PNG, upload in admin)

**What to specify:**
- View: **side profile** (not 3/4 unless that's all you have)
- Style: line art, flat silhouette, or labeled technical diagram
- Background: transparent or white (admin displays on dark UI)

### Example prompt for a full refresh

> "Replace all placeholder diagrams for commercial jets. For each aircraft in `commercial-jets`, find a Wikimedia side-view photo for the spot slot and a line-art profile diagram for the learn slot. Paste URLs into `/admin` via a batch JSON import, or update `aircraft.json` photos array. Flag any aircraft where you can't find a good image."

---

## Wikimedia URL tips

1. Open a Commons file page → right-click image → **Copy image address**
2. URL should look like: `https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/File.jpg/1280px-File.jpg`
3. In admin, paste into **Or paste image URL** and add attribution: `Wikimedia Commons / Photographer Name`

---

## Static deploy note

Admin uploads live in **browser storage** on the machine where you uploaded them. For production:

1. Upload all images via `/admin` locally
2. Click **Export media pack** → save JSON
3. After deploy, open live `/admin` → **Import media pack**

Or bake images into the build: put files in `public/assets/aircraft/{id}/` and I can wire `aircraft.json` `photoOverrides` for you.

---

## Priority aircraft (variant ID)

See [PHOTO_NEEDS.md](./PHOTO_NEEDS.md) for the list where your own photos matter most (737 NG/MAX, A320ceo/neo, etc.).
