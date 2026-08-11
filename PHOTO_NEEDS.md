# Photo Needs — User Override Manifest

**Easiest path for your own shots:** drop files in **`photos/`**, then run **`npm run sync-photos`**. See [`photos/README.md`](./photos/README.md) and [MEDIA_GUIDE.md](./MEDIA_GUIDE.md).

These aircraft need **user-supplied photos** for reliable **hard-mode variant identification**. Wikimedia images are used for launch, but angles and lighting often make variant distinctions ambiguous.

## How to supply photos (`photos/` folder)

1. Add JPG/WebP files under `photos/` using aircraft ids when possible (`b737__737-800_01.jpg`)
2. Run `npm run sync-photos`
3. Confirm coverage in `src/content/photoCatalog.json` (`stats` + `unmatched`)

## How to supply photos (admin panel)

1. Run the app and go to **`/admin`**
2. Find the aircraft card
3. Upload a file or paste a Wikimedia URL under **Spot photo** or **Profile diagram**
4. Export your media pack when done (backup)

## How to supply photos (manual static files)

1. Prefer the `photos/` + sync pipeline above
2. Or create folder: `public/assets/aircraft/{id}/` and wire paths via sync / catalog

---

## Priority: Hard-mode variant ID

| Aircraft ID | Family | Why needed | Suggested shots |
|-------------|--------|------------|-----------------|
| `b737` | Boeing 737 | NG vs MAX: chevrons, LEAP nacelle, tail skid | 737-800 and 737 MAX 8, same angle |
| `a320` | Airbus A320 | ceo vs neo: sharklets, nacelle size | A320ceo and A320neo |
| `a321` | Airbus A321 | ceo vs neo vs LR | A321neo with sharklets |
| `b787` | Boeing 787 | -8 vs -9 vs -10 length | Side profile, same airline livery |
| `a350` | Airbus A350 | -900 vs -1000 fuselage length | Ramp shots showing length |
| `b777` | Boeing 777 | -200 vs -300ER length, GE90 size | Side profiles |
| `e190` | Embraer E-Jet | E170 vs E190 vs E195 length | Regional ramp |

## Secondary: Better identification angles

| Aircraft ID | Family | Suggested shots |
|-------------|--------|-----------------|
| `a220` | Airbus A220 | Nose and window profile |
| `b757` | Boeing 757 | Long fuselage, tall gear |
| `f35` | F-35 | A vs B vs C variants |
| `f16` | F-16 | Bubble canopy profile |
| `g650` | Gulfstream G650 | Oval windows, T-tail |
| `falcon7x` | Falcon 7X | Trijet tail S-duct |

## Currently using Wikimedia Commons

All 40 aircraft have Wikimedia URLs in `src/content/aircraft.json` with attribution. These work for **easy mode** (family identification). Override folders improve quality for portfolio presentation.

---

## Checklist

- [ ] `b737` — NG and MAX comparison photos
- [ ] `a320` — ceo and neo comparison photos
- [ ] `a321` — neo sharklet profile
- [ ] `b787` — variant length comparison
- [ ] `a350` — -900 vs -1000
- [ ] `b777` — -200 vs -300ER
- [ ] `e190` — E170 vs E190 fuselage length
