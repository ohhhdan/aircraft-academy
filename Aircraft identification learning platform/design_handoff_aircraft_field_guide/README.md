# Handoff: Spotter's Field Guide — Aircraft Identification Learning Experience

## Overview
An interactive learning module that teaches people to identify aircraft by their visual features. The framing is a naturalist's **"Spotter's Logbook"**: learners study aircraft like field specimens (photo + illustrated diagram + a numbered "how to spot it" list), then prove recall through short quizzes. Progress is tracked as **per-collection accuracy**; reach 80% on a collection to "master" it and unlock a cross-collection "Master Challenge."

This bundle covers **Module 01 — Key Features**. Three further modules (Identify by Photo, Deep Dive, Airport Codes) are stubbed as "Soon" on the home screen and are out of scope for this handoff.

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

## Files (in this bundle)
- `Field Guide.dc.html` — the hifi prototype (template + `Component` logic + full data + question generator). **Primary reference.**
- `image-slot.js` — the drag-and-drop image placeholder component used by the prototype (reference for the fill/persist behavior; replace in production).
- `support.js` — the runtime that renders the `.dc.html`. **Reference only — do not port.** Lets you open the prototype locally to see it run.
- `Wireframes.dc.html` — earlier low-fi structural exploration of all 4 modules (optional context).

To run the prototype locally: serve this folder and open `Field Guide.dc.html` (it loads `support.js` and `image-slot.js` from the same directory).
