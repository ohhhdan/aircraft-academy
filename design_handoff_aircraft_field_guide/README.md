# Handoff: Spotter's Field Guide — Aircraft Identification Learning Experience

## Overview
An interactive learning module that teaches people to identify aircraft by their visual features. The framing is a naturalist's **"Spotter's Logbook"**: learners study aircraft like field specimens (photo + illustrated diagram + a numbered "how to spot it" list), then prove recall through short quizzes. Progress is tracked as **per-collection accuracy**; reach 80% on a collection to "master" it and unlock a cross-collection "Master Challenge."

This bundle covers **two fully-built modules**:
- **Module 01 — Key Features** (`Field Guide.dc.html`): identify aircraft by visual features. Documented in the bulk of this README.
- **Module 04 — Airport Codes** (`Airport Codes.dc.html`): learn three-letter IATA airport codes through a tiered "departure board." Documented in its own section near the end of this README.

The two modules are **independent screens that share one visual language and one set of design tokens** (below). They cross-link via a header link, but each owns its own router, data, quiz engine, and `localStorage` key. The remaining curriculum modules (Identify by Photo, Deep Dive) are still stubbed as "Soon" and are out of scope.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype demonstrating the intended look, content, and behavior. **They are not production code to ship directly.** The task is to **recreate this design in the target codebase's environment** (React, Vue, SwiftUI, native, etc.) using its established component library, routing, and state patterns. If no environment exists yet, pick the most appropriate framework for the project and implement there.

> Note on the prototype's authoring format: the `.dc.html` file is a single-file component ("Design Component") with an HTML-ish template and a `class Component` logic block, rendered by the bundled `support.js` runtime. Treat it as **reference only** — read it to understand layout, data, and logic, then rebuild idiomatically. Do not try to port the `support.js` runtime itself.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, copy, and interactions are all specified below and present in the prototype. Recreate the UI faithfully using the codebase's existing primitives. Exact hex values, fonts, and the full content/data model are documented here so this README is self-sufficient.

---

## Design Tokens

### Color
| Token | Hex | Use |
|---|---|---|
| `paper` | `#f4efe4` | App background |
| `surface` | `#fffdf8` | Cards, buttons (default) |
| `surface-warm` | `#fbf6ea` | Highlighted panels / mastery strip |
| `surface-hover` | `#fbf3e6` | Card hover |
| `surface-locked` | `#f4eee0` | Locked/disabled cards |
| `surface-image` | `#f1ead9` | Image-slot backing |
| `module-locked` | `#f7f2e6` | "Soon" module cards |
| `ink` | `#23201a` | Text, 1.5px keyline borders, hard shadows |
| `ink-muted` | `#6f6a5e` | Secondary text, mono labels |
| `ink-faint` | `#46413a` | Body paragraphs |
| `locked-text` | `#a59d8a` | Disabled text |
| `ochre` | `#c2772f` | Primary actions, accents, 80% mastery tick |
| `ochre-hover` | `#b06b28` | Primary button hover |
| `teal` | `#2e6f72` | Secondary labels, "compare" accents |
| `green` | `#3c7d54` | Accuracy, correct answers, mastered ★ |
| `green-bg` | `#e7f0e6` / `#eef4ec` | Correct-answer / mastered tint |
| `brick` | `#b8442f` | Incorrect answers |
| `brick-bg` | `#f6e3dd` / `#f8ece7` | Incorrect tint |
| `cream` | `#fff7ec` | Text on ochre buttons |
| `line-subtle` | `#e0d8c6` | Hairline dividers |
| `line-locked` | `#d6ccb6` | Borders on locked cards |
| `dashed-plate` | `#c9bfa6` | Dashed image-plate frame |
| `dashed-empty` | `#b9ac8f` | Dashed empty-state frame |

Dark banner (Master Challenge unlocked): background `#23201a`, text `#f4efe4`, kicker `#e0b483`, sub-text `#cfc6b4`, shadow `0 3px 0 #6f6a5e`.

### Typography
- **Display serif:** `Newsreader` (Google Fonts), weights 400/500/600; *italic* used for aircraft nicknames.
- **UI sans:** `Hanken Grotesk` (Google Fonts), weights 400/500/600/700/800. Body default.
- **Mono labels:** `JetBrains Mono` (Google Fonts), 400/500. Always UPPERCASE, letter-spacing `.08em`–`.18em`. Used for kickers, metadata, counts.

Type scale (px / weight): hero `52/600`; screen title `38–40/600`; section title `26–34/600`; card title `19–22/600`; quiz prompt `28/600`; body `14–17/400`; mono labels `9–11/500`. Use `text-wrap: balance` on big headings, `text-wrap: pretty` on body.

### Shape, Shadow, Spacing
- **Border:** `1.5px solid #23201a` keyline on nearly every surface. Dashed variants for image plates and empty states.
- **Radius:** cards `13–16px`; buttons/pills `10–12px`; chips & badges `18–20px`; circular number badges `50%`.
- **Signature shadow (tactile press):** `box-shadow: 0 3px 0 #23201a;` at rest. On `:active`, `transform: translateY(2px); box-shadow: 0 1px 0 #23201a;`. Smaller chrome uses `0 2px 0`. This hard-offset shadow is core to the look — no blur.
- **Layout:** centered column, `max-width: 1040px`, padding `28px 20px 90px`. Responsive via `flex-wrap` and `grid-template-columns: repeat(auto-fill/auto-fit, minmax(...))`. Fully responsive down to mobile (single column).

---

## Screens / Views

The app is a single-page flow with an in-app router (current screen + history stack for Back). A sticky top bar is always present: left = logo (→ home), right = **Index** button (hidden during a quiz) and **Quit** button (only during a quiz). There is **no global/cumulative score** anywhere.

1. **Home** — Hero ("Learn to read the sky.") with primary *Start spotting* (→ Categories) and *Open the index* (→ Reference); a specimen image-slot (747); a **"Collections Mastered X / N"** strip with a progress bar and *reset progress*; and the 4-module curriculum grid (only Module 01 active).

2. **Categories** — "Choose a collection." A **Master Challenge** banner (locked dashed state, or unlocked dark state with *Quiz all mastered*), then a responsive grid of the 26 SkyCards collections. Each active card shows: name, card count, accuracy ("not started" / "NN% accuracy"), and a green **★** when mastered. Collections with no aircraft render as muted "Soon" cards.

3. **Collection hub** — Header = collection name. An **accuracy panel**: big accuracy %, a mastery progress bar with an ochre tick at 80% labeled "MASTER 80%", attempts text, a to-go message, and the **"Quiz this collection"** primary button. Below: "Or study by engine count" → three cards (Single / Twin / 3+ Engine) with live counts; empty branches render muted with an explanatory note.

4. **Browse** — "{Collection} · {Engine group}." Responsive grid of aircraft cards (silhouette image-slot + name + year + maker + one-line tell → Learn). The Single-Engine jet branch is intentionally empty and shows a teaching empty-state.

5. **Learn** — Aircraft "plate." Header: name, maker · service year, italic nickname. Left column: **Plate A (photograph)** and **Plate B (diagram)** image-slots. Right column: **"How to spot it"** — 4 numbered features (ochre circle badge + label + blurb), a "one-line tell" callout (teal left-rule), and actions *Quiz this aircraft* + *Full entry* (→ Detail).

6. **Quiz** — Progress bar + "n / total" + scope label ("{COLLECTION} COLLECTION" or "MASTER CHALLENGE"). A kicker, a serif prompt, an optional photo slot, then either: (a) a vertical list of choice buttons, or (b) a hotspot image with 3 tappable dashed rings. After answering: options recolor (correct → green ✓, chosen-wrong → brick ✗, others dimmed), and a feedback banner appears with *Next →* / *See results →*.

7. **Result** — Scope kicker, "NN% this round", an encouraging line, a **mastery-status banner** (e.g. "★ Boeing mastered — now in the Master Challenge!"), a stat row (Correct / Questions / collection accuracy), and CTAs back to Collections or Index.

8. **Reference (Index)** — Available anytime **except mid-quiz**. Search affordance, filter chips (All / Jet / Propeller / Oldies / Airbus / Boeing), and a grid of every aircraft (thumb + name + maker · year · nickname → Detail).

9. **Detail** — Full encyclopedia entry: name + nickname + maker; hero photo slot; spec grid (Service Entry, Range, Seats, Rival, Engines); "How to spot it" features; illustrated diagram slot; one-line tell; and "Appears in collections" tag chips.

---

## Interactions & Behavior
- **Routing:** `screen` state + a `history` array. Back pops history; the logo resets to home and clears history.
- **Tactile press:** every interactive surface uses the `translateY(2px)` + reduced hard-shadow active state. Primary buttons also darken on hover.
- **Quiz scoring:** answering is locked after the first selection. Each answer writes to the active scope's stats and to the session counters. Wrong answers reveal the correct option (green) and the chosen one (brick) and show "The answer is '…'." plus an explanation.
- **Hotspot:** only the 747 question; three positioned rings; the "hump" ring is correct. On answer, rings recolor (correct green, chosen-wrong brick, others faded).
- **Mastery unlock:** when a collection crosses the threshold, the Result banner announces it and the Master Challenge banner flips from locked → unlocked on the Categories screen.
- **Responsive:** all multi-column areas wrap to a single column on narrow viewports; grids use `auto-fill/auto-fit` minmax tracks.
- **Quiz transition:** progress-bar width animates `width .35s ease`. No other motion is required.

## State Management
Per-screen selection state: `category`, `group` (`single`|`twin`|`3plus`), `aircraftId`, `detailId`, `refFilter`.

Quiz runtime state: `quiz` (generated question array), `quizScope` (collection name or `"Master"`), `qIdx`, `answered`, `chosenIdx`, `isCorrect`, `sessionCorrect`, `sessionTotal`.

**Persistent progress** (the only thing stored): `stats`, an object keyed by scope → `{ correct, total }`. Persisted to `localStorage` under key **`fg.stats.v2`**. `Master` is a reserved scope key. Reset writes `{}`.

**Mastery rule:** a collection is *mastered* when `total >= 5` **and** `correct/total >= 0.80`. (`MIN_ATTEMPTS = 5`, threshold `0.8`.) The Master Challenge is unlocked when ≥1 collection is mastered; its question pool is the union of aircraft across all mastered collections.

### Question generator (recreate this logic)
Questions are generated from the aircraft data, not hardcoded. Types:
- **feature** ("What identifies this as the {name}?") — correct = one of the aircraft's feature labels; distractors = feature labels from *other* aircraft. Shows the aircraft photo.
- **name** ("Which aircraft fits this description? '{tell}'") — correct = name; distractors = other names.
- **year** ("When did the {name} enter service?") — correct = year; distractors = other years.
- **engines** ("How many engines does the {name} have?") — options 1–4.
- **comparative** ("The {name} has {N} engines. Which of these shares that?") — correct = another aircraft in the same engine group; distractors = aircraft in different groups. (Skipped if no same-group partner exists.)
- **hotspot** — special-cased to the 747 (tap the hump).

Generators: **per-aircraft quiz** = feature + engines + year + name (+ comparative, + hotspot for 747), shuffled, capped at 6. **Collection / Master quiz** = sample of the above across the whole pool, capped at `min(8, max(5, poolSize+3))`. Options are shuffled; the correct flag travels with each option.

---

## Data Model (the full content — port verbatim)
Each aircraft: `{ id, name, maker, group, year, range, engines, seats, rival, nickname, tags[], tells, features[ {label, blurb} ×4 ] }`. `group ∈ {single, twin, tri, quad}`. `tags` drive collection membership (a collection "contains" an aircraft if its name is in `tags`; `Anything Goes` matches all). The complete array (11 aircraft: 737-800, A320neo, 777-300ER, A350-900, 747-400, A380-800, 727-200, Concorde, C172, ATR 72) lives in `Field Guide.dc.html` → `buildAircraft()`. **Copy that array as the seed dataset.**

The 26 SkyCards collections: Anything Goes, Light/Medium/Heavy Weight, Uncommon, Scarce, Rare, Jet, Twin Jet, 4+ Engine, Glider, Propeller, Piston, Taildragger, Airliner, Single Seat, Wide Wings, Military, Helicopter, Slow, Fast, Oldies, 21st Century, Airbus, Boeing, Cessna. Only collections that match ≥1 aircraft are active; the rest render as "Soon."

## Assets
- **Imagery is user-supplied via drag-and-drop "image slots"** (`image-slot.js`). Every photo/diagram is a placeholder the user fills by dropping an image; the file persists to a sidecar JSON. **No images ship in this bundle.** In the target codebase, replace these with your normal image pipeline (upload component or static assets). Each aircraft reuses one canonical photo id `ac-<id>` across browse/learn/quiz/reference, plus a separate diagram id `dia-<id>`.
- **Fonts:** Newsreader, Hanken Grotesk, JetBrains Mono (Google Fonts) — swap for the codebase's equivalents if it has a type system.
- **No SVG/illustration assets** are included; diagrams are also user-dropped images.
- **Icons:** only Unicode glyphs are used (✈ ✦ ★ 🔒 ✓ ✗ ⌕). Replace with the codebase's icon set.

---

# Module 04 — Airport Codes (`Airport Codes.dc.html`)

## Overview
A tiered drill for learning three-letter **IATA airport codes**. Framing is a **departure board**: learners pick an "altitude" (difficulty level), study flashcard "baggage tags," then quiz to build per-level accuracy. Clearing a level (reach the mastery target, default 80%, with ≥5 attempts) unlocks the cross-level **Full Board** gauntlet. This module is structurally a sibling of Module 01 — same tokens, same tactile-shadow language, same per-scope accuracy model — but its accent leans **teal** (`#2e6f72`) as the primary action color rather than ochre, and it adds a **type-the-code** answer mode and **flip-card** study UI that Module 01 doesn't have.

Header differs: left logo is a teal **IATA** chip → home; right side shows **Levels** (hidden mid-quiz), **Quit** (only mid-quiz), and a persistent **↩ FIELD GUIDE** link back to `Field Guide.dc.html`.

## Tweakable props (`data-props`)
The component reads three props (exposed as host Tweaks; provide equivalents as config/constants in production):
- `quizLength` (int, default **8**, range 4–12) — questions per quiz.
- `typeToRecall` (boolean, default **true**) — when on, the generator also emits free-type "type the code" questions; when off, all questions are multiple-choice.
- `masteryTarget` (int, default **80**, range 50–100, step 5) — the % needed to clear a level. Drives the ochre tick on progress bars and all "clear NN%" copy.

## Screens / Views
1. **Home** — Hero ("Three letters. One city.") with primary teal *Board now →* (starts the Easy quiz directly); a decorative **baggage-tag** card (dashed-top tag showing a teaser code/city); a **"Levels Cleared X / N"** strip with progress bar + *reset progress*; a **Full Board** banner (locked dashed state, or unlocked dark state with *Run the full board →*); and a 3-card **level grid** (each card: name, blurb, 3 sample code chips, code count, accuracy, green ★ CLEARED when mastered; left border tinted to the level accent).
2. **Level hub** — Back link, level tag ("GROUND LEVEL" / "CRUISING" / "HIGH ALTITUDE"), name, blurb. An **accuracy panel** (big %, mastery bar with ochre tick at the target, attempts text, to-go message). Two big action cards: **Quiz this level →** (teal) and **Flip the cards →** (study).
3. **Study (flashcards)** — Responsive grid of flip cards. Front = the 3-letter code + "TAP TO REVEAL"; back (teal) = city, airport name · country, and a one-line memory "story." A *reveal all / flip all back* toggle flips every card at once.
4. **Quiz** — Progress bar + "n / total" + scope label ("{LEVEL} LEVEL" or "FULL BOARD CHALLENGE"). Kicker, serif prompt, an optional dark **board display** (big amber code on near-black, for code→city / place-it questions), then either multiple-choice option buttons **or** a centered 3-char **type input** with a *Check code →* button. After answering: options recolor (correct→green ✓, chosen-wrong→brick ✗, others dimmed) and a feedback banner shows *Next →* / *See results →*.
5. **Result** — Scope kicker, "NN% this round", encouraging line, a mastery-status banner (e.g. "★ Easy cleared — now in the Full Board!"), a Correct / Questions / level-accuracy stat row, and CTAs *Back to levels* / *Run it again*.

## Data Model (port verbatim — lives in `buildLevels()`)
Three levels, **11 airports each (33 total)**. Each airport: `{ code, city, name, country, story }` where `story` is a one-line mnemonic/fact. Levels:
- **Easy** (accent `#3c7d54` green) — world's busiest hubs: ATL, JFK, LHR, CDG, DXB, HND, SIN, FRA, AMS, HKG, LAX.
- **Intermediate** (accent `#c2772f` ochre) — mid-size cities & gateways: PDX, NCE, AUS, BCN, DUB, HEL, MSY, YVR, LIS, PRG, SAN.
- **Difficult** (accent `#b8442f` brick) — regional fields: CID, GRZ, BZN, EUG, BOI, LBB, INV, TRD, PIA, SBA, BRN.

The full array (with each airport's `name`, `country`, and `story`) is in `Airport Codes.dc.html → buildLevels()`. **Copy it verbatim as the seed dataset.**

## State & Persistence
Router: `screen` (`home`/`level`/`study`/`quiz`/`result`) + `history` stack; `goBack` pops, logo resets. Selection: `level`. Study: `flipped` (map of code→true). Quiz runtime: `quiz`, `quizScope` (level key or `"Full Board"`), `qIdx`, `answered`, `chosenIdx`, `isCorrect`, `typed`, `sessionCorrect`, `sessionTotal`.

**Persistent progress:** `stats`, keyed by scope → `{correct,total}`, in `localStorage` under key **`fg.airports.v1`** (distinct from Module 01's `fg.stats.v2`). `Full Board` is a reserved scope key. **Mastery rule:** a level is cleared when `total >= 5` **and** `correct/total >= masteryTarget/100`. Full Board unlocks when ≥1 level is cleared; its pool is the union of airports across cleared levels.

### Question generator (recreate this logic — in `genPool()`)
For each airport in the pool, generate up to four question objects, then shuffle and cap at `quizLength`:
- **code2city** ("Which city does this code serve?") — shows the dark board with the code; distractors = other cities.
- **city2code** ("What's the IATA code for {city}?") — mono-styled options; distractors = other codes.
- **country** ("In which country will you find {code} ({city})?") — shows the board; distractors = other countries.
- **type** ("Type the three-letter IATA code for {city}.") — only when `typeToRecall` is on; free 3-char uppercase input, exact-match check.
Options are built by `mkOptions(correct, distractors)` (shuffled, correct flag travels with each option). Feedback text uses each question's `explain` string (built from the airport's `name`/`city`/`country`/`story`).

## Module-04 notes vs Module 01
- **No image slots** — this module uses zero imagery; the baggage tag, board, and cards are pure CSS. `image-slot.js` is not used here.
- **Primary color is teal** (`#2e6f72`, hover `#285f62`) instead of ochre; otherwise the token palette is shared.
- Adds a **flip animation** keyframe `fgflip` (defined but the live cards swap via conditional render, not the keyframe — safe to ignore or implement as a CSS flip in production).
- Adds a **text input** answer path (uppercase, `maxLength=3`, Enter submits) not present in Module 01.

---

## Files (in this bundle)
- `Field Guide.dc.html` — Module 01 hifi prototype (template + `Component` logic + full aircraft data + question generator). **Primary reference for Module 01.**
- `Airport Codes.dc.html` — Module 04 hifi prototype (template + `Component` logic + full airport data + question generator). **Primary reference for Module 04.**
- `image-slot.js` — the drag-and-drop image placeholder component used by Module 01 (reference for the fill/persist behavior; replace in production). Not used by Module 04.
- `support.js` — the runtime that renders the `.dc.html` files. **Reference only — do not port.** Lets you open the prototypes locally to see them run.
- `Wireframes.dc.html` — earlier low-fi structural exploration of all 4 modules (optional context).

To run a prototype locally: serve this folder and open `Field Guide.dc.html` or `Airport Codes.dc.html` (each loads `support.js` from the same directory; Module 01 also loads `image-slot.js`).
