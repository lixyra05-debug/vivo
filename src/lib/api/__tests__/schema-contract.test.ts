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
 * Jointures connues sans clé étrangère : la dette que le commit (b) du lot H
 * solde par une lecture en deux temps. Liste décroissante — une entrée qui ne
 * correspond plus à une jointure sans clé fait échouer la suite.
 */
const KNOWN_BROKEN_EMBEDS: ReadonlyArray<string> = [
  'src/lib/stats/use-monthly-recap.ts · scan_history → products',
  'src/lib/stores/useProductStore.ts · scan_history → products',
];

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

function replayMigrations(files: readonly string[]): Schema {
  const schema: Schema = { columns: new Map(), foreignKeys: new Map() };
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

  for (const file of files) {
    const sql = stripSql(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
    for (const rawStatement of sql.split(';')) {
      const statement = rawStatement.replace(/\s+/g, ' ').trim().toLowerCase();
      if (!statement) continue;

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
        for (const [name, fk] of schema.foreignKeys) {
          if (fk.table === drop[1] || fk.refTable === drop[1]) schema.foreignKeys.delete(name);
        }
      }
    }
  }
  return schema;
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
const REVIEWED_DYNAMIC_SELECTS: ReadonlyArray<string> = [];

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

  it('la dette connue ne contient aucune entrée périmée', () => {
    const broken = new Set(
      scanCode()
        .embeds.filter((e) => !hasForeignKeyBetween(schema, e.from, e.table))
        .map(keyOf),
    );
    expect(KNOWN_BROKEN_EMBEDS.filter((entry) => !broken.has(entry))).toEqual([]);
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
});
