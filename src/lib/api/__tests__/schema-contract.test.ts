/**
 * Contrat schéma ↔ requêtes (lot H).
 *
 * Les tests de l'app simulent Supabase : aucun ne voit une requête que la base
 * refuse. C'est ainsi que la jointure `product:products(*)` de l'historique a
 * survécu à la migration 012, qui a supprimé la clé étrangère sans laquelle
 * PostgREST ne sait pas la faire (erreur PGRST200) — l'écran affichait alors
 * « Aucun scan pour le moment ».
 *
 * Ce garde-fou relit les migrations dans l'ordre (colonnes, clés étrangères),
 * relève dans le code chaque jointure PostgREST — `alias:table(…)` dans un
 * `.select()` chaîné à `.from()` — et exige pour chacune une clé étrangère
 * entre les deux tables. Il vérifie aussi que chaque champ écrit tel quel dans
 * une table (upsert de l'objet entier, insertion d'un scan) en est une colonne.
 */
import fs from 'fs';
import path from 'path';
import { normalizeOFFProduct } from '../openfoodfacts';
import { normalizeOBFProduct } from '../openbeautyfacts';
import { buildScanInsertPayload } from '../../stores/useProductStore';

const ROOT = path.resolve(__dirname, '../../../..');
const MIGRATIONS_DIR = path.join(ROOT, 'supabase/migrations');
const SOURCE_DIRS = ['app', 'src'];

/**
 * Jointures connues sans clé étrangère. Soldée par le lot H (lecture en deux
 * temps) : la liste est vide et doit le rester — une jointure nouvelle passe
 * par une clé étrangère, ou par une lecture en deux temps.
 */
const KNOWN_BROKEN_EMBEDS: ReadonlyArray<string> = [];

// === Rejeu des migrations ===

interface ForeignKey {
  name: string;
  table: string;
  column: string;
  refTable: string;
}

interface Schema {
  columns: Map<string, Set<string>>;
  foreignKeys: Map<string, ForeignKey>;
  /** Politiques RLS par table : nom → commande (`all`, `select`, `insert`, `update`, `delete`). */
  policies: Map<string, Map<string, string>>;
  /** Triggers par table : nom → moment (`before`…) et fonction exécutée. */
  triggers: Map<string, Map<string, { timing: string; fn: string }>>;
  /** Tables où la RLS est activée. */
  rls: Set<string>;
  /** Corps des fonctions SQL (entre `$$`), en minuscules, espaces réduits. */
  functions: Map<string, string>;
  /** Droits retirés par table et par rôle (`revoke`), rendus par un `grant`. */
  revoked: Map<string, Map<string, Set<string>>>;
}

function entryOf<V>(maps: Map<string, Map<string, V>>, key: string): Map<string, V> {
  let map = maps.get(key);
  if (!map) {
    map = new Map();
    maps.set(key, map);
  }
  return map;
}

/** Retire ce qui n'est pas du DDL de tables : corps `$$`, commentaires, chaînes. */
function stripSql(sql: string): string {
  return sql
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/'(?:[^']|'')*'/g, "''");
}

/** Découpe aux virgules de premier niveau (hors parenthèses). */
function splitTopLevel(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of body) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Identifiant SQL : lettres, chiffres et soulignés (« energy_kcal_100g »). */
const ID = '[a-z_][a-z0-9_]*';
const REF = String.raw`references ((?:${ID}\.)?${ID})\s*\(`;

function refTableOf(raw: string): string {
  return raw.startsWith('public.') ? raw.slice('public.'.length) : raw;
}

function emptySchema(): Schema {
  return {
    columns: new Map(),
    foreignKeys: new Map(),
    policies: new Map(),
    triggers: new Map(),
    rls: new Set(),
    functions: new Map(),
    revoked: new Map(),
  };
}

function replayMigrations(files: readonly string[]): Schema {
  const schema = emptySchema();
  for (const file of files) replaySql(schema, fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
  return schema;
}

function replaySql(schema: Schema, source: string): void {
  const columnsOf = (table: string): Set<string> => {
    let set = schema.columns.get(table);
    if (!set) {
      set = new Set();
      schema.columns.set(table, set);
    }
    return set;
  };
  const addForeignKey = (fk: ForeignKey): void => {
    schema.foreignKeys.set(fk.name, fk);
  };

  // Les corps `$$` disparaissent avec stripSql : on garde d'abord ceux des fonctions.
  const functionBody = new RegExp(
    String.raw`create (?:or replace )?function (?:public\.)?(${ID})\s*\([^)]*\)[\s\S]*?\bas \$\$([\s\S]*?)\$\$`,
    'g',
  );
  for (const m of source.toLowerCase().matchAll(functionBody)) {
    schema.functions.set(m[1], m[2].replace(/\s+/g, ' ').trim());
  }

  const sql = stripSql(source);
  for (const rawStatement of sql.split(';')) {
    const statement = rawStatement.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!statement) continue;

    // Nom entre guillemets ou nu : une politique sans guillemets compte aussi.
    const createPolicy = new RegExp(
      String.raw`^create policy (?:"([^"]+)"|(${ID})) on (?:public\.)?(${ID})(?: as (?:permissive|restrictive))?(?: for (all|select|insert|update|delete))?`,
    ).exec(statement);
    if (createPolicy) {
      const [, quoted, bare, table, command] = createPolicy;
      entryOf(schema.policies, table).set(quoted ?? bare, command ?? 'all');
      continue;
    }
    const dropPolicy = new RegExp(String.raw`^drop policy (?:if exists )?(?:"([^"]+)"|(${ID})) on (?:public\.)?(${ID})`).exec(statement);
    if (dropPolicy) {
      schema.policies.get(dropPolicy[3])?.delete(dropPolicy[1] ?? dropPolicy[2]);
      continue;
    }
    const createTrigger = new RegExp(
      String.raw`^create (?:or replace )?trigger (${ID}) (before|after|instead of) .*? on (?:public\.)?(${ID}) .*?execute (?:function|procedure) (?:public\.)?(${ID}) ?\(`,
    ).exec(statement);
    if (createTrigger) {
      const [, name, timing, table, fn] = createTrigger;
      entryOf(schema.triggers, table).set(name, { timing, fn });
      continue;
    }
    const privilege = new RegExp(String.raw`^(grant|revoke) (.+?) on (?:table )?(.+?) (?:to|from) (.+)$`).exec(statement);
    if (privilege) {
      const [, verb, privileges, objects, roles] = privilege;
      if (/^(sequence|function|schema|all) /.test(objects)) continue;
      for (const object of objects.split(',').map((o) => refTableOf(o.trim()))) {
        for (const role of roles.split(',').map((r) => r.trim())) {
          const byRole = entryOf(schema.revoked, object);
          const set = byRole.get(role) ?? new Set<string>();
          for (const priv of privileges.split(',').map((x) => x.trim())) {
            if (verb === 'revoke') set.add(priv);
            else if (priv === 'all') set.clear();
            else set.delete(priv);
          }
          byRole.set(role, set);
        }
      }
      continue;
    }
    const dropTrigger = new RegExp(String.raw`^drop trigger (?:if exists )?(${ID}) on (?:public\.)?(${ID})`).exec(statement);
    if (dropTrigger) {
      schema.triggers.get(dropTrigger[2])?.delete(dropTrigger[1]);
      continue;
    }

    const create = new RegExp(String.raw`^create table (?:if not exists )?(?:public\.)?(${ID}) \((.*)\)$`).exec(statement);
    if (create) {
      const [, table, body] = create;
      const columns = columnsOf(table);
      for (const item of splitTopLevel(body)) {
        const tableFk = new RegExp(
          String.raw`^(?:constraint (${ID}) )?foreign key \((${ID})\) ${REF}`,
        ).exec(item);
        if (tableFk) {
          const [, name, column, ref] = tableFk;
          addForeignKey({ name: name ?? `${table}_${column}_fkey`, table, column, refTable: refTableOf(ref) });
          continue;
        }
        if (/^(constraint|primary key|unique|check|exclude)\b/.test(item)) continue;
        const column = new RegExp(String.raw`^"?(${ID})"?\s`).exec(item)?.[1];
        if (!column) continue;
        columns.add(column);
        const inline = new RegExp(REF).exec(item);
        if (inline) {
          addForeignKey({ name: `${table}_${column}_fkey`, table, column, refTable: refTableOf(inline[1]) });
        }
      }
      continue;
    }

    const alter = new RegExp(String.raw`^alter table (?:if exists )?(?:only )?(?:public\.)?(${ID}) (.*)$`).exec(statement);
    if (alter) {
      const [, table, actions] = alter;
      for (const action of splitTopLevel(actions)) {
        if (action === 'enable row level security') {
          schema.rls.add(table);
          continue;
        }
        if (action === 'disable row level security') {
          schema.rls.delete(table);
          continue;
        }
        const addFk = new RegExp(
          String.raw`^add constraint (${ID}) foreign key \((${ID})\) ${REF}`,
        ).exec(action);
        if (addFk) {
          const [, name, column, ref] = addFk;
          addForeignKey({ name, table, column, refTable: refTableOf(ref) });
          continue;
        }
        if (/^add constraint /.test(action)) continue;
        const addColumn = new RegExp(String.raw`^add (?:column )?(?:if not exists )?"?(${ID})"?\s`).exec(action);
        if (addColumn) {
          const column = addColumn[1];
          columnsOf(table).add(column);
          const inline = new RegExp(REF).exec(action);
          if (inline) {
            addForeignKey({ name: `${table}_${column}_fkey`, table, column, refTable: refTableOf(inline[1]) });
          }
          continue;
        }
        const dropConstraint = new RegExp(String.raw`^drop constraint (?:if exists )?(${ID})`).exec(action);
        if (dropConstraint) {
          schema.foreignKeys.delete(dropConstraint[1]);
          continue;
        }
        const dropColumn = new RegExp(String.raw`^drop (?:column )?(?:if exists )?(${ID})`).exec(action);
        if (dropColumn && !/^drop (constraint|not null|default)\b/.test(action)) {
          columnsOf(table).delete(dropColumn[1]);
          for (const [name, fk] of schema.foreignKeys) {
            if (fk.table === table && fk.column === dropColumn[1]) schema.foreignKeys.delete(name);
          }
        }
      }
      continue;
    }

    const drop = new RegExp(String.raw`^drop table (?:if exists )?(?:public\.)?(${ID})`).exec(statement);
    if (drop) {
      schema.columns.delete(drop[1]);
      schema.policies.delete(drop[1]);
      schema.triggers.delete(drop[1]);
      schema.rls.delete(drop[1]);
      schema.revoked.delete(drop[1]);
      for (const [name, fk] of schema.foreignKeys) {
        if (fk.table === drop[1] || fk.refTable === drop[1]) schema.foreignKeys.delete(name);
      }
    }
  }
}

function migrationFiles(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

function hasForeignKeyBetween(schema: Schema, a: string, b: string): boolean {
  for (const fk of schema.foreignKeys.values()) {
    if ((fk.table === a && fk.refTable === b) || (fk.table === b && fk.refTable === a)) return true;
  }
  return false;
}

// === Relevé des jointures du code ===

interface Embed {
  file: string;
  line: number;
  from: string;
  table: string;
}

interface DynamicSelect {
  file: string;
  line: number;
  argument: string;
}

/**
 * Chaque `.select(` et son premier argument : une chaîne littérale (groupe 2),
 * ou une expression (groupe 3). Un `.select()` sans argument ne joint rien.
 */
const SELECT_CALL = /(?<!Platform)\.select\(\s*(?:(['"`])((?:(?!\1)[\s\S])*)\1|([^)\s][^)]*))?/g;
const FROM_CALL = /\.from\(\s*['"`]([a-z_][a-z0-9_]*)['"`]\s*\)/g;
/**
 * `alias:table(`, `table(` ou `...table(` (jointure « étalée ») — ni une méthode
 * (`score_at_scan.sum(`), ni un agrégat (`count()`).
 */
const EMBED = /(?:\.\.\.|(?<![.\w]))(?:[a-z_][a-z0-9_]*\s*:\s*)?([a-z_][a-z0-9_]*)(?:\s*!\s*[a-z_][a-z0-9_]*)?\s*\(/g;
const AGGREGATES = new Set(['count', 'sum', 'avg', 'min', 'max']);

/** Table de la sélection : le dernier `.from()` qui la précède dans la même expression. */
function fromTableBefore(source: string, selectAt: number): string | null {
  const window = source.slice(Math.max(0, selectAt - 1500), selectAt);
  let last: { table: string; end: number } | null = null;
  for (const m of window.matchAll(FROM_CALL)) last = { table: m[1], end: (m.index ?? 0) + m[0].length };
  if (!last || window.slice(last.end).includes(';')) return null;
  return last.table;
}

function scanSelects(source: string, file: string): { embeds: Embed[]; dynamic: DynamicSelect[] } {
  const embeds: Embed[] = [];
  const dynamic: DynamicSelect[] = [];
  for (const m of source.matchAll(SELECT_CALL)) {
    const at = m.index ?? 0;
    const line = source.slice(0, at).split('\n').length;
    const [, , literal, expression] = m;
    if (literal === undefined) {
      if (expression !== undefined) dynamic.push({ file, line, argument: expression.trim() });
      continue;
    }
    const from = fromTableBefore(source, at) ?? '?';
    for (const e of literal.matchAll(EMBED)) {
      if (AGGREGATES.has(e[1])) continue;
      embeds.push({ file, line, from, table: e[1] });
    }
  }
  return { embeds, dynamic };
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '__tests__' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

function scanCode(): { embeds: Embed[]; dynamic: DynamicSelect[] } {
  const all = SOURCE_DIRS.flatMap((dir) => sourceFiles(path.join(ROOT, dir))).map((full) =>
    scanSelects(fs.readFileSync(full, 'utf8'), path.relative(ROOT, full)),
  );
  return { embeds: all.flatMap((r) => r.embeds), dynamic: all.flatMap((r) => r.dynamic) };
}

const keyOf = (e: Embed): string => `${e.file} · ${e.from} → ${e.table}`;

/**
 * Sélections non littérales, relues à la main : le contrat ne peut pas lire
 * leurs colonnes. Toute nouvelle sélection non littérale doit y être ajoutée,
 * avec la raison pour laquelle elle ne joint rien.
 */
const REVIEWED_DYNAMIC_SELECTS: ReadonlyArray<string> = [
  // fetchCachedProducts : les colonnes viennent de ses appelants, relus un par
  // un par le test « chaque appel de fetchCachedProducts… ».
  'src/lib/api/openfoodfacts.ts · columns',
];

// === Appels de fetchCachedProducts ===

interface CachedProductsCall {
  file: string;
  line: number;
  /** La liste de colonnes, quand elle est passée en chaîne littérale. */
  columns: string | null;
}

/** Arguments de premier niveau d'un appel, depuis sa parenthèse ouvrante. */
function callArguments(source: string, openAt: number): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = openAt + 1; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const end = source.indexOf(ch, i + 1);
      if (end === -1) break;
      current += source.slice(i, end + 1);
      i = end;
      continue;
    }
    if ('([{'.includes(ch)) depth += 1;
    if (')]}'.includes(ch)) {
      if (depth === 0) break;
      depth -= 1;
    }
    if (ch === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

/** Un appel (pas la définition), avec ou sans paramètre de type. */
const CACHED_PRODUCTS_CALL = /(?<!function )\bfetchCachedProducts(?:<[^<>()]*>)?\(/g;

function scanCachedProductsCalls(source: string, file: string): CachedProductsCall[] {
  return [...source.matchAll(CACHED_PRODUCTS_CALL)].map((m) => {
    const at = m.index ?? 0;
    const columns = callArguments(source, at + m[0].length - 1)[1] ?? '';
    const literal = /^(['"`])([^'"`]*)\1$/.exec(columns);
    return { file, line: source.slice(0, at).split('\n').length, columns: literal ? literal[2] : null };
  });
}

/** Littérale, sans jointure, et avec `barcode` : la clé de la table rendue. */
function isSafeColumnList(columns: string | null): boolean {
  if (columns === null || columns.includes('(')) return false;
  const list = columns.split(',').map((c) => c.trim());
  return list.includes('*') || list.includes('barcode');
}

// === Tests ===

describe('contrat schéma ↔ requêtes (lot H)', () => {
  const files = migrationFiles();
  const schema = replayMigrations(files);

  it('le rejeu des migrations voit la clé que 004 crée et que 012 supprime', () => {
    const before012 = replayMigrations(files.filter((f) => f < '012'));
    expect(before012.foreignKeys.get('scan_history_barcode_fkey')).toEqual({
      name: 'scan_history_barcode_fkey',
      table: 'scan_history',
      column: 'barcode',
      refTable: 'products',
    });
    expect(schema.foreignKeys.has('scan_history_barcode_fkey')).toBe(false);
    expect(hasForeignKeyBetween(schema, 'scan_history', 'products')).toBe(false);
  });

  it('le relevé lit les chaînes sur plusieurs lignes, les jointures après insert/upsert et les jointures « étalées »', () => {
    const fixture = [
      'const q = supabase',
      "  .from('scan_history')",
      "  .select('*, product:products(*), total:score_at_scan.sum(), count()');",
      "supabase.from('products').upsert(p, { onConflict: 'barcode' }).select('barcode, ...brands(name)');",
      "supabase.from('products').select(columns).in('barcode', lot);",
      "supabase.from('products').upsert(p).select().maybeSingle();",
    ].join('\n');
    expect(scanSelects(fixture, 'fixture.ts')).toEqual({
      embeds: [
        { file: 'fixture.ts', line: 3, from: 'scan_history', table: 'products' },
        { file: 'fixture.ts', line: 4, from: 'products', table: 'brands' },
      ],
      dynamic: [{ file: 'fixture.ts', line: 5, argument: 'columns' }],
    });
  });

  it('chaque sélection non littérale du code a été relue', () => {
    const found = scanCode().dynamic.map((d) => `${d.file} · ${d.argument}`);
    expect(found).toEqual([...REVIEWED_DYNAMIC_SELECTS]);
  });

  it('chaque jointure du code s’appuie sur une clé étrangère (hors dette connue)', () => {
    const violations = scanCode()
      .embeds.filter((e) => !hasForeignKeyBetween(schema, e.from, e.table))
      .filter((e) => !KNOWN_BROKEN_EMBEDS.includes(keyOf(e)))
      .map((e) => `${e.file}:${e.line} · ${e.from} → ${e.table}`);
    expect(violations).toEqual([]);
  });

  it('la liste des jointures connues est vide', () => {
    // Regarnir la liste pour faire passer une jointure nouvelle fait tomber ce
    // test : une jointure passe par une clé étrangère, ou par une lecture en
    // deux temps (`fetchCachedProducts`).
    expect(KNOWN_BROKEN_EMBEDS).toEqual([]);
  });

  it('chaque appel de fetchCachedProducts passe ses colonnes en littéral, sans jointure, avec barcode', () => {
    const fixture = [
      "await fetchCachedProducts<Product>(rows.filter((r) => r.product_type !== 'cosmetic').map((r) => r.barcode), '*');",
      'await fetchCachedProducts(codes, columns);',
      "await fetchCachedProducts(codes, 'barcode, brand:brands(name)');",
      'export async function fetchCachedProducts<T extends { barcode: string }>(barcodes: string[], columns: string) {}',
    ].join('\n');
    expect(scanCachedProductsCalls(fixture, 'fixture.ts').map((c) => [c.line, c.columns])).toEqual([
      [1, '*'],
      [2, null],
      [3, 'barcode, brand:brands(name)'],
    ]);

    const calls = SOURCE_DIRS.flatMap((dir) => sourceFiles(path.join(ROOT, dir))).flatMap((full) =>
      scanCachedProductsCalls(fs.readFileSync(full, 'utf8'), path.relative(ROOT, full)),
    );
    expect(calls.length).toBeGreaterThan(0);
    const unsafe = calls
      .filter((c) => !isSafeColumnList(c.columns))
      .map((c) => `${c.file}:${c.line} · ${c.columns ?? 'colonnes non littérales'}`);
    expect(unsafe).toEqual([]);
  });

  it('chaque champ du cache produits (upsert de l’objet entier) est une colonne de products', () => {
    const columns = schema.columns.get('products') ?? new Set<string>();
    const fields = Object.keys(normalizeOFFProduct({ code: '1' }));
    expect(fields.filter((f) => !columns.has(f))).toEqual([]);
  });

  it('chaque champ du cache cosmétique est une colonne de cosmetic_products', () => {
    const columns = schema.columns.get('cosmetic_products') ?? new Set<string>();
    const fields = Object.keys(normalizeOBFProduct({ code: '1' }));
    expect(fields.filter((f) => !columns.has(f))).toEqual([]);
  });

  it('chaque champ inséré dans scan_history est une colonne de scan_history', () => {
    const columns = schema.columns.get('scan_history') ?? new Set<string>();
    const fields = Object.keys(
      buildScanInsertPayload('u', { barcode: '1', score: 50, profile: 'standard', penalties: [] }),
    );
    expect(fields.filter((f) => !columns.has(f))).toEqual([]);
  });

  it('le rejeu lit les politiques, les triggers et la RLS (lot C)', () => {
    const fixture = emptySchema();
    replaySql(
      fixture,
      [
        'create table t (id int, updated_at timestamptz);',
        'alter table public.t enable row level security;',
        'create policy "Lecture" on public.t for select using (true);',
        'create policy "Écriture" on public.t for insert to authenticated with check (true);',
        'create policy "Tout" on t using (true);',
        'drop policy if exists "Écriture" on public.t;',
        'create policy t_write on public.t for update using (true);',
        'create trigger t_dates before insert or update on public.t for each row execute function public.f();',
        'create or replace function public.f() returns trigger language plpgsql as $$ begin new.d := now(); return new; end; $$;',
        'revoke insert, update on public.t from anon, authenticated;',
        'grant update on t to authenticated;',
        'revoke all on sequence public.t_id_seq from anon;',
      ].join('\n'),
    );
    expect(Object.fromEntries(fixture.policies.get('t') ?? [])).toEqual({ lecture: 'select', tout: 'all', t_write: 'update' });
    expect(Object.fromEntries(fixture.triggers.get('t') ?? [])).toEqual({ t_dates: { timing: 'before', fn: 'f' } });
    expect(fixture.functions.get('f')).toBe('begin new.d := now(); return new; end;');
    expect([...(fixture.revoked.get('t')?.get('anon') ?? [])]).toEqual(['insert', 'update']);
    expect([...(fixture.revoked.get('t')?.get('authenticated') ?? [])]).toEqual(['insert']);
    expect(fixture.revoked.has('t_id_seq')).toBe(false);
    expect(fixture.rls.has('t')).toBe(true);
  });

  it('les caches products et cosmetic_products ne sont plus ouverts qu’en lecture (lot C)', () => {
    const writable = ['products', 'cosmetic_products'].flatMap((table) =>
      [...(schema.policies.get(table) ?? new Map<string, string>())]
        .filter(([, command]) => command !== 'select')
        .map(([name, command]) => `${table} · ${name} · ${command}`),
    );
    expect(writable).toEqual([]);
    for (const table of ['products', 'cosmetic_products']) {
      expect(schema.rls.has(table)).toBe(true);
      expect([...(schema.policies.get(table)?.values() ?? [])]).toContain('select');
    }
  });

  it('les dates des deux caches sont fixées par le serveur : trigger BEFORE, now() du serveur, création conservée (lot C)', () => {
    for (const table of ['products', 'cosmetic_products']) {
      expect([...(schema.triggers.get(table)?.values() ?? [])]).toContainEqual({ timing: 'before', fn: 'set_cache_timestamps' });
    }
    const body = schema.functions.get('set_cache_timestamps') ?? '';
    expect(body).toContain('new.updated_at := pg_catalog.now()');
    expect(body).toContain('new.created_at := old.created_at');
  });

  it('les rôles client ne peuvent plus écrire dans les deux caches, même par une politique oubliée (REVOKE, lot C)', () => {
    for (const table of ['products', 'cosmetic_products']) {
      for (const role of ['anon', 'authenticated']) {
        expect([...(schema.revoked.get(table)?.get(role) ?? [])]).toEqual(
          expect.arrayContaining(['insert', 'update', 'delete', 'truncate']),
        );
      }
    }
  });

  it('les dates dans le futur sont rendues périmées AVANT la création des triggers, qui redateraient la mise à jour (018)', () => {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, '018_cache_server_timestamps.sql'), 'utf8').toLowerCase();
    const neutralize = sql.indexOf("update public.products\n  set updated_at = now() - interval '8 days'");
    const trigger = sql.indexOf('create trigger products_set_cache_timestamps');
    expect(neutralize).toBeGreaterThan(-1);
    expect(neutralize).toBeLessThan(trigger);
  });

  it('le journal des relectures n’est ouvert à aucun client : RLS active, aucune politique (lot C)', () => {
    expect([...(schema.columns.get('cache_refresh_log') ?? [])].sort()).toEqual(['id', 'requested_at', 'source', 'user_id']);
    expect(schema.rls.has('cache_refresh_log')).toBe(true);
    expect(schema.policies.get('cache_refresh_log')?.size ?? 0).toBe(0);
    for (const role of ['anon', 'authenticated']) {
      expect([...(schema.revoked.get('cache_refresh_log')?.get(role) ?? [])]).toContain('all');
    }
  });
});
