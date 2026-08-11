/**
 * Merge additional high-value spotting families into aircraft.json + aircraftMedia.json.
 * Idempotent — skips ids that already exist.
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AIRCRAFT_PATH = join(ROOT, 'src', 'content', 'aircraft.json');
const MEDIA_PATH = join(ROOT, 'src', 'content', 'aircraftMedia.json');

const NEW_AIRCRAFT = [
  {
    id: 'c909',
    family: 'COMAC C909',
    variants: ['C909', 'ARJ21-700', 'ARJ21-900'],
    manufacturer: 'COMAC',
    skycardsCategories: ['Airliner', 'Twin Jet', 'Regional'],
    categoryGroup: 'commercial-jets',
    engineCount: 2,
    introYear: 2015,
    nickname: 'ARJ21',
    rangeNm: 2000,
    role: 'commercial',
    equivalents: ['e190', 'crj'],
    icaoCodes: ['AJ27', 'C909'],
    keyFeatures: [
      'rear-mounted twin engines',
      'T-tail regional jet silhouette',
      'COMAC wing with moderate sweep',
      'four-abreast cabin like CRJ/E-Jet class',
    ],
    geekFacts: [
      'Formerly marketed as the ARJ21 Xiangfeng; rebranded C909',
      'ICAO type designator AJ27 — often labeled C909 on flight trackers',
    ],
    diagramId: 'c909',
    callouts: [
      { id: 'c1', label: 'Rear engines', description: 'Engines on aft fuselage, not under wing', x: 72, y: 48 },
      { id: 'c2', label: 'T-tail', description: 'High horizontal stabilizer', x: 90, y: 16 },
      { id: 'c3', label: 'Regional fuselage', description: 'Shorter narrowbody vs A320/737', x: 45, y: 44 },
    ],
    photos: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/COMAC_ARJ21_%284339941455%29.jpg/1280px-COMAC_ARJ21_%284339941455%29.jpg',
        attribution: 'Wikimedia Commons / Kentaro Iemoto',
        variant: 'C909',
      },
    ],
    needsUserPhotos: true,
    spotterLocations: ['PVG ramp', 'PEK domestic', 'SHA apron'],
  },
  {
    id: 'c919',
    family: 'COMAC C919',
    variants: ['C919'],
    manufacturer: 'COMAC',
    skycardsCategories: ['Airliner', 'Twin Jet'],
    categoryGroup: 'commercial-jets',
    engineCount: 2,
    introYear: 2023,
    nickname: null,
    rangeNm: 3000,
    role: 'commercial',
    equivalents: ['a320', 'b737'],
    icaoCodes: ['C919'],
    keyFeatures: [
      'underwing twin engines (LEAP-1C)',
      'A320-class narrowbody proportions',
      'COMAC nose with distinct windshield cut',
      'wingtip fences / winglets depending on config',
    ],
    geekFacts: ['China’s first large indigenous narrowbody airliner', 'Direct competitor to A320neo and 737 MAX'],
    diagramId: 'c919',
    callouts: [
      { id: 'c1', label: 'Underwing engines', description: 'LEAP-1C nacelles under wing', x: 40, y: 58 },
      { id: 'c2', label: 'Narrowbody length', description: 'Similar size class to A320', x: 55, y: 44 },
      { id: 'c3', label: 'Nose shape', description: 'COMAC cockpit window geometry', x: 8, y: 36 },
    ],
    photos: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/B-658M_-_COMAC_Express_-_COMAC_C919_-_MSN_00017_-_VGHS.jpg/1280px-B-658M_-_COMAC_Express_-_COMAC_C919_-_MSN_00017_-_VGHS.jpg',
        attribution: 'Wikimedia Commons',
        variant: 'C919',
      },
    ],
    needsUserPhotos: true,
    spotterLocations: ['PVG', 'SHA', 'XIY'],
  },
  {
    id: 'ssj100',
    family: 'Sukhoi Superjet 100',
    variants: ['SSJ100-95B', 'SSJ100-95LR'],
    manufacturer: 'Sukhoi / Yakovlev',
    skycardsCategories: ['Airliner', 'Twin Jet', 'Regional'],
    categoryGroup: 'commercial-jets',
    engineCount: 2,
    introYear: 2011,
    nickname: 'Superjet',
    rangeNm: 2500,
    role: 'commercial',
    equivalents: ['e190', 'c909'],
    icaoCodes: ['SU95'],
    keyFeatures: [
      'underwing twin engines on a regional jet',
      'curved panoramic cockpit windshields',
      'sleek Russian regional narrowbody',
      'shorter than A320 with similar nose rake',
    ],
    geekFacts: ['ICAO type SU95', 'One of few regional jets with underwing (not rear) engines'],
    diagramId: 'ssj100',
    callouts: [
      { id: 'c1', label: 'Underwing engines', description: 'Unusual for regionals — usually rear-mounted', x: 38, y: 58 },
      { id: 'c2', label: 'Cockpit glass', description: 'Large curved windshield panels', x: 10, y: 34 },
      { id: 'c3', label: 'Regional length', description: 'Shorter than A320/737', x: 55, y: 44 },
    ],
    photos: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Sukhoi_Superjet_100_at_Paris_Air_Show_2013_%282%29.jpg/1280px-Sukhoi_Superjet_100_at_Paris_Air_Show_2013_%282%29.jpg',
        attribution: 'Wikimedia Commons',
        variant: 'SSJ100',
      },
    ],
    spotterLocations: ['SVO', 'LED', 'AER'],
  },
  {
    id: 'erj145',
    family: 'Embraer ERJ',
    variants: ['ERJ-135', 'ERJ-140', 'ERJ-145'],
    manufacturer: 'Embraer',
    skycardsCategories: ['Airliner', 'Twin Jet', 'Regional'],
    categoryGroup: 'commercial-jets',
    engineCount: 2,
    introYear: 1996,
    nickname: null,
    rangeNm: 1550,
    role: 'commercial',
    equivalents: ['crj'],
    icaoCodes: ['E135', 'E145'],
    keyFeatures: ['rear-mounted engines', 'T-tail', 'long thin fuselage', 'small regional jet'],
    geekFacts: ['Predecessor family to the E-Jets', 'Very common at US regional airlines historically'],
    diagramId: 'erj145',
    callouts: [
      { id: 'c1', label: 'Rear engines', description: 'Aft-fuselage engines', x: 74, y: 48 },
      { id: 'c2', label: 'T-tail', description: 'High stabilizer', x: 90, y: 16 },
      { id: 'c3', label: 'Slim tube', description: 'Narrower than E-Jets', x: 48, y: 44 },
    ],
    photos: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/KLM_Cityhopper_Embraer_190-100STD_PH-EZW.jpg/1280px-KLM_Cityhopper_Embraer_190-100STD_PH-EZW.jpg',
        attribution: 'Wikimedia Commons (placeholder — replace with ERJ ramp shot)',
        variant: 'ERJ-145',
      },
    ],
    needsUserPhotos: true,
    spotterLocations: ['DFW regional', 'ORD regional'],
  },
  {
    id: 'atr42',
    family: 'ATR 42',
    variants: ['ATR 42-300', 'ATR 42-500', 'ATR 42-600'],
    manufacturer: 'ATR',
    skycardsCategories: ['Airliner', 'Propeller', 'Turboprop'],
    categoryGroup: 'propeller',
    engineCount: 2,
    introYear: 1985,
    nickname: null,
    rangeNm: 700,
    role: 'commercial',
    equivalents: ['atr72', 'dash8'],
    icaoCodes: ['AT43', 'AT45', 'AT46'],
    keyFeatures: ['high-wing twin turboprop', 'shorter than ATR 72', 'T-tail', 'landing gear pods on fuselage'],
    geekFacts: ['Shorter sibling of the ATR 72', 'ICAO codes AT43/AT45/AT46 by variant'],
    diagramId: 'atr42',
    callouts: [
      { id: 'c1', label: 'High wing', description: 'Wing above cabin', x: 48, y: 28 },
      { id: 'c2', label: 'Twin props', description: 'Turboprops on wing', x: 35, y: 40 },
      { id: 'c3', label: 'Short fuselage', description: 'Shorter than ATR 72', x: 55, y: 48 },
    ],
    photos: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/ATR_42.jpg/1280px-ATR_42.jpg',
        attribution: 'Wikimedia Commons',
        variant: 'ATR 42',
      },
    ],
    spotterLocations: ['Regional islands', 'European feeder'],
  },
  {
    id: 'bae146',
    family: 'BAe 146 / Avro RJ',
    variants: ['BAe 146-100', 'BAe 146-200', 'BAe 146-300', 'Avro RJ85', 'Avro RJ100'],
    manufacturer: 'British Aerospace',
    skycardsCategories: ['Airliner', 'Regional'],
    categoryGroup: 'commercial-jets',
    engineCount: 4,
    introYear: 1983,
    nickname: 'Jumbolino',
    rangeNm: 1600,
    role: 'commercial',
    equivalents: ['crj', 'e190'],
    icaoCodes: ['B461', 'B462', 'B463', 'RJ70', 'RJ85', 'RJ1H'],
    keyFeatures: ['four small rear-ish underwing engines', 'high wing', 'T-tail', 'short-field regional jet'],
    geekFacts: ['Rare four-engine regional jet', 'Famous for steep quiet approaches into London City'],
    diagramId: 'bae146',
    callouts: [
      { id: 'c1', label: 'Four engines', description: 'Four small high-bypass engines', x: 40, y: 52 },
      { id: 'c2', label: 'High wing', description: 'Wing above fuselage', x: 50, y: 30 },
      { id: 'c3', label: 'T-tail', description: 'High stabilizer', x: 90, y: 16 },
    ],
    photos: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Fokker_100.jpg/1280px-Fokker_100.jpg',
        attribution: 'Wikimedia Commons (placeholder — replace with BAe 146 photo)',
        variant: 'Avro RJ100',
      },
    ],
    needsUserPhotos: true,
    spotterLocations: ['LCY', 'European regional'],
  },
  {
    id: 'fokker100',
    family: 'Fokker 100',
    variants: ['Fokker 70', 'Fokker 100'],
    manufacturer: 'Fokker',
    skycardsCategories: ['Airliner', 'Twin Jet', 'Regional'],
    categoryGroup: 'commercial-jets',
    engineCount: 2,
    introYear: 1988,
    nickname: null,
    rangeNm: 1700,
    role: 'commercial',
    equivalents: ['b717', 'e190'],
    icaoCodes: ['F70', 'F100'],
    keyFeatures: ['rear-mounted twin engines', 'T-tail', 'Dutch regional narrowbody', 'pointed Fokker nose'],
    geekFacts: ['Last Fokker airliner family', 'Still active with several carriers and corporates'],
    diagramId: 'fokker100',
    callouts: [
      { id: 'c1', label: 'Rear engines', description: 'Aft engines', x: 74, y: 48 },
      { id: 'c2', label: 'T-tail', description: 'High stabilizer', x: 90, y: 16 },
      { id: 'c3', label: 'Nose', description: 'Classic Fokker pointed nose', x: 8, y: 40 },
    ],
    photos: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Fokker_100.jpg/1280px-Fokker_100.jpg',
        attribution: 'Wikimedia Commons',
        variant: 'Fokker 100',
      },
    ],
    spotterLocations: ['AMS regional', 'Australian regional'],
  },
  {
    id: 'b717',
    family: 'Boeing 717',
    variants: ['717-200'],
    manufacturer: 'Boeing',
    skycardsCategories: ['Airliner', 'Twin Jet'],
    categoryGroup: 'commercial-jets',
    engineCount: 2,
    introYear: 1999,
    nickname: null,
    rangeNm: 2000,
    role: 'commercial',
    equivalents: ['fokker100', 'e190'],
    icaoCodes: ['B712'],
    keyFeatures: ['rear-mounted engines', 'MD-95 heritage nose', 'T-tail', 'short narrowbody'],
    geekFacts: ['Rebranded MD-95 after Boeing–MDC merger', 'ICAO type B712'],
    diagramId: 'b717',
    callouts: [
      { id: 'c1', label: 'Rear engines', description: 'BR715 engines aft', x: 74, y: 48 },
      { id: 'c2', label: 'T-tail', description: 'High stabilizer', x: 90, y: 16 },
      { id: 'c3', label: 'MDC nose', description: 'MD-80 family nose lineage', x: 8, y: 40 },
    ],
    photos: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Boeing_737-800%2C_Ryanair_JP7363237.jpg/1280px-Boeing_737-800%2C_Ryanair_JP7363237.jpg',
        attribution: 'Wikimedia Commons (placeholder — replace with 717 photo)',
        variant: '717-200',
      },
    ],
    needsUserPhotos: true,
    spotterLocations: ['ATL', 'Hawaiian islands'],
  },
  {
    id: 'md80',
    family: 'McDonnell Douglas MD-80',
    variants: ['MD-81', 'MD-82', 'MD-83', 'MD-87', 'MD-88', 'MD-90'],
    manufacturer: 'McDonnell Douglas',
    skycardsCategories: ['Airliner', 'Twin Jet'],
    categoryGroup: 'commercial-jets',
    engineCount: 2,
    introYear: 1980,
    nickname: 'Mad Dog',
    rangeNm: 2500,
    role: 'commercial',
    equivalents: ['b737', 'a320'],
    icaoCodes: ['MD81', 'MD82', 'MD83', 'MD87', 'MD88', 'MD90'],
    keyFeatures: ['rear-mounted engines', 'T-tail', 'long thin MD fuselage', 'stairway under tail on many'],
    geekFacts: ['Nicknamed Mad Dog', 'Stretched DC-9 family'],
    diagramId: 'md80',
    callouts: [
      { id: 'c1', label: 'Rear engines', description: 'Aft JT8D/V2500 engines', x: 74, y: 48 },
      { id: 'c2', label: 'T-tail', description: 'High stabilizer', x: 90, y: 16 },
      { id: 'c3', label: 'Long tube', description: 'Stretched DC-9 fuselage', x: 50, y: 44 },
    ],
    photos: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Boeing_757_family_v1.0.png/1280px-Boeing_757_family_v1.0.png',
        attribution: 'Placeholder — replace with MD-80 ramp photo',
        variant: 'MD-83',
      },
    ],
    needsUserPhotos: true,
    spotterLocations: ['Historic US majors', 'Cargo conversions'],
  },
];

function main() {
  const aircraft = JSON.parse(readFileSync(AIRCRAFT_PATH, 'utf8'));
  const media = JSON.parse(readFileSync(MEDIA_PATH, 'utf8'));
  const existing = new Set(aircraft.map((a) => a.id));
  let added = 0;

  // Attach icaoCodes to existing families where missing
  const existingIcao = {
    a320: ['A318', 'A319', 'A320', 'A19N', 'A20N'],
    a321: ['A321', 'A21N'],
    b737: ['B732', 'B733', 'B734', 'B735', 'B736', 'B737', 'B738', 'B739', 'B37M', 'B38M', 'B39M', 'B3XM'],
    b757: ['B752', 'B753'],
    a330: ['A332', 'A333', 'A338', 'A339'],
    b767: ['B762', 'B763', 'B764'],
    a220: ['BCS1', 'BCS3'],
    e190: ['E170', 'E75L', 'E75S', 'E190', 'E195', 'E290', 'E295'],
    b787: ['B788', 'B789', 'B78X'],
    a350: ['A359', 'A35K'],
    b777: ['B772', 'B773', 'B77L', 'B77W', 'B778', 'B779'],
    b747: ['B741', 'B742', 'B743', 'B744', 'B748'],
    a380: ['A388'],
    a340: ['A342', 'A343', 'A345', 'A346'],
    b727: ['B721', 'B722'],
    md11: ['MD11'],
    g650: ['GLF6'],
    citationx: ['C750'],
    falcon7x: ['FA7X'],
    phenom300: ['E55P'],
    c130: ['C130', 'C30J'],
    b52: ['B52'],
    kc135: ['K35R'],
    dash8: ['DH8A', 'DH8B', 'DH8C', 'DH8D'],
    atr72: ['AT72', 'AT73', 'AT75', 'AT76'],
    crj: ['CRJ1', 'CRJ2', 'CRJ7', 'CRJ9', 'CRJX'],
    pc12: ['PC12'],
    kingair: ['BE20', 'B190'],
  };

  for (const ac of aircraft) {
    if (!ac.icaoCodes && existingIcao[ac.id]) {
      ac.icaoCodes = existingIcao[ac.id];
    }
  }

  for (const entry of NEW_AIRCRAFT) {
    if (existing.has(entry.id)) {
      console.log(`skip ${entry.id} (exists)`);
      continue;
    }
    aircraft.push(entry);
    media[entry.id] = {
      spotPhoto: {
        url: entry.photos[0].url,
        attribution: entry.photos[0].attribution,
        variant: entry.photos[0].variant,
      },
    };
    added++;
    console.log(`+ ${entry.id} — ${entry.family}`);
  }

  writeFileSync(AIRCRAFT_PATH, JSON.stringify(aircraft, null, 2) + '\n');
  writeFileSync(MEDIA_PATH, JSON.stringify(media, null, 2) + '\n');
  console.log(`\nAircraft count: ${aircraft.length} (+${added} new)`);
}

main();
