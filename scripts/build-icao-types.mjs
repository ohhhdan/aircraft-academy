/**
 * Build src/content/icaoTypes.json from the Wikipedia ICAO/IATA partial list
 * plus family mappings for the Spotter Field Guide.
 *
 * Usage: node scripts/build-icao-types.mjs
 *
 * Note: FlightAware AeroAPI only supports GET /aircraft/types/{icao} (single lookup),
 * not a bulk "list all types" endpoint. This seed covers the common turbine/multi-engine
 * designators; run `npm run enrich-icao` with AEROAPI_KEY to pull manufacturer/engine
 * metadata for each code.
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { EXTRA_TYPE_ALIASES, ICAO_FAMILY_MAP } from './icao-family-map.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'content', 'icaoTypes.json');

/** Partial ICAO Doc 8643 list (multi-engine / turbine focused) — Wikipedia mirror */
const SEED = `
A124|A4F|Antonov An-124 Ruslan
A140|A40|Antonov An-140
A148|A81|Antonov An-148
A158|A58|Antonov An-158
A19N|31N|Airbus A319neo
A20N|32N|Airbus A320neo
A21N|32Q|Airbus A321neo/LR/XLR
A225|A5F|Antonov An-225 Mriya
A306|AB6|Airbus A300-600
A30B|AB4|Airbus A300B2/B4/C4
A310|312|Airbus A310
A318|318|Airbus A318
A319|319|Airbus A319
A320|320|Airbus A320
A321|321|Airbus A321
A332|332|Airbus A330-200
A333|333|Airbus A330-300
A338|338|Airbus A330-800
A339|339|Airbus A330-900
A342|342|Airbus A340-200
A343|343|Airbus A340-300
A345|345|Airbus A340-500
A346|346|Airbus A340-600
A359|359|Airbus A350-900
A35K|351|Airbus A350-1000
A388|388|Airbus A380-800
A400|AI4|Airbus A400M Atlas
AJ27|C27|Comac ARJ21-700 / C909
AN12|ANF|Antonov An-12
AN24|AN4|Antonov An-24
AN26|A26|Antonov An-26
AN72|AN7|Antonov An-72 / An-74
AT43|AT4|ATR 42-300/320
AT45|AT5|ATR 42-500
AT46|ATR|ATR 42-600
AT72|AT7|ATR 72-200
AT73|ATR|ATR 72-210
AT75|ATR|ATR 72-500
AT76|ATR|ATR 72-600
ATP|ATP|British Aerospace ATP
B190|BEH|Beechcraft 1900
B37M|7M7|Boeing 737 MAX 7
B38M|7M8|Boeing 737 MAX 8
B39M|7M9|Boeing 737 MAX 9
B3XM|7MJ|Boeing 737 MAX 10
B461|141|BAe 146-100
B462|142|BAe 146-200
B463|143|BAe 146-300
B52||Boeing B-52 Stratofortress
B703|703|Boeing 707
B712|717|Boeing 717
B721|721|Boeing 727-100
B722|722|Boeing 727-200
B732|732|Boeing 737-200
B733|733|Boeing 737-300
B734|734|Boeing 737-400
B735|735|Boeing 737-500
B736|736|Boeing 737-600
B737|73G|Boeing 737-700
B738|738|Boeing 737-800
B739|739|Boeing 737-900
B741|741|Boeing 747-100
B742|742|Boeing 747-200
B743|743|Boeing 747-300
B744|744|Boeing 747-400
B748|74H|Boeing 747-8
B752|752|Boeing 757-200
B753|753|Boeing 757-300
B762|762|Boeing 767-200
B763|763|Boeing 767-300
B764|764|Boeing 767-400ER
B772|772|Boeing 777-200
B773|773|Boeing 777-300
B77L|77L|Boeing 777-200LR/F
B77W|77W|Boeing 777-300ER
B778|778|Boeing 777-8
B779|779|Boeing 777-9
B788|788|Boeing 787-8
B789|789|Boeing 787-9
B78X|781|Boeing 787-10
BCS1|221|Airbus A220-100 / Bombardier CS100
BCS3|223|Airbus A220-300 / Bombardier CS300
BE20|B20|Beechcraft King Air 200
BE40|BE4|Hawker 400
C130|LOH|Lockheed C-130 / L-100 Hercules
C17|C17|Boeing C-17 Globemaster III
C208|C08|Cessna 208 Caravan
C30J|LOH|Lockheed Martin C-130J Hercules
C408|CS4|Cessna 408 SkyCourier
C680|CNJ|Cessna Citation Sovereign
C68A|CNJ|Cessna Citation Latitude
C700|CNJ|Cessna Citation Longitude
C750|CNJ|Cessna Citation X
C919|919|Comac C919
CL30|CL3|Bombardier Challenger 300
CL35|CL3|Bombardier Challenger 350
CL60|CCJ|Canadair Challenger 600
CRJ1|CR1|Bombardier CRJ100
CRJ2|CR2|Bombardier CRJ200
CRJ7|CR7|Bombardier CRJ700/550
CRJ9|CR9|Bombardier CRJ900
CRJX|CRK|Bombardier CRJ1000
D228|D28|Dornier 228
D328|D38|Dornier 328
DC10|D11|McDonnell Douglas DC-10
DH8A|DH1|De Havilland Dash 8-100
DH8B|DH2|De Havilland Dash 8-200
DH8C|DH3|De Havilland Dash 8-300
DH8D|DH4|De Havilland Dash 8-400 / Q400
DHC6|DHT|De Havilland DHC-6 Twin Otter
DHC7|DH7|De Havilland DHC-7 Dash 7
E110|EMB|Embraer EMB 110 Bandeirante
E120|EM2|Embraer EMB 120 Brasilia
E135|ER3|Embraer ERJ135/140
E145|ER4|Embraer ERJ145
E170|E70|Embraer E170
E190|E90|Embraer E190
E195|E95|Embraer E195
E290|290|Embraer E190-E2
E295|295|Embraer E195-E2
E75L|E7W|Embraer E175 (long wing)
E75S|E75|Embraer E175 (short wing)
E50P|EP1|Embraer Phenom 100
E55P|EP3|Embraer Phenom 300
E545|E54|Embraer Legacy 450 / Praetor 500
E550|E55|Embraer Legacy 500 / Praetor 600
F100|100|Fokker 100
F27|F27|Fokker F27 Friendship
F28|F21|Fokker F28 Fellowship
F2TH|D20|Dassault Falcon 2000
F50|F50|Fokker 50
F70|F70|Fokker 70
F900|DF9|Dassault Falcon 900
FA50|DF3|Dassault Falcon 50
FA6X|DF6|Dassault Falcon 6X
FA7X|DF7|Dassault Falcon 7X
G280|GR3|Gulfstream G280
GA7C|GL7|Gulfstream G700
GL5T|CCX|Bombardier Global 5000
GLEX|CCX|Bombardier Global Express
GLF4|GJ4|Gulfstream IV / G400
GLF5|GJ5|Gulfstream V / G500
GLF6|GJ6|Gulfstream G650
HDJT|HHJ|HondaJet HA-420
IL76|IL7|Ilyushin Il-76
IL96|I93|Ilyushin Il-96
J328|FRJ|Fairchild Dornier 328JET
JS31|J31|BAe Jetstream 31
JS41|J41|BAe Jetstream 41
K35R|K35|Boeing KC-135 Stratotanker
L101|L10|Lockheed L-1011 TriStar
L410|L4T|Let L-410 Turbolet
LJ35|LRJ|Learjet 35/36
LJ60|LRJ|Learjet 60
MD11|M11|McDonnell Douglas MD-11
MD81|M81|McDonnell Douglas MD-81
MD82|M82|McDonnell Douglas MD-82
MD83|M83|McDonnell Douglas MD-83
MD87|M87|McDonnell Douglas MD-87
MD88|M88|McDonnell Douglas MD-88
MD90|M90|McDonnell Douglas MD-90
P180|P18|Piaggio P.180 Avanti
PC12|PL2|Pilatus PC-12
PC24|PL4|Pilatus PC-24
RJ1H|AR1|Avro RJ100
RJ70|AR7|Avro RJ70
RJ85|AR8|Avro RJ85
SB20|S20|Saab 2000
SF34|SF3|Saab 340
SH36|SH6|Shorts 360
SU95|SU9|Sukhoi Superjet 100
T134|TU3|Tupolev Tu-134
T154|TU5|Tupolev Tu-154
T204|T20|Tupolev Tu-204/214
YK40|YK4|Yakovlev Yak-40
YK42|YK2|Yakovlev Yak-42
`.trim();

function aliasesFromModel(icao, iata, model) {
  const out = new Set([icao.toLowerCase()]);
  if (iata) out.add(iata.toLowerCase());
  const m = model.toLowerCase();
  out.add(m);
  // tokens
  for (const tok of m.split(/[^a-z0-9]+/i).filter((t) => t.length >= 2)) {
    out.add(tok);
  }
  // common marketing forms
  if (/c909|arj21/i.test(model)) {
    out.add('c909');
    out.add('comac 909');
    out.add('comac c909');
    out.add('arj21');
  }
  if (/c919/i.test(model)) {
    out.add('c919');
    out.add('comac 919');
  }
  if (/superjet/i.test(model)) {
    out.add('ssj100');
    out.add('superjet');
  }
  return [...out];
}

function main() {
  const types = {};

  for (const line of SEED.split('\n')) {
    const [icao, iata, model] = line.split('|');
    if (!icao || !model) continue;
    const map = ICAO_FAMILY_MAP[icao] ?? null;
    types[icao] = {
      icao,
      iata: iata ? [iata] : [],
      model,
      manufacturer: guessManufacturer(model),
      familyId: map?.familyId ?? null,
      variant: map?.variant ?? null,
      aliases: aliasesFromModel(icao, iata, model),
      aeroapi: null,
    };
  }

  // Marketing aliases that aren't official ICAO (FR24/FlightAware UI labels)
  for (const [key, meta] of Object.entries(EXTRA_TYPE_ALIASES)) {
    const upper = key.toUpperCase();
    if (!types[upper]) {
      types[upper] = {
        icao: upper,
        iata: [],
        model: meta.aliases[0],
        manufacturer: upper.startsWith('C9') ? 'COMAC' : null,
        familyId: meta.familyId,
        variant: null,
        aliases: meta.aliases,
        aeroapi: null,
        marketingAlias: true,
      };
    } else {
      types[upper].aliases = [...new Set([...(types[upper].aliases ?? []), ...meta.aliases])];
    }
  }

  // Ensure C909 marketing label maps even if seed used AJ27 only
  if (types.AJ27) {
    types.AJ27.aliases = [...new Set([...(types.AJ27.aliases ?? []), 'c909', 'comac 909', 'comac c909', 'arj21', 'arj-21'])];
  }

  const catalog = {
    version: 1,
    updatedAt: new Date().toISOString(),
    source: 'Wikipedia List of aircraft type designators (ICAO Doc 8643 partial) + family maps',
    note: 'AeroAPI has no bulk type list — enrich individual codes with npm run enrich-icao (AEROAPI_KEY).',
    count: Object.keys(types).length,
    mappedToFamily: Object.values(types).filter((t) => t.familyId).length,
    types,
  };

  writeFileSync(OUT, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`Wrote ${catalog.count} ICAO/marketing types (${catalog.mappedToFamily} mapped to families) → ${OUT}`);
}

function guessManufacturer(model) {
  const m = model.toLowerCase();
  if (m.includes('airbus') || m.includes('bombardier cseries')) return 'Airbus';
  if (m.includes('boeing')) return 'Boeing';
  if (m.includes('embraer')) return 'Embraer';
  if (m.includes('comac')) return 'COMAC';
  if (m.includes('sukhoi')) return 'Sukhoi';
  if (m.includes('atr')) return 'ATR';
  if (m.includes('bombardier') || m.includes('canadair')) return 'Bombardier';
  if (m.includes('gulfstream')) return 'Gulfstream';
  if (m.includes('dassault') || m.includes('falcon')) return 'Dassault';
  if (m.includes('cessna')) return 'Cessna';
  if (m.includes('pilatus')) return 'Pilatus';
  if (m.includes('antonov')) return 'Antonov';
  if (m.includes('fokker')) return 'Fokker';
  if (m.includes('mcdonnell') || m.includes('douglas')) return 'McDonnell Douglas';
  if (m.includes('de havilland') || m.includes('dash')) return 'De Havilland';
  if (m.includes('bae') || m.includes('avro') || m.includes('british aerospace')) return 'BAe';
  if (m.includes('lockheed')) return 'Lockheed';
  if (m.includes('beechcraft')) return 'Beechcraft';
  if (m.includes('saab')) return 'Saab';
  if (m.includes('tupolev')) return 'Tupolev';
  if (m.includes('ilyushin')) return 'Ilyushin';
  return null;
}

main();
