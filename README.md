# Spotter's Field Guide — Aircraft Identification Learning Experience

A portfolio-grade **learning experience** for building visual aircraft literacy. Framed as a naturalist's **Spotter's Logbook**: learners study aircraft like field specimens (photograph + illustrated diagram + numbered "how to spot it" features), then practice identification across four modules.

Visual design follows the [design handoff](./design_handoff_aircraft_field_guide/README.md): paper/ochre Field Guide tokens, Newsreader + Hanken Grotesk + JetBrains Mono, tactile hard-shadow press states.

## Quick start

```bash
cd aircraft-academy
npm install
npm run dev
```

Open http://localhost:5173

Add `?demo=true` to reset progress for portfolio reviewers.

## Learning flow

1. **Observe** — browse collections and engine groups
2. **Study** — specimen plates with photo, diagram, and spotting features
3. **Practice** — module exercises (photo ID, comparisons, airport codes)
4. **Reference** — Index available anytime outside active quizzes

## Modules

| # | Module | Path | Design handoff |
|---|--------|------|----------------|
| 01 | Key Features | `/learn` | Field Guide — specimen plates, ochre accent |
| 02 | Identify by Photo | `/spotter` | Wireframes (future hifi) |
| 03 | Deep Dive | `/deepdive` | Wireframes (future hifi) |
| 04 | Airport Codes | `/codes` | Airport Codes — teal accent, departure board |

## Content

- **40 aircraft** in `src/content/aircraft.json`
- **174 airports** in `src/content/airports.json`
- **Wikimedia** spot photos and profile diagrams in `src/content/aircraftMedia.json`
- **Local photo catalog** in `src/content/photoCatalog.json` (from `images/` via `npm run sync-images`)
- **Media admin** at `/admin` for custom uploads

Drop your shots in [`images/`](./images/README.md), then:

```bash
npm run sync-images
```

See [PHOTO_NEEDS.md](./PHOTO_NEEDS.md) for aircraft needing your photo pack.

## Build for production

```bash
npm run build
```

Output: `dist/` — static files ready for S3, NAS, or iframe embed.

### Embed on portfolio site

```html
<iframe
  src="https://your-host.example/"
  title="Spotter's Field Guide — Aircraft Identification"
  style="width: 100%; min-height: 800px; border: none;"
  loading="lazy"
></iframe>
```

## Design tokens (summary)

| Token | Hex | Use |
|-------|-----|-----|
| paper | `#f4efe4` | App background |
| surface | `#fffdf8` | Cards |
| ochre | `#c2772f` | Primary actions (Module 01) |
| teal | `#2e6f72` | Secondary / Module 04 |
| ink | `#23201a` | Text, borders, shadows |

See the full token table in the design handoff README.

## Features

- Study-before-practice sequencing across modules
- 5 lives, regenerate 1 every 30 minutes
- Field journal progress strip and per-module progress bars
- Index locked during active quizzes
- localStorage persistence (no backend required)

## Tech stack

- Vite + React + TypeScript
- React Router
- Static export — no server needed

## Portfolio notes

This project demonstrates:

- **Instructional design:** study-before-practice sequencing, progressive disclosure (collection → engine group → specimen)
- **Visual design:** high-fidelity Field Guide reskin applied to a multi-module React SPA
- **Content architecture:** SkyCards categories, Wikimedia media pipeline, searchable Index
- **Assessment design:** recall checks, photo verification, comparison exercises, tiered airport drills
