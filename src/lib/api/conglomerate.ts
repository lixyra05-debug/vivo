/**
 * conglomerate — résolution de la maison-mère d'une marque via Wikidata.
 *
 * Stratégie en deux temps :
 *  1. REST `wbsearchentities` pour ranker la marque (premier résultat = entité demandée).
 *  2. SPARQL VALUES single-hop sur P127 (owned by) | P749 (parent organization)
 *     puis P17 (country) → P298 (ISO 3166-1 alpha-3) sur le owner.
 *
 * Pas de récursion (Wikidata timeout en pratique). On retourne le parent IMMÉDIAT
 * + son pays — cohérent avec ce que l'utilisateur veut voir (ex: Coca-Cola → The
 * Coca-Cola Company → US, et non Berkshire Hathaway via P127 chain).
 *
 * Cache module-level :
 *  - `Map<string, ConglomerateInfo | null>` infinie en mémoire
 *  - clé = nom normalisé (lowercase + trim)
 *  - cache les résultats négatifs (`null`) pour éviter de re-spammer Wikidata
 *  - NE cache PAS les erreurs réseau (renvoie `null` mais autorise un retry au prochain appel)
 */

import { fetchWithTimeout, FetchTimeoutError } from './fetch-with-timeout';

const WIKIDATA_REST_URL = 'https://www.wikidata.org/w/api.php';
const WIKIDATA_SPARQL_URL = 'https://query.wikidata.org/sparql';
const USER_AGENT = 'Vivo/1.0 (https://vivo.lyxiria.com; tech@lyxiria.com)';
const REQUEST_TIMEOUT_MS = 5000;

export interface ConglomerateInfo {
  /** Nom du parent immédiat (ex: "The Coca-Cola Company"). */
  ownerName: string;
  /** Q-ID Wikidata du parent (ex: "Q3295867"). */
  ownerWikidataId: string;
  /** Code ISO 3166-1 alpha-3 du pays du parent (ex: "USA"), ou null si absent. */
  countryCode: string | null;
  /** Nom localisé FR du pays (ex: "États-Unis"), ou null si absent. */
  countryName: string | null;
}

const cache = new Map<string, ConglomerateInfo | null>();

/**
 * Résout la maison-mère d'une marque par son nom (string user-facing).
 * Retourne `null` si la marque n'existe pas dans Wikidata, ou n'a pas de owner,
 * ou si le réseau est indisponible.
 */
export async function getConglomerateOwner(
  brandName: string,
): Promise<ConglomerateInfo | null> {
  const key = brandName.trim().toLowerCase();
  if (key.length === 0) return null;

  if (cache.has(key)) {
    return cache.get(key) ?? null;
  }

  try {
    const brandQid = await searchBrandQid(brandName);
    if (!brandQid) {
      cache.set(key, null);
      return null;
    }

    const owner = await fetchOwnerInfo(brandQid);
    cache.set(key, owner);
    return owner;
  } catch (err) {
    // R: ne PAS cacher les erreurs réseau — on autorise un retry plus tard.
    if (err instanceof FetchTimeoutError) return null;
    return null;
  }
}

/**
 * REST wbsearchentities — retourne le Q-ID du premier résultat (le plus pertinent).
 * Documentation : https://www.wikidata.org/w/api.php?action=help&modules=wbsearchentities
 */
async function searchBrandQid(brandName: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: 'wbsearchentities',
    search: brandName,
    language: 'en',
    uselang: 'en',
    type: 'item',
    format: 'json',
    origin: '*',
    limit: '5',
  });

  const url = `${WIKIDATA_REST_URL}?${params.toString()}`;
  const res = await fetchWithTimeout(url, {
    timeoutMs: REQUEST_TIMEOUT_MS,
    retries: 0,
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!res.ok) return null;
  const data: unknown = await res.json();
  const search = (data as { search?: Array<{ id?: string }> }).search;
  if (!Array.isArray(search) || search.length === 0) return null;

  const first = search[0];
  return typeof first?.id === 'string' ? first.id : null;
}

/**
 * SPARQL — single-hop ownership lookup pour un Q-ID donné.
 *  - ?owner = P127 (owned by) | P749 (parent organization)
 *  - ?country = P17 (country) du owner
 *  - ?iso3 = P298 (ISO 3166-1 alpha-3) du country
 *  - labels FR + EN (fallback EN si FR manquant)
 */
async function fetchOwnerInfo(brandQid: string): Promise<ConglomerateInfo | null> {
  const sparql = `
    SELECT ?owner ?ownerLabel ?country ?countryLabel ?iso3 WHERE {
      VALUES ?brand { wd:${brandQid} }
      ?brand wdt:P127|wdt:P749 ?owner .
      OPTIONAL { ?owner wdt:P17 ?country . OPTIONAL { ?country wdt:P298 ?iso3 . } }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
    }
    LIMIT 1
  `.trim();

  const body = new URLSearchParams({ query: sparql, format: 'json' });
  const res = await fetchWithTimeout(WIKIDATA_SPARQL_URL, {
    method: 'POST',
    timeoutMs: REQUEST_TIMEOUT_MS,
    retries: 0,
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/sparql-results+json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) return null;
  const data: unknown = await res.json();
  const bindings = (
    data as { results?: { bindings?: Array<Record<string, { value?: string }>> } }
  ).results?.bindings;
  if (!Array.isArray(bindings) || bindings.length === 0) return null;

  const row = bindings[0];
  const ownerUri = row.owner?.value;
  const ownerName = row.ownerLabel?.value;
  if (!ownerUri || !ownerName) return null;

  const ownerWikidataId = ownerUri.split('/').pop() ?? '';
  if (!ownerWikidataId.startsWith('Q')) return null;

  const iso3Raw = row.iso3?.value;
  const countryCode = iso3Raw && /^[A-Z]{3}$/.test(iso3Raw) ? iso3Raw : null;
  const countryName = row.countryLabel?.value ?? null;

  return {
    ownerName,
    ownerWikidataId,
    countryCode,
    countryName,
  };
}

/**
 * Convertit un code pays ISO en emoji drapeau (Regional Indicator Symbols).
 *
 * Accepte ISO alpha-2 ("FR") ou alpha-3 ("FRA"). Pour alpha-3, mapping interne
 * vers alpha-2 sur les ~50 pays les plus représentés dans Wikidata sur les marques
 * agro/cosmétiques. Renvoie `''` si conversion impossible.
 */
export function countryCodeToFlag(code: string | null | undefined): string {
  if (!code) return '';
  const normalized = code.trim().toUpperCase();

  let alpha2: string | null = null;
  if (/^[A-Z]{2}$/.test(normalized)) {
    alpha2 = normalized;
  } else if (/^[A-Z]{3}$/.test(normalized)) {
    alpha2 = ISO3_TO_ISO2[normalized] ?? null;
  }

  if (!alpha2) return '';

  const A = 0x1f1e6; // Regional Indicator Symbol Letter A
  const codePoints = [
    A + (alpha2.charCodeAt(0) - 'A'.charCodeAt(0)),
    A + (alpha2.charCodeAt(1) - 'A'.charCodeAt(0)),
  ];
  return String.fromCodePoint(...codePoints);
}

/** Mapping ISO 3166-1 alpha-3 → alpha-2 pour les pays courants en agro/cosmétique. */
const ISO3_TO_ISO2: Record<string, string> = {
  FRA: 'FR',
  USA: 'US',
  GBR: 'GB',
  DEU: 'DE',
  ITA: 'IT',
  ESP: 'ES',
  PRT: 'PT',
  NLD: 'NL',
  BEL: 'BE',
  CHE: 'CH',
  AUT: 'AT',
  IRL: 'IE',
  SWE: 'SE',
  NOR: 'NO',
  DNK: 'DK',
  FIN: 'FI',
  POL: 'PL',
  CZE: 'CZ',
  GRC: 'GR',
  TUR: 'TR',
  RUS: 'RU',
  UKR: 'UA',
  CHN: 'CN',
  JPN: 'JP',
  KOR: 'KR',
  IND: 'IN',
  IDN: 'ID',
  THA: 'TH',
  VNM: 'VN',
  PHL: 'PH',
  CAN: 'CA',
  MEX: 'MX',
  BRA: 'BR',
  ARG: 'AR',
  CHL: 'CL',
  COL: 'CO',
  AUS: 'AU',
  NZL: 'NZ',
  ZAF: 'ZA',
  EGY: 'EG',
  MAR: 'MA',
  TUN: 'TN',
  DZA: 'DZ',
  NGA: 'NG',
  KEN: 'KE',
  ISR: 'IL',
  ARE: 'AE',
  SAU: 'SA',
  LBN: 'LB',
  HKG: 'HK',
  SGP: 'SG',
  TWN: 'TW',
  LUX: 'LU',
};

/**
 * Helper test-only — vide le cache du module. NE PAS appeler en production.
 * @internal
 */
export function __resetConglomerateCacheForTests(): void {
  cache.clear();
}
