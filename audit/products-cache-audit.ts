/**
 * AUDIT DU CACHE `products` — lot C. Lecture seule, à lancer à la main.
 *
 * N'écrit RIEN en base. Lit les fiches en cache par l'API publique (clé
 * publique de l'app : la lecture de `products` est ouverte à tous), relit
 * chaque code-barres sur Open Food Facts à 12 requêtes par minute au plus
 * (OFF : 15 par minute et par adresse IP), et écrit un rapport JSON local.
 * Les verdicts viennent de `auditCachedRow` (src/lib/api/cache-audit.ts).
 *
 * Exécution (Deno, depuis la racine du dépôt) :
 *
 *   SUPABASE_URL=… SUPABASE_ANON_KEY=… AUDIT_LIMIT=200 AUDIT_OUT=/tmp/audit-cache.json \
 *   deno run --allow-env=SUPABASE_URL,SUPABASE_ANON_KEY,AUDIT_LIMIT,AUDIT_OUT \
 *     --allow-net=fr.openfoodfacts.org,<ref-du-projet>.supabase.co --allow-write=/tmp \
 *     audit/products-cache-audit.ts
 *
 * La clé n'est jamais affichée. Les fiches les plus récemment écrites passent
 * d'abord : ce sont celles que les clients servent encore. Exclu du tsconfig de
 * l'app (globals Deno) ; vérifié par `deno check`.
 */
import { auditCachedRow, type AuditOffProduct, type AuditResult, type AuditVerdict } from '../src/lib/api/cache-audit.ts';
import { SERVER_CLOCK_SKEW_MS, isValidBarcode } from '../src/lib/api/cache-refresh-rules.ts';
import type { Product } from '../src/lib/api/types.ts';

const USER_AGENT = 'Vivo/1.0 (contact@lyxiria.com)';
/** 12 lectures par minute, sous la limite d'OFF. */
const OFF_PAUSE_MS = 5000;
const PAGE_SIZE = 500;

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Variable ${name} manquante.`);
  return value;
}

/** Une clé héritée est un JWT et voyage aussi en `Bearer` ; une nouvelle clé, jamais. */
function keyHeaders(key: string): Record<string, string> {
  return key.startsWith('eyJ') ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function readCachedRows(url: string, key: string, limit: number): Promise<Product[]> {
  const rows: Product[] = [];
  for (let offset = 0; rows.length < limit; offset += PAGE_SIZE) {
    const size = Math.min(PAGE_SIZE, limit - rows.length);
    const res = await fetch(`${url}/rest/v1/products?select=*&order=updated_at.desc&limit=${size}&offset=${offset}`, {
      headers: keyHeaders(key),
    });
    if (!res.ok) throw new Error(`Lecture du cache refusée (HTTP ${res.status}).`);
    const page = (await res.json()) as Product[];
    rows.push(...page);
    if (page.length < size) break;
  }
  return rows;
}

/** La fiche OFF, `null` si OFF ne la connaît pas. Une seule nouvelle tentative si OFF sature. */
async function readOff(barcode: string): Promise<AuditOffProduct | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = await fetch(`https://fr.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (res.status === 404) return null;
    if (res.status === 429 || res.status === 503) {
      await sleep(60_000);
      continue;
    }
    if (!res.ok) throw new Error(`OFF : HTTP ${res.status}.`);
    const data = (await res.json()) as { status?: unknown; product?: AuditOffProduct };
    return data.status === 1 && data.product ? data.product : null;
  }
  throw new Error('OFF reste saturé : audit interrompu.');
}

const url = requiredEnv('SUPABASE_URL');
const key = requiredEnv('SUPABASE_ANON_KEY');
const limit = Number(Deno.env.get('AUDIT_LIMIT') ?? '200');
// Exigé dès le départ : un rapport impossible à écrire ne doit pas se découvrir après tout le parcours.
const out = requiredEnv('AUDIT_OUT');

const rows = await readCachedRows(url, key, limit);
const results: AuditResult[] = [];
for (const [index, row] of rows.entries()) {
  // Ni date forgée ni code mal formé ne coûtent une lecture d'OFF.
  const future = Date.parse(row.updated_at ?? '') > Date.now() + SERVER_CLOCK_SKEW_MS;
  const askOff = !future && isValidBarcode(row.barcode);
  const off = askOff ? await readOff(row.barcode) : null;
  results.push(auditCachedRow(row, off, Date.now()));
  // Chaque lecture d'OFF compte, qu'elle trouve la fiche ou non.
  if (askOff && index < rows.length - 1) await sleep(OFF_PAUSE_MS);
}

const counts: Record<AuditVerdict, number> = {
  conforme: 0,
  date_future: 0,
  code_hors_format: 0,
  absente_off: 0,
  ecart_sensible: 0,
  off_a_change: 0,
  ecart_inexplique: 0,
};
const SUSPECT: ReadonlySet<AuditVerdict> = new Set<AuditVerdict>([
  'date_future',
  'code_hors_format',
  'absente_off',
  'ecart_sensible',
  'ecart_inexplique',
]);
for (const result of results) counts[result.verdict] += 1;

await Deno.writeTextFile(
  out,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      rows_read: rows.length,
      counts,
      // À examiner : tout sauf « conforme » et « off_a_change ».
      suspects: results.filter((r) => SUSPECT.has(r.verdict)),
      results,
    },
    null,
    2,
  ),
);
console.log(`${rows.length} fiches lues · ${JSON.stringify(counts)} · rapport : ${out}`);
