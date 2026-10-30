/**
 * Posizione iniziale dei progetti per l'elenco trascinabile dello Studio (campo `orderRank`).
 *
 *   pnpm order:init -- --dataset staging              dà una posizione ai progetti che non ce l'hanno, seguendo il
 *                                                     vecchio numero d'ordine (`order`: 1 = primo = più in alto in home)
 *   pnpm order:init -- --dataset staging --reset      riparte da zero: ridà una posizione a tutti, seguendo `order`
 *
 * Stesso metodo del pulsante «Reset order» del plugin @sanity/orderable-document-list (LexoRank).
 * Dopo questo passaggio l'ordine si cambia solo trascinando i progetti nello Studio.
 * In `production` serve `--confirm-production`.
 */
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { createClient } from '@sanity/client';
import { ROOT } from './lib/source.ts';

// `lexorank` è una dipendenza del plugin: si risolve partendo dal pacchetto vero del plugin (pnpm usa collegamenti)
const pluginPackage = realpathSync(join(ROOT, 'studio', 'node_modules', '@sanity', 'orderable-document-list', 'package.json'));
const { LexoRank } = createRequire(pluginPackage)('lexorank') as {
  LexoRank: { min(): LexoRankValue };
};
interface LexoRankValue {
  genNext(): LexoRankValue;
  toString(): string;
}

const args = process.argv.slice(2);
const flag = (name: string): boolean => args.includes(`--${name}`);
const dataset = args[args.indexOf('--dataset') + 1];
const token = process.env.SANITY_WRITE_TOKEN;

if (!dataset || dataset.startsWith('--')) throw new Error('Indica il dataset: --dataset staging');
if (dataset === 'production' && !flag('confirm-production')) {
  throw new Error('Scrivere in "production" richiede --confirm-production (e l\'ok dell\'utente).');
}
if (!token) throw new Error('Manca SANITY_WRITE_TOKEN: mettilo in .env.local (mai nel repository, mai in chat).');

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID ?? '8yzoe1bm',
  dataset,
  apiVersion: process.env.SANITY_API_VERSION ?? '2026-10-01',
  useCdn: false,
  token,
});

interface Row {
  _id: string;
  title?: string;
  order?: number;
  orderRank?: string;
}
const rows = await client.fetch<Row[]>(`*[_type == "project" && !(_id in path("drafts.**"))]{ _id, title, order, orderRank }`);
const drafts = new Set(await client.fetch<string[]>(`*[_type == "project" && _id in path("drafts.**")]._id`));

const todo = flag('reset') ? rows : rows.filter((row) => !row.orderRank);
if (todo.length === 0) {
  console.log('Tutti i progetti hanno già una posizione: nessuna modifica (usa --reset per rifarla).');
  process.exit(0);
}
if (!flag('reset') && todo.length !== rows.length) {
  throw new Error(`Solo ${todo.length} progetti su ${rows.length} non hanno una posizione: usa --reset per rifarla per tutti, così l'ordine resta coerente.`);
}

// Come il pulsante «Reset order» del plugin: ogni progetto due passi dopo il precedente
todo.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.title ?? '').localeCompare(b.title ?? '', 'it'));
let rank = LexoRank.min();
let tx = client.transaction();
for (const row of todo) {
  rank = rank.genNext().genNext();
  tx = tx.patch(row._id, (patch) => patch.set({ orderRank: rank.toString() }));
  if (drafts.has(`drafts.${row._id}`)) tx = tx.patch(`drafts.${row._id}`, (patch) => patch.set({ orderRank: rank.toString() }));
}
await tx.commit();
console.log(`Posizione data a ${todo.length} progetti nel dataset "${dataset}" (seguendo il vecchio numero d'ordine).`);
