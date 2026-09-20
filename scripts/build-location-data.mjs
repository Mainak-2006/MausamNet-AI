#!/usr/bin/env node
/**
 * Builds the India locations dataset used by the weather sync pipeline.
 *
 * Sources (committed under services/ml/data/):
 *  - lgd_districts.csv          official current district list (LGDirectory)
 *  - datameet_centroids.csv     2011 census district shapefile centroids
 *  - districts_geocoded_clean.json  town/district Google-geocoded coordinates
 *  - cities_latlong.csv         major cities with population + coordinates
 *
 * Output: apps/api/src/weather/data/india-locations.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'services', 'ml', 'data');
const OUT_DIR = path.join(__dirname, '..', 'apps', 'api', 'src', 'weather', 'data');
const OUT = path.join(OUT_DIR, 'india-locations.json');

const STATE_ALIASES = new Map([
  ['ANDAMAN AND NICOBAR ISLANDS', 'ANDAMAN AND NICOBAR ISLANDS'],
  ['ANDAMAN & NICOBAR ISLANDS', 'ANDAMAN AND NICOBAR ISLANDS'],
  ['ANDAMAN & NICOBAR ISLAND', 'ANDAMAN AND NICOBAR ISLANDS'],
  ['ARUNACHAL PRADESH', 'ARUNACHAL PRADESH'],
  ['ARUNANCHAL PRADESH', 'ARUNACHAL PRADESH'],
  ['CHATTISGARH', 'CHHATTISGARH'],
  ['NCT OF DELHI', 'DELHI'],
  ['DELHI', 'DELHI'],
  ['JAMMU AND KASHMIR', 'JAMMU AND KASHMIR'],
  ['JAMMU & KASHMIR', 'JAMMU AND KASHMIR'],
  ['ORISSA', 'ODISHA'],
  ['PONDICHERRY', 'PUDUCHERRY'],
  ['DADRA & NAGAR HAVELI', 'DADRA AND NAGAR HAVELI'],
  ['DADARA & NAGAR HAVELLI', 'DADRA AND NAGAR HAVELI'],
  ['THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU', 'DADRA AND NAGAR HAVELI'],
]);

// States split after the 2011 census dataset was produced.
const PARENT_STATE = new Map([
  ['TELANGANA', 'ANDHRA PRADESH'],
  ['LADAKH', 'JAMMU AND KASHMIR'],
]);

const norm = (s) =>
  (s ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
    .trim();

const IN_BOUNDS = (lat, lon) =>
  Number.isFinite(lat) && Number.isFinite(lon) && lat > 5 && lat < 40 && lon > 65 && lon < 100;

const canonicalState = (s) =>
  STATE_ALIASES.get((s ?? '').toUpperCase().trim()) ??
  (s ?? '').toUpperCase().trim();

function bigramSimilarity(a, b) {
  if (a === b) return 1;
  const grams = (s) => {
    if (s.length < 2) return [s];
    const out = [];
    for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
    return out;
  };
  const ga = grams(norm(a));
  const gb = grams(norm(b));
  if (!ga.length || !gb.length) return norm(a) === norm(b) ? 1 : 0;
  const setA = new Set(ga);
  let hits = 0;
  for (const g of gb) if (setA.has(g)) hits++;
  return (2 * hits) / (ga.length + gb.length);
}

function readCsv(file) {
  const rows = [];
  const lines = readFileSync(file, 'utf-8').trim().split(/\r?\n/);
  const header = lines[0]
    .split(',')
    .map((h) => h.replace(/^"|"$/g, '').trim());
  for (let i = 1; i < lines.length; i++) {
    const cells = [];
    let cur = '';
    let inQuotes = false;
    for (let j = 0; j < lines[i].length; j++) {
      const ch = lines[i][j];
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) {
        cells.push(cur);
        cur = '';
      } else cur += ch;
    }
    cells.push(cur);
    const row = {};
    header.forEach((h, idx) => (row[h] = (cells[idx] ?? '').trim()));
    rows.push(row);
  }
  return rows;
}

const lgd = readCsv(path.join(DATA, 'lgd_districts.csv')).map((r) => ({
  state: r['State Name'],
  name: r['District Name'],
  code: r['District Code'],
}));

const datameet = readCsv(path.join(DATA, 'datameet_centroids.csv')).map((r) => ({
  state: canonicalState(r['state']),
  name: r['district'],
  lat: Number(r['lat']),
  lon: Number(r['lon']),
  source: 'datameet',
}));

const geocoded = Object.entries(
  JSON.parse(
    readFileSync(path.join(DATA, 'districts_geocoded_clean.json'), 'utf-8'),
  ),
)
  .filter(([k]) => !k.startsWith('_'))
  .map(([k, v]) => {
    const [lat, lon] = v.GeoCode ?? [];
    return {
      state: canonicalState(v.State),
      name: k,
      lat: Number(lat),
      lon: Number(lon),
      source: 'geocoded',
    };
  })
  .filter((e) => Number.isFinite(e.lat) && Number.isFinite(e.lon));

// Renamed districts: LGD name -> legacy source name (same state).
const DISTRICT_ALIASES = new Map([
  ['ANDHRA PRADESH::SPSR NELLORE', 'Nellore'],
  ['ASSAM::KAMRUP METRO', 'Kamrup'],
  ['CHHATTISGARH::KABIRDHAM', 'Kawardha'],
  ['CHHATTISGARH::KOREA', 'Koriya'],
  ['GUJARAT::DANG', 'The Dangs'],
  ['HARYANA::GURUGRAM', 'Gurgaon'],
  ['JHARKHAND::SAHEBGANJ', 'Sahibganj'],
  ['KARNATAKA::BALLARI', 'Bellary'],
  ['KARNATAKA::BELAGAVI', 'Belgaum'],
  ['KARNATAKA::BENGALURU RURAL', 'Bangalore Rural'],
  ['KARNATAKA::BENGALURU URBAN', 'Bangalore'],
  ['KARNATAKA::CHAMARAJANAGARA', 'Chamrajnagar'],
  ['KARNATAKA::CHIKKAMAGALURU', 'Chickmagalur'],
  ['KARNATAKA::KALABURAGI', 'Gulbarga'],
  ['KARNATAKA::MYSURU', 'Mysore'],
  ['KARNATAKA::SHIVAMOGGA', 'Shimoga'],
  ['KARNATAKA::TUMAKURU', 'Tumkur'],
  ['KARNATAKA::VIJAYAPURA', 'Bijapur(KAR)'],
  ['MADHYA PRADESH::NARMADAPURAM', 'Hoshangabad'],
  ['MAHARASHTRA::RAIGAD', 'Raigarh(MH)'],
  ['PUNJAB::FEROZEPUR', 'Firozpur'],
  ['PUNJAB::SRI MUKTSAR SAHIB', 'Muktsar'],
  ['UTTAR PRADESH::AYODHYA', 'Faizabad'],
  ['UTTAR PRADESH::PRAYAGRAJ', 'Allahabad'],
  ['UTTAR PRADESH::SANT KABEER NAGAR', 'Sant Kabir Nagar'],
  ['UTTAR PRADESH::SHRAVASTI', 'Shrawasti'],
  ['WEST BENGAL::DARJEELING', 'Darjiling'],
  ['WEST BENGAL::PURULIA', 'Puruliya'],
  ['WEST BENGAL::MEDINIPUR EAST', 'East Midnapore'],
  ['WEST BENGAL::MEDINIPUR WEST', 'West Midnapore'],
  ['WEST BENGAL::PASCHIM BARDHAMAN', 'Bardhaman'],
  ['WEST BENGAL::PURBA BARDHAMAN', 'Bardhaman'],
]);

const overrides = JSON.parse(
  readFileSync(path.join(DATA, 'coordinates-override.json'), 'utf-8'),
);

const cities = readCsv(path.join(DATA, 'cities_latlong.csv'))
  .map((r) => {
    const lat = Number(r['Latitude']);
    const lon = Number(r['Longitude']);
    return {
      state: canonicalState(r['State']),
      district: r['District'],
      city: r['City'],
      population: Number(r['Population']) || 0,
      lat,
      lon,
    };
  })
  .filter((c) => c.lat !== 0 || c.lon !== 0);

// Indexes
const byStateGeo = new Map();
for (const g of [...datameet, ...geocoded]) {
  const list = byStateGeo.get(g.state) ?? [];
  list.push(g);
  byStateGeo.set(g.state, list);
}

const cityByStateName = new Map();
for (const c of cities) {
  cityByStateName.set(`${c.state}::${norm(c.city)}`, c);
  cityByStateName.set(`${c.state}::${norm(c.district)}`, c);
  cityByStateName.set(`::${norm(c.city)}`, c);
}

function searchSimilar(state, name, pool) {
  let best = null;
  let bestScore = 0;
  for (const g of pool) {
    const score = bigramSimilarity(name, g.name);
    if (score > bestScore) {
      bestScore = score;
      best = g;
    }
  }
  return bestScore >= 0.82 ? { ...best, score: bestScore } : null;
}

const districts = [];
let srcStats = { datameet: 0, geocoded: 0, city: 0, fuzzy: 0, parent: 0, none: 0 };

for (const d of lgd) {
  const state = canonicalState(d.state);
  const nm = norm(d.name);
  const stNorm = norm(state);

  let match = byStateGeo.get(state)?.find((g) => norm(g.name) === nm);

  if (!match) {
    const city = cityByStateName.get(`${state}::${nm}`);
    if (city) {
      match = { state, name: d.name, lat: city.lat, lon: city.lon, source: 'city' };
    }
  }

  if (!match && PARENT_STATE.has(state)) {
    const parent = PARENT_STATE.get(state);
    match = byStateGeo.get(parent)?.find((g) => norm(g.name) === nm);
    if (match) {
      match = { ...match, source: `parent:${parent}` };
    }
  }

  if (!match) {
    const alias = DISTRICT_ALIASES.get(`${state}::${d.name}`);
    if (alias) {
      const col = cityByStateName.get(`${state}::${norm(alias)}`);
      const geo =
        byStateGeo.get(state)?.find((g) => norm(g.name) === norm(alias)) ?? null;
      const from = col ?? geo;
      if (from) {
        const lat = from.lat ?? from.latitude;
        const lon = from.lon ?? from.longitude;
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          match = { state, name: alias, lat, lon, source: 'alias' };
        }
      }
    }
  }

  if (!match) {
    const overrideKey = `${state}::${d.name}`;
    const bounds = overrides[overrideKey];
    if (Array.isArray(bounds)) {
      match = { state, name: d.name, lat: bounds[0], lon: bounds[1], source: 'override' };
    }
  }

  if (!match) {
    const pool = (byStateGeo.get(state) ?? []).filter(
      (g) => g.name.toLowerCase() !== 'data not available',
    );
    const fuzzy = searchSimilar(state, d.name, pool);
    if (fuzzy) {
      match = { ...fuzzy, source: 'fuzzy' };
    }
  }

  if (match && !IN_BOUNDS(match.lat, match.lon)) {
    const key = `${state}::${d.name}`;
    const bounds = overrides[key];
    if (Array.isArray(bounds) && IN_BOUNDS(bounds[0], bounds[1])) {
      match = { state, name: d.name, lat: bounds[0], lon: bounds[1], source: 'override' };
    } else {
      match = null;
    }
  }

  let coord = { lat: null, lon: null };
  let source = 'none';
  if (match) {
    coord = { lat: match.lat, lon: match.lon };
    source = match.source;
    if (srcStats[source] === undefined) srcStats[source] = 0;
    srcStats[source]++;
  } else {
    srcStats.none++;
  }

  districts.push({
    id: `${stNorm}-${nm}`.replace(/[^a-z0-9-]+/g, '-'),
    name: d.name,
    state: d.state,
    latitude: coord.lat,
    longitude: coord.lon,
    coordinateSource: source,
  });
}

const majorCities = cities
  .filter((c) => c.population >= 100000)
  .map((c) => ({
    id: norm(`${c.state}-${c.city}`),
    name: c.city,
    district: c.district,
    state: c.state,
    latitude: c.lat,
    longitude: c.lon,
    population: c.population,
  }))
  .sort((a, b) => b.population - a.population);

const payload = {
  generatedAt: new Date().toISOString(),
  meta: {
    totalDistricts: districts.length,
    unresolvedDistricts: districts.filter((d) => d.latitude == null).length,
    majorCities: majorCities.length,
    sources: srcStats,
  },
  states: [...new Set(districts.map((d) => d.state))].sort(),
  districts,
  majorCities,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(payload, null, 2));
console.log(`Wrote ${OUT}`);
console.log(JSON.stringify(payload.meta, null, 2));

const unresolved = districts.filter((d) => d.latitude == null);
if (unresolved.length) {
  console.log('\nUnresolved districts:');
  for (const d of unresolved) console.log(`  ${d.state} | ${d.name}`);
}