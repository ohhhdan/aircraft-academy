/**
 * Expand aircraft.json so every website-pack type (Google Sheet) is represented
 * as a curated family (or a variant on an existing family).
 *
 * Usage: node scripts/expand-from-website-pack.mjs [/path/to/sheet.csv]
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AIRCRAFT_PATH = join(ROOT, 'src', 'content', 'aircraft.json');
const MEDIA_PATH = join(ROOT, 'src', 'content', 'aircraftMedia.json');
const sheetPath = process.argv[2] || '/tmp/aircraft-list.csv';

const PLACEHOLDER =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Boeing_737-800%2C_Ryanair_JP7363237.jpg/1280px-Boeing_737-800%2C_Ryanair_JP7363237.jpg';

const NEW = [
  {
    id: 'g550',
    family: 'Gulfstream G550',
    variants: ['G550', 'GV-SP'],
    manufacturer: 'Gulfstream',
    skycardsCategories: ['Jet', 'Business'],
    categoryGroup: 'business-jets',
    engineCount: 2,
    introYear: 2003,
    nickname: null,
    rangeNm: 6750,
    role: 'business',
    equivalents: ['g650', 'global7500'],
    businessOrLeisure: 'business',
    icaoCodes: ['GLF5'],
    keyFeatures: ['large oval windows', 'low-wing twinjet', 'T-tail', 'long-range Gulfstream fuselage'],
    geekFacts: ['ICAO type often GLF5 (shared with G500-era Gulfstreams in some systems)', 'Direct predecessor spirit to the G650'],
    diagramId: 'g550',
    callouts: [
      { id: 'c1', label: 'Oval windows', description: 'Classic Gulfstream window shape', x: 40, y: 42 },
      { id: 'c2', label: 'T-tail', description: 'High horizontal stabilizer', x: 90, y: 18 },
      { id: 'c3', label: 'Rear engines', description: 'Engines on aft fuselage', x: 72, y: 48 },
    ],
  },
  {
    id: 'short360',
    family: 'Short 360',
    variants: ['Short 360', 'SD3-60'],
    manufacturer: 'Short Brothers',
    skycardsCategories: ['Propeller', 'Turboprop'],
    categoryGroup: 'propeller',
    engineCount: 2,
    introYear: 1981,
    nickname: null,
    rangeNm: 650,
    role: 'commercial',
    equivalents: ['atr42', 'beech1900'],
    icaoCodes: ['SH36'],
    keyFeatures: ['boxy high-wing turboprop', 'square-ish fuselage cross-section', 'twin engines', 'fixed gear on many'],
    geekFacts: ['Stretched development of the Short 330', 'ICAO type SH36'],
    diagramId: 'short360',
    callouts: [
      { id: 'c1', label: 'High wing', description: 'Wing above cabin', x: 48, y: 28 },
      { id: 'c2', label: 'Boxy fuselage', description: 'Distinct rectangular section', x: 50, y: 48 },
      { id: 'c3', label: 'Twin props', description: 'Turboprops on wing', x: 35, y: 40 },
    ],
  },
  {
    id: 'dc3',
    family: 'Douglas DC-3',
    variants: ['DC-3', 'C-47'],
    manufacturer: 'Douglas',
    skycardsCategories: ['Propeller', 'Piston'],
    categoryGroup: 'propeller',
    engineCount: 2,
    introYear: 1935,
    nickname: 'Dakota',
    rangeNm: 1500,
    role: 'commercial',
    equivalents: ['dc4'],
    icaoCodes: ['DC3'],
    keyFeatures: ['tailwheel classic', 'radial twin engines', 'low wing', 'iconic 1930s airliner shape'],
    geekFacts: ['One of the most important aircraft in aviation history', 'Military C-47 / civilian DC-3'],
    diagramId: 'dc3',
    callouts: [
      { id: 'c1', label: 'Tailwheel', description: 'Conventional gear', x: 88, y: 58 },
      { id: 'c2', label: 'Radial engines', description: 'Twin radial nacelles', x: 35, y: 48 },
      { id: 'c3', label: 'Low wing', description: 'Wing through lower fuselage', x: 50, y: 52 },
    ],
  },
  {
    id: 'a300',
    family: 'Airbus A300',
    variants: ['A300B4', 'A300-600', 'A300-600F'],
    manufacturer: 'Airbus',
    skycardsCategories: ['Airliner', 'Twin Jet', 'Airbus'],
    categoryGroup: 'commercial-jets',
    engineCount: 2,
    introYear: 1974,
    nickname: null,
    rangeNm: 4000,
    role: 'commercial',
    equivalents: ['b767', 'a310'],
    icaoCodes: ['A306', 'A30B'],
    keyFeatures: ['first Airbus widebody', 'underwing twin engines', 'A300 nose family', 'freighter conversions common'],
    geekFacts: ['First Airbus airliner', 'Parent of the A310 and A330 families structurally'],
    diagramId: 'a300',
    callouts: [
      { id: 'c1', label: 'Widebody twin', description: 'Two underwing engines on a widebody', x: 38, y: 58 },
      { id: 'c2', label: 'Airbus nose', description: 'Early Airbus cockpit profile', x: 8, y: 38 },
      { id: 'c3', label: 'Fuselage length', description: 'Shorter than later A330s', x: 55, y: 44 },
    ],
  },
  {
    id: 'jetstream41',
    family: 'BAe Jetstream 41',
    variants: ['Jetstream 41'],
    manufacturer: 'British Aerospace',
    skycardsCategories: ['Propeller', 'Turboprop'],
    categoryGroup: 'propeller',
    engineCount: 2,
    introYear: 1992,
    nickname: null,
    rangeNm: 700,
    role: 'commercial',
    equivalents: ['atr42', 'beech1900'],
    icaoCodes: ['JS41'],
    keyFeatures: ['low-wing twin turboprop', 'T-tail', 'stretched Jetstream fuselage', 'regional feeder'],
    geekFacts: ['Stretched Jetstream 31 family', 'ICAO type JS41'],
    diagramId: 'jetstream41',
    callouts: [
      { id: 'c1', label: 'T-tail', description: 'High stabilizer', x: 90, y: 16 },
      { id: 'c2', label: 'Low wing', description: 'Wing low on fuselage', x: 48, y: 52 },
      { id: 'c3', label: 'Twin props', description: 'Turboprops on wing', x: 32, y: 48 },
    ],
  },
  {
    id: 'c17',
    family: 'Boeing C-17 Globemaster III',
    variants: ['C-17A'],
    manufacturer: 'Boeing',
    skycardsCategories: ['Military', 'Transport'],
    categoryGroup: 'military',
    engineCount: 4,
    introYear: 1991,
    nickname: 'Globemaster',
    rangeNm: 2400,
    role: 'military',
    equivalents: ['c130'],
    icaoCodes: ['C17'],
    keyFeatures: ['high-wing strategic airlifter', 'four underwing engines', 'upswept rear cargo ramp', 'T-tail'],
    geekFacts: ['Primary USAF strategic/tactical airlifter', 'ICAO type C17'],
    diagramId: 'c17',
    callouts: [
      { id: 'c1', label: 'High wing', description: 'Wing above fuselage', x: 48, y: 28 },
      { id: 'c2', label: 'Four engines', description: 'Four underwing turbofans', x: 35, y: 48 },
      { id: 'c3', label: 'Cargo ramp', description: 'Rear loading ramp', x: 88, y: 55 },
    ],
  },
  {
    id: 'dc8',
    family: 'Douglas DC-8',
    variants: ['DC-8-53', 'DC-8-61', 'DC-8-73', 'DC-8-73CF'],
    manufacturer: 'Douglas',
    skycardsCategories: ['Airliner', 'Four Jet'],
    categoryGroup: 'commercial-jets',
    engineCount: 4,
    introYear: 1958,
    nickname: null,
    rangeNm: 5000,
    role: 'commercial',
    equivalents: ['b707'],
    icaoCodes: ['DC85', 'DC86', 'DC87'],
    keyFeatures: ['four underwing engines', 'narrowbody long fuselage', 'classic jetliner nose', 'freighter conversions'],
    geekFacts: ['Douglas answer to the 707', 'Many still fly as freighters'],
    diagramId: 'dc8',
    callouts: [
      { id: 'c1', label: 'Four engines', description: 'Four underwing pods', x: 35, y: 56 },
      { id: 'c2', label: 'Long tube', description: 'Stretched freighter fuselages', x: 55, y: 44 },
      { id: 'c3', label: 'Douglas nose', description: 'Distinct DC-8 cockpit profile', x: 8, y: 38 },
    ],
  },
  {
    id: 'concorde',
    family: 'Aérospatiale-BAC Concorde',
    variants: ['Concorde'],
    manufacturer: 'Aérospatiale / BAC',
    skycardsCategories: ['Airliner', 'Supersonic'],
    categoryGroup: 'commercial-jets',
    engineCount: 4,
    introYear: 1969,
    nickname: null,
    rangeNm: 3900,
    role: 'commercial',
    equivalents: ['a380'],
    icaoCodes: ['CONC'],
    keyFeatures: ['ogee delta wing', 'droop nose', 'four rear-ish underwing engines', 'supersonic slender fuselage'],
    geekFacts: ['Only successful SST in airline service with Tu-144', 'Mach 2 cruise'],
    diagramId: 'concorde',
    callouts: [
      { id: 'c1', label: 'Delta wing', description: 'Ogee delta planform', x: 55, y: 55 },
      { id: 'c2', label: 'Droop nose', description: 'Visor nose for landing', x: 6, y: 42 },
      { id: 'c3', label: 'Engine nacelles', description: 'Paired underwing engines', x: 60, y: 62 },
    ],
  },
  {
    id: 'dc4',
    family: 'Douglas DC-4',
    variants: ['DC-4', 'C-54'],
    manufacturer: 'Douglas',
    skycardsCategories: ['Propeller', 'Piston'],
    categoryGroup: 'propeller',
    engineCount: 4,
    introYear: 1942,
    nickname: null,
    rangeNm: 2500,
    role: 'commercial',
    equivalents: ['dc3'],
    icaoCodes: ['DC4'],
    keyFeatures: ['four radial engines', 'tricycle gear', 'low-wing piston airliner', 'WWII C-54 heritage'],
    geekFacts: ['Military C-54 Skymaster', 'Predecessor path to the DC-6/DC-7'],
    diagramId: 'dc4',
    callouts: [
      { id: 'c1', label: 'Four radials', description: 'Four piston engines', x: 35, y: 50 },
      { id: 'c2', label: 'Tricycle gear', description: 'Nosewheel layout', x: 20, y: 62 },
      { id: 'c3', label: 'Low wing', description: 'Wing through lower fuselage', x: 50, y: 52 },
    ],
  },
  {
    id: 'tu204',
    family: 'Tupolev Tu-204',
    variants: ['Tu-204-100', 'Tu-214'],
    manufacturer: 'Tupolev',
    skycardsCategories: ['Airliner', 'Twin Jet'],
    categoryGroup: 'commercial-jets',
    engineCount: 2,
    introYear: 1989,
    nickname: null,
    rangeNm: 3700,
    role: 'commercial',
    equivalents: ['b757', 'a321'],
    icaoCodes: ['T204'],
    keyFeatures: ['underwing twin engines', '757-class narrowbody', 'Russian cockpit windows', 'medium-haul airliner'],
    geekFacts: ['Russian counterpart class to the 757', 'ICAO type T204'],
    diagramId: 'tu204',
    callouts: [
      { id: 'c1', label: 'Underwing engines', description: 'Twin turbofans', x: 38, y: 58 },
      { id: 'c2', label: 'Long fuselage', description: '757-like proportions', x: 55, y: 44 },
      { id: 'c3', label: 'Nose', description: 'Tupolev cockpit profile', x: 8, y: 38 },
    ],
  },
  {
    id: 'mc21',
    family: 'Irkut MC-21',
    variants: ['MC-21-200', 'MC-21-300'],
    manufacturer: 'Irkut / Yakovlev',
    skycardsCategories: ['Airliner', 'Twin Jet'],
    categoryGroup: 'commercial-jets',
    engineCount: 2,
    introYear: 2017,
    nickname: null,
    rangeNm: 3400,
    role: 'commercial',
    equivalents: ['a320', 'b737', 'c919'],
    icaoCodes: ['MC21'],
    keyFeatures: ['composite wing narrowbody', 'underwing twin engines', 'tall landing gear', 'wide single-aisle cabin'],
    geekFacts: ['Russian next-gen single aisle', 'Competes with A320neo / 737 MAX / C919'],
    diagramId: 'mc21',
    callouts: [
      { id: 'c1', label: 'Tall gear', description: 'High landing gear for large fans', x: 42, y: 70 },
      { id: 'c2', label: 'Underwing engines', description: 'High-bypass nacelles', x: 38, y: 58 },
      { id: 'c3', label: 'Narrowbody', description: 'A320-class length', x: 55, y: 44 },
    ],
  },
  {
    id: 'b707',
    family: 'Boeing 707',
    variants: ['707-320B', '707-320C'],
    manufacturer: 'Boeing',
    skycardsCategories: ['Airliner', 'Four Jet'],
    categoryGroup: 'commercial-jets',
    engineCount: 4,
    introYear: 1958,
    nickname: null,
    rangeNm: 5000,
    role: 'commercial',
    equivalents: ['dc8'],
    icaoCodes: ['B703'],
    keyFeatures: ['four underwing engines', 'classic Boeing jetliner nose', 'narrowbody pioneer', 'freighter/combi variants'],
    geekFacts: ['Aircraft that launched the jet age for Boeing', 'ICAO type B703'],
    diagramId: 'b707',
    callouts: [
      { id: 'c1', label: 'Four engines', description: 'Four underwing pods', x: 35, y: 56 },
      { id: 'c2', label: 'Boeing nose', description: 'Classic 707 cockpit', x: 8, y: 38 },
      { id: 'c3', label: 'Wing sweep', description: '35° swept wing', x: 55, y: 48 },
    ],
  },
  {
    id: 'tu154',
    family: 'Tupolev Tu-154',
    variants: ['Tu-154B', 'Tu-154M'],
    manufacturer: 'Tupolev',
    skycardsCategories: ['Airliner', 'Tri Jet'],
    categoryGroup: 'commercial-jets',
    engineCount: 3,
    introYear: 1968,
    nickname: null,
    rangeNm: 2800,
    role: 'commercial',
    equivalents: ['b727'],
    icaoCodes: ['T154'],
    keyFeatures: ['tri-jet with rear engines', 'T-tail', 'clean wing', 'Soviet medium-haul workhorse'],
    geekFacts: ['Soviet counterpart role to the 727', 'ICAO type T154'],
    diagramId: 'tu154',
    callouts: [
      { id: 'c1', label: 'Tri-jet', description: 'Three rear engines', x: 80, y: 48 },
      { id: 'c2', label: 'T-tail', description: 'High stabilizer', x: 90, y: 16 },
      { id: 'c3', label: 'Clean wing', description: 'No underwing engines', x: 45, y: 50 },
    ],
  },
  {
    id: 'dornier328jet',
    family: 'Fairchild Dornier 328JET',
    variants: ['328JET'],
    manufacturer: 'Fairchild Dornier',
    skycardsCategories: ['Airliner', 'Twin Jet', 'Regional'],
    categoryGroup: 'commercial-jets',
    engineCount: 2,
    introYear: 1999,
    nickname: null,
    rangeNm: 1200,
    role: 'commercial',
    equivalents: ['erj145', 'dornier328'],
    icaoCodes: ['J328'],
    keyFeatures: ['jet version of Do 328', 'underwing twin engines', 'high wing', 'T-tail regional'],
    geekFacts: ['Jet derivative of the turboprop 328', 'ICAO type J328'],
    diagramId: 'dornier328jet',
    callouts: [
      { id: 'c1', label: 'High wing', description: 'Wing above cabin', x: 48, y: 28 },
      { id: 'c2', label: 'Underwing jets', description: 'Twin turbofans', x: 38, y: 52 },
      { id: 'c3', label: 'T-tail', description: 'High stabilizer', x: 90, y: 16 },
    ],
  },
  {
    id: 'dornier328',
    family: 'Dornier 328',
    variants: ['328-110', 'Do 328'],
    manufacturer: 'Dornier',
    skycardsCategories: ['Propeller', 'Turboprop'],
    categoryGroup: 'propeller',
    engineCount: 2,
    introYear: 1991,
    nickname: null,
    rangeNm: 1000,
    role: 'commercial',
    equivalents: ['atr42', 'dornier328jet'],
    icaoCodes: ['D328'],
    keyFeatures: ['high-wing twin turboprop', 'T-tail', 'slim fuselage', 'regional feeder'],
    geekFacts: ['Parent of the 328JET', 'ICAO type D328'],
    diagramId: 'dornier328',
    callouts: [
      { id: 'c1', label: 'High wing', description: 'Wing above cabin', x: 48, y: 28 },
      { id: 'c2', label: 'Twin props', description: 'Turboprops on wing', x: 35, y: 40 },
      { id: 'c3', label: 'T-tail', description: 'High stabilizer', x: 90, y: 16 },
    ],
  },
  {
    id: 'saab340',
    family: 'Saab 340',
    variants: ['Saab 340A', 'Saab 340B'],
    manufacturer: 'Saab',
    skycardsCategories: ['Propeller', 'Turboprop'],
    categoryGroup: 'propeller',
    engineCount: 2,
    introYear: 1983,
    nickname: null,
    rangeNm: 800,
    role: 'commercial',
    equivalents: ['atr42', 'emb120'],
    icaoCodes: ['SF34'],
    keyFeatures: ['low-wing twin turboprop', 'T-tail', 'Swedish regional', 'active noise control cabin on later'],
    geekFacts: ['Very successful regional turboprop', 'ICAO type SF34'],
    diagramId: 'saab340',
    callouts: [
      { id: 'c1', label: 'T-tail', description: 'High stabilizer', x: 90, y: 16 },
      { id: 'c2', label: 'Low wing', description: 'Wing low on fuselage', x: 48, y: 52 },
      { id: 'c3', label: 'Twin props', description: 'Turboprops', x: 32, y: 48 },
    ],
  },
  {
    id: 'dc10',
    family: 'McDonnell Douglas DC-10',
    variants: ['DC-10-30', 'DC-10-30F', 'MD-10'],
    manufacturer: 'McDonnell Douglas',
    skycardsCategories: ['Airliner', 'Tri Jet'],
    categoryGroup: 'commercial-jets',
    engineCount: 3,
    introYear: 1970,
    nickname: null,
    rangeNm: 5200,
    role: 'commercial',
    equivalents: ['md11', 'l1011'],
    icaoCodes: ['DC10'],
    keyFeatures: ['tri-jet widebody', 'center engine in tail', 'underwing outboards', 'freighter conversions (MD-10)'],
    geekFacts: ['Parent of the MD-11', 'Many fly on as freighters'],
    diagramId: 'dc10',
    callouts: [
      { id: 'c1', label: 'Center engine', description: 'Tail-mounted third engine', x: 88, y: 40 },
      { id: 'c2', label: 'Underwing twins', description: 'Outboard engines', x: 35, y: 56 },
      { id: 'c3', label: 'Widebody', description: 'Wide fuselage', x: 50, y: 44 },
    ],
  },
  {
    id: 'c208',
    family: 'Cessna 208 Caravan',
    variants: ['208', '208B Grand Caravan'],
    manufacturer: 'Cessna',
    skycardsCategories: ['Propeller', 'Turboprop'],
    categoryGroup: 'propeller',
    engineCount: 1,
    introYear: 1984,
    nickname: 'Caravan',
    rangeNm: 1000,
    role: 'general',
    equivalents: ['pc12'],
    businessOrLeisure: 'both',
    icaoCodes: ['C208'],
    keyFeatures: ['single turboprop', 'high wing', 'fixed gear', 'utility / cargo / skydive workhorse'],
    geekFacts: ['One of the most common utility turboprops', 'ICAO type C208'],
    diagramId: 'c208',
    callouts: [
      { id: 'c1', label: 'High wing', description: 'Wing above cabin', x: 48, y: 28 },
      { id: 'c2', label: 'Single prop', description: 'Nose turboprop', x: 8, y: 42 },
      { id: 'c3', label: 'Fixed gear', description: 'Non-retractable gear', x: 40, y: 68 },
    ],
  },
  {
    id: 'a310',
    family: 'Airbus A310',
    variants: ['A310-200', 'A310-300'],
    manufacturer: 'Airbus',
    skycardsCategories: ['Airliner', 'Twin Jet', 'Airbus'],
    categoryGroup: 'commercial-jets',
    engineCount: 2,
    introYear: 1982,
    nickname: null,
    rangeNm: 5150,
    role: 'commercial',
    equivalents: ['b767', 'a300'],
    icaoCodes: ['A310'],
    keyFeatures: ['shortened A300 widebody', 'underwing twin engines', 'two-crew cockpit', 'freighter conversions'],
    geekFacts: ['First Airbus with a two-crew glass cockpit lineage', 'ICAO type A310'],
    diagramId: 'a310',
    callouts: [
      { id: 'c1', label: 'Shorter widebody', description: 'Truncated vs A300', x: 55, y: 44 },
      { id: 'c2', label: 'Underwing engines', description: 'Twin turbofans', x: 38, y: 58 },
      { id: 'c3', label: 'Airbus nose', description: 'A300-family cockpit', x: 8, y: 38 },
    ],
  },
  {
    id: 'l1011',
    family: 'Lockheed L-1011 TriStar',
    variants: ['L-1011-1', 'L-1011-500'],
    manufacturer: 'Lockheed',
    skycardsCategories: ['Airliner', 'Tri Jet'],
    categoryGroup: 'commercial-jets',
    engineCount: 3,
    introYear: 1970,
    nickname: 'TriStar',
    rangeNm: 4900,
    role: 'commercial',
    equivalents: ['dc10', 'md11'],
    icaoCodes: ['L101'],
    keyFeatures: ['tri-jet widebody', 'S-duct center engine', 'underwing outboards', 'autoland pioneer'],
    geekFacts: ['Direct rival to the DC-10', 'ICAO type L101'],
    diagramId: 'l1011',
    callouts: [
      { id: 'c1', label: 'S-duct', description: 'Center engine intake above fuselage', x: 82, y: 30 },
      { id: 'c2', label: 'Underwing engines', description: 'Outboard twins', x: 35, y: 56 },
      { id: 'c3', label: 'Widebody', description: 'Wide fuselage', x: 50, y: 44 },
    ],
  },
  {
    id: 'emb120',
    family: 'Embraer EMB 120 Brasilia',
    variants: ['EMB-120'],
    manufacturer: 'Embraer',
    skycardsCategories: ['Propeller', 'Turboprop'],
    categoryGroup: 'propeller',
    engineCount: 2,
    introYear: 1983,
    nickname: 'Brasilia',
    rangeNm: 900,
    role: 'commercial',
    equivalents: ['atr42', 'saab340'],
    icaoCodes: ['E120'],
    keyFeatures: ['low-wing twin turboprop', 'T-tail', 'Brazilian regional', 'predecessor spirit to ERJ/E-Jet era'],
    geekFacts: ['Embraer’s breakthrough regional turboprop', 'ICAO type E120'],
    diagramId: 'emb120',
    callouts: [
      { id: 'c1', label: 'T-tail', description: 'High stabilizer', x: 90, y: 16 },
      { id: 'c2', label: 'Twin props', description: 'Turboprops on wing', x: 32, y: 48 },
      { id: 'c3', label: 'Low wing', description: 'Wing low on fuselage', x: 48, y: 52 },
    ],
  },
  {
    id: 'learjet60',
    family: 'Learjet 60',
    variants: ['Learjet 60', 'Learjet 60XR'],
    manufacturer: 'Learjet',
    skycardsCategories: ['Jet', 'Business'],
    categoryGroup: 'business-jets',
    engineCount: 2,
    introYear: 1991,
    nickname: null,
    rangeNm: 2400,
    role: 'business',
    equivalents: ['learjet75', 'citationx'],
    businessOrLeisure: 'business',
    icaoCodes: ['LJ60'],
    keyFeatures: ['rear twin engines', 'T-tail', 'pointed Learjet nose', 'midsize business jet'],
    geekFacts: ['Stretched Learjet 55 development', 'ICAO type LJ60'],
    diagramId: 'learjet60',
    callouts: [
      { id: 'c1', label: 'Rear engines', description: 'Aft twin engines', x: 74, y: 48 },
      { id: 'c2', label: 'T-tail', description: 'High stabilizer', x: 90, y: 16 },
      { id: 'c3', label: 'Learjet nose', description: 'Pointed cockpit profile', x: 8, y: 40 },
    ],
  },
  {
    id: 'falcon50',
    family: 'Dassault Falcon 50',
    variants: ['Falcon 50', 'Falcon 50EX'],
    manufacturer: 'Dassault',
    skycardsCategories: ['Jet', 'Business'],
    categoryGroup: 'business-jets',
    engineCount: 3,
    introYear: 1976,
    nickname: null,
    rangeNm: 3000,
    role: 'business',
    equivalents: ['falcon7x'],
    businessOrLeisure: 'business',
    icaoCodes: ['FA50'],
    keyFeatures: ['trijet business jet', 'S-duct center engine', 'swept wing', 'Dassault Falcon family'],
    geekFacts: ['First Falcon trijet', 'ICAO type FA50'],
    diagramId: 'falcon50',
    callouts: [
      { id: 'c1', label: 'Trijet', description: 'Three engines with S-duct', x: 82, y: 42 },
      { id: 'c2', label: 'Swept wing', description: 'Falcon wing planform', x: 50, y: 52 },
      { id: 'c3', label: 'Nose', description: 'Dassault cockpit shape', x: 8, y: 40 },
    ],
  },
  {
    id: 'beech1900',
    family: 'Beechcraft 1900',
    variants: ['1900C', '1900D'],
    manufacturer: 'Beechcraft',
    skycardsCategories: ['Propeller', 'Turboprop'],
    categoryGroup: 'propeller',
    engineCount: 2,
    introYear: 1982,
    nickname: null,
    rangeNm: 1500,
    role: 'commercial',
    equivalents: ['kingair', 'atr42'],
    icaoCodes: ['B190'],
    keyFeatures: ['low-wing twin turboprop', 'T-tail', '1900D has taller cabin', 'regional / cargo feeder'],
    geekFacts: ['King Air family relative', 'ICAO type B190'],
    diagramId: 'beech1900',
    callouts: [
      { id: 'c1', label: 'T-tail', description: 'High stabilizer', x: 90, y: 16 },
      { id: 'c2', label: 'Twin props', description: 'Turboprops', x: 32, y: 48 },
      { id: 'c3', label: 'Cabin height', description: '1900D stand-up cabin', x: 50, y: 40 },
    ],
  },
];

/** Extra variants to merge onto existing families from the sheet */
const VARIANT_UPDATES = {
  a321: ['A321', 'A321neo', 'A321neo LR', 'A321P2F'],
  a350: ['A350-800', 'A350-900', 'A350-1000', 'A350F'],
  a320: ['A318', 'A319', 'A319neo', 'A320', 'A320neo'],
  b737: [
    '737-100', '737-200', '737-300', '737-400', '737-500', '737-600', '737-700', '737-800', '737-800BCF',
    '737-900', '737-900ER', '737 MAX 7', '737 MAX 8', '737 MAX 9', '737 MAX 10',
  ],
  b747: ['747-100', '747-200', '747-300', '747-400', '747-400F', '747SP', '747-8i', '747-8F'],
  b777: ['777-200', '777-300', '777F', '777-8', '777-9'],
  b787: ['787-8', '787-9', '787-10'],
  a330: ['A330-200', 'A330-200F', 'A330-300', 'A330-800', 'A330-900'],
  a340: ['A340-200', 'A340-300', 'A340-500', 'A340-600'],
  b757: ['757-200', '757-200F', '757-300'],
  b767: ['767-200', '767-300', '767-300F', '767-400'],
  b727: ['727-100', '727-200'],
  md80: ['DC-9-30', 'DC-9-40', 'DC-9-50', 'MD-82', 'MD-83', 'MD-87', 'MD-88', 'MD-90'],
  md11: ['MD-11', 'MD-11F'],
  e190: ['E175', 'E190', 'E195', 'E175-E2', 'E190-E2', 'E195-E2'],
  erj145: ['ERJ-135', 'ERJ-140', 'ERJ-145', 'ERJ-145XR', 'ERJ-175'],
  crj: ['CRJ-200', 'CRJ-700', 'CRJ-900', 'CRJ-1000'],
  a220: ['A220-100', 'A220-300', 'CS100', 'CS300'],
  dash8: ['Q200', 'Q300', 'Q400'],
  global7500: ['Global 5000', 'Global 7500'],
  learjet75: ['Learjet 45', 'Learjet 75'],
  g650: ['G650', 'G650ER'],
  falcon7x: ['Falcon 7X', 'Falcon 8X'],
  fokker100: ['Fokker 70', 'Fokker 100'],
  bae146: ['BAe 146-200', 'Avro RJ85'],
  atr42: ['ATR 42'],
  atr72: ['ATR 72'],
  c909: ['C909', 'ARJ21-700'],
  c919: ['C919'],
  ssj100: ['SSJ100'],
  b717: ['717-200'],
  citationx: ['Citation X'],
  kingair: ['King Air 200', 'King Air 350'],
};

function stubPhoto(family) {
  return {
    url: PLACEHOLDER,
    attribution: 'Placeholder — replace with website pack drawing',
    variant: family,
  };
}

function main() {
  const sheet = readFileSync(sheetPath, 'utf8')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/^aircraft name$/i.test(s));

  const aircraft = JSON.parse(readFileSync(AIRCRAFT_PATH, 'utf8'));
  const media = JSON.parse(readFileSync(MEDIA_PATH, 'utf8'));
  const existing = new Set(aircraft.map((a) => a.id));

  let added = 0;
  for (const entry of NEW) {
    if (existing.has(entry.id)) {
      console.log('skip', entry.id);
      continue;
    }
    const photo = stubPhoto(entry.variants[0]);
    aircraft.push({
      ...entry,
      photos: [photo],
      needsUserPhotos: true,
      spotterLocations: ['Website pack drawing'],
    });
    media[entry.id] = {
      spotPhoto: {
        url: photo.url,
        attribution: photo.attribution,
        variant: photo.variant,
      },
    };
    added++;
    console.log('+', entry.id, '—', entry.family);
  }

  // Merge variants
  for (const ac of aircraft) {
    const extras = VARIANT_UPDATES[ac.id];
    if (!extras) continue;
    const set = new Set(ac.variants);
    for (const v of extras) set.add(v);
    ac.variants = [...set];
  }

  writeFileSync(AIRCRAFT_PATH, JSON.stringify(aircraft, null, 2) + '\n');
  writeFileSync(MEDIA_PATH, JSON.stringify(media, null, 2) + '\n');

  // Report: app types still without website coverage
  const skipConcepts = [/707\s*max/i, /797\s*concept/i];
  const sheetJoined = sheet.filter((r) => !skipConcepts.some((re) => re.test(r)));

  function coveredByApp(row) {
    for (const ac of aircraft) {
      const hay = `${ac.family} ${ac.variants.join(' ')} ${ac.id} ${(ac.icaoCodes || []).join(' ')} ${ac.nickname || ''}`.toLowerCase();
      const n = row.toLowerCase();
      // token overlap heuristics
      if (ac.id === 'c909' && /c909|arj21/i.test(row)) return ac;
      if (ac.id === 'a321' && /a321|p2f/i.test(row)) return ac;
      if (ac.id === 'a350' && /a350/i.test(row)) return ac;
      if (ac.id === 'b737' && /737/i.test(row)) return ac;
      if (ac.id === 'b747' && /747/i.test(row)) return ac;
      if (ac.id === 'b777' && /777/i.test(row)) return ac;
      if (ac.id === 'b787' && /787/i.test(row)) return ac;
      if (ac.id === 'b757' && /757/i.test(row)) return ac;
      if (ac.id === 'b767' && /767/i.test(row)) return ac;
      if (ac.id === 'b727' && /727/i.test(row)) return ac;
      if (ac.id === 'b717' && /717/i.test(row)) return ac;
      if (ac.id === 'b707' && /707/i.test(row) && !/max/i.test(row)) return ac;
      if (ac.id === 'a320' && /\ba318\b|\ba319\b|\ba320\b/i.test(row)) return ac;
      if (ac.id === 'a220' && /a220|cs100|cs300/i.test(row)) return ac;
      if (ac.id === 'a330' && /a330/i.test(row)) return ac;
      if (ac.id === 'a340' && /a340/i.test(row)) return ac;
      if (ac.id === 'a380' && /a380/i.test(row)) return ac;
      if (ac.id === 'a300' && /a300/i.test(row)) return ac;
      if (ac.id === 'a310' && /a310/i.test(row)) return ac;
      if (ac.id === 'md11' && /md-?11/i.test(row)) return ac;
      if (ac.id === 'md80' && /md-?(80|81|82|83|87|88|90)|dc-?9/i.test(row)) return ac;
      if (ac.id === 'dc10' && /dc-?10|md-?10/i.test(row)) return ac;
      if (ac.id === 'dc8' && /dc-?8/i.test(row)) return ac;
      if (ac.id === 'dc3' && /dc-?3/i.test(row)) return ac;
      if (ac.id === 'dc4' && /dc-?4/i.test(row)) return ac;
      if (ac.id === 'erj145' && /erj/i.test(row)) return ac;
      if (ac.id === 'e190' && /e1[579]|embraer\s*190|embraer\s*e/i.test(row) && !/erj|emb.?120|brasilia/i.test(row)) return ac;
      if (ac.id === 'crj' && /crj|canadair\s*regional/i.test(row)) return ac;
      if (ac.id === 'atr42' && /atr\s*42/i.test(row)) return ac;
      if (ac.id === 'atr72' && /atr\s*72/i.test(row)) return ac;
      if (ac.id === 'dash8' && /dash\s*8|dhc-?8|q400/i.test(row)) return ac;
      if (ac.id === 'c909' && /c909|arj/i.test(row)) return ac;
      if (ac.id === 'c919' && /c919/i.test(row)) return ac;
      if (ac.id === 'ssj100' && /ssj|superjet/i.test(row)) return ac;
      if (ac.id === 'g550' && /g550|gv-?sp/i.test(row)) return ac;
      if (ac.id === 'g650' && /g650|g-?vi/i.test(row)) return ac;
      if (ac.id === 'global7500' && /global\s*(5000|7500)/i.test(row)) return ac;
      if (ac.id === 'learjet60' && /learjet\s*60/i.test(row)) return ac;
      if (ac.id === 'learjet75' && /learjet\s*(45|75)/i.test(row)) return ac;
      if (ac.id === 'falcon50' && /falcon\s*50/i.test(row)) return ac;
      if (ac.id === 'citationx' && /citation\s*x/i.test(row)) return ac;
      if (ac.id === 'beech1900' && /1900/i.test(row)) return ac;
      if (ac.id === 'kingair' && /king\s*air|b200/i.test(row)) return ac;
      if (ac.id === 'c17' && /c-?17|globemaster/i.test(row)) return ac;
      if (ac.id === 'concorde' && /concorde/i.test(row)) return ac;
      if (ac.id === 'mc21' && /mc-?21/i.test(row)) return ac;
      if (ac.id === 'tu204' && /tu-?204/i.test(row)) return ac;
      if (ac.id === 'tu154' && /tu-?154/i.test(row)) return ac;
      if (ac.id === 'l1011' && /l-?1011/i.test(row)) return ac;
      if (ac.id === 'saab340' && /saab\s*340/i.test(row)) return ac;
      if (ac.id === 'dornier328jet' && /328jet|328\s*jet/i.test(row)) return ac;
      if (ac.id === 'dornier328' && /dornier\s*328|328-110/i.test(row)) return ac;
      if (ac.id === 'short360' && /short\s*360/i.test(row)) return ac;
      if (ac.id === 'jetstream41' && /jetstream/i.test(row)) return ac;
      if (ac.id === 'c208' && /caravan|208/i.test(row)) return ac;
      if (ac.id === 'emb120' && /emb.?120|brasilia/i.test(row)) return ac;
      if (ac.id === 'bae146' && /bae\s*146|avro\s*rj/i.test(row)) return ac;
      if (ac.id === 'fokker100' && /fokker/i.test(row)) return ac;
      if (ac.id === 'b717' && /717/i.test(row)) return ac;
    }
    return null;
  }

  const uncoveredSheet = sheetJoined.filter((r) => !coveredByApp(r));
  const appNoWebsite = aircraft.filter((ac) => !sheetJoined.some((r) => coveredByApp(r)?.id === ac.id));

  const report = {
    aircraftCount: aircraft.length,
    added,
    uncoveredSheet,
    appNoWebsite: appNoWebsite.map((a) => a.family),
    skippedConcepts: sheet.filter((r) => skipConcepts.some((re) => re.test(r))),
  };
  writeFileSync(join(ROOT, 'scripts', 'website-pack-report.json'), JSON.stringify(report, null, 2) + '\n');

  // CSV section for spreadsheet bottom
  const bottom = [
    '',
    '--- SHOULD BE IN APP BUT NO WEBSITE IMAGES YET ---',
    'Aircraft Name',
    ...report.appNoWebsite,
    '',
    '--- SKIPPED (concept / not real production types) ---',
    ...report.skippedConcepts,
  ].join('\n');
  writeFileSync(join(ROOT, 'SHEET_APPEND_NO_IMAGES.txt'), bottom + '\n');

  console.log('\nAircraft now:', aircraft.length, `(+${added})`);
  console.log('Uncovered sheet rows:', uncoveredSheet);
  console.log('App without website images:', report.appNoWebsite.length);
  report.appNoWebsite.forEach((n) => console.log(' ·', n));
}

main();
