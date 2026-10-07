/**
 * Importatore delle foto Wix → Sanity (HANDOFF §8.4, Fase 4). Parte solo su richiesta esplicita.
 *
 *   pnpm import:photos:dry                              piano + peso stimato (richieste HEAD a Wix), non scarica né scrive
 *   pnpm import:photos:run -- --dataset staging         scarica, carica e collega le foto (serve SANITY_WRITE_TOKEN)
 *   pnpm import:photos:run -- --dataset staging --limit 3   prova su 3 progetti
 *   pnpm import:photos:verify -- --dataset staging      solo le verifiche
 *
 * - Concorrenza 4, nuovi tentativi con attesa crescente, nome file originale conservato.
 * - Idempotente: i file scaricati restano in `data/.cache/` (ignorata da git) e Sanity non duplica
 *   gli asset identici. Un progetto che ha già copertina e galleria viene saltato, tranne con
 *   `--update` (che le sostituisce).
 * - Nessun punto focale da importare: nell'export Wix sono tutti al centro (quello predefinito).
 */
import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createClient, type SanityClient } from '@sanity/client';
import { planPhotos, runPool, withRetry, wixMediaUrl, type PhotoPlan, type PhotoRef } from './lib/photos.ts';
import { loadSource, ROOT } from './lib/source.ts';

const API_VERSION = process.env.SANITY_API_VERSION ?? '2026-10-01';
const PROJECT_ID = process.env.SANITY_PROJECT_ID ?? '8yzoe1bm';
const CONCURRENCY = 4;
const CACHE = join(ROOT, 'data', '.cache');

const args = process.argv.slice(2);
const flag = (name: string): boolean => args.includes(`--${name}`);
const option = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const mode = flag('run') ? 'run' : flag('verify') ? 'verify' : 'dry';
const dataset = option('dataset');
const limit = option('limit') ? Number(option('limit')) : undefined;

const line = (text = ''): void => console.log(text);
const section = (title: string): void => {
  line();
  line(`── ${title}`);
};
const mb = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function buildClient(withToken: boolean): SanityClient {
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!dataset) throw new Error('Indica il dataset: --dataset staging');
  if (dataset === 'production' && !flag('confirm-production')) {
    throw new Error('Scrivere in "production" richiede --confirm-production (e l\'ok dell\'utente).');
  }
  if (withToken && !token) throw new Error('Manca SANITY_WRITE_TOKEN: mettilo in .env.local (mai nel repository, mai in chat).');
  return createClient({
    projectId: PROJECT_ID,
    dataset,
    apiVersion: API_VERSION,
    useCdn: false,
    ...(withToken && token ? { token } : {}),
  });
}

function printPlan(plan: PhotoPlan): void {
  const { projects, unique } = plan;
  const gallery = projects.reduce((sum, p) => sum + p.gallery.length, 0);
  section('Piano foto');
  line(`Progetti: ${projects.length}`);
  line(`Copertine: ${projects.length} (già presenti anche nella galleria Wix e quindi non ripetute: ${projects.filter((p) => p.coverWasInGallery).length})`);
  line(`Foto di galleria da collegare: ${gallery}`);
  line(`File unici da scaricare e caricare: ${unique.size}`);
  const noDims = [...unique.values()].filter((p) => !p.width || !p.height);
  if (noDims.length) line(`⚠ Foto senza dimensioni nell'export: ${noDims.length} (le legge Sanity dal file)`);
}

async function estimateWeight(unique: Map<string, PhotoRef>): Promise<void> {
  section('Peso stimato (richieste HEAD a static.wixstatic.com, nessun download)');
  let total = 0;
  let largest = { id: '', size: 0 };
  const failures: string[] = [];
  const types = new Map<string, number>();
  await runPool([...unique.values()], 8, async (photo) => {
    try {
      const response = await withRetry(photo.id, async () => {
        const r = await fetch(wixMediaUrl(photo.id), { method: 'HEAD' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r;
      }, 3);
      const size = Number(response.headers.get('content-length') ?? 0);
      const type = response.headers.get('content-type') ?? 'sconosciuto';
      total += size;
      types.set(type, (types.get(type) ?? 0) + 1);
      if (size > largest.size) largest = { id: photo.id, size };
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  });
  line(`Totale: ${mb(total)} su ${unique.size - failures.length} file (media ${mb(total / Math.max(1, unique.size - failures.length))})`);
  line(`Il più grande: ${mb(largest.size)} (${largest.id})`);
  line(`Tipi di file: ${[...types].map(([type, n]) => `${type} × ${n}`).join(', ')}`);
  if (failures.length) line(`⚠ ${failures.length} file non raggiungibili: ${failures.slice(0, 3).join(' | ')}`);
}

/** Scarica nella cache locale (se non già presente) e restituisce il percorso. */
async function download(photo: PhotoRef): Promise<string> {
  const path = join(CACHE, 'photos', photo.id);
  try {
    if ((await stat(path)).size > 0) return path;
  } catch {
    // non ancora scaricato
  }
  const bytes = await withRetry(`download ${photo.id}`, async () => {
    const response = await fetch(wixMediaUrl(photo.id));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get('content-type') ?? '';
    if (!type.startsWith('image/')) throw new Error(`tipo inatteso: ${type}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) throw new Error('file vuoto');
    return buffer;
  });
  await writeFile(path, bytes);
  return path;
}

async function main(): Promise<void> {
  const source = loadSource();
  if (source.errors.length) {
    source.errors.forEach((e) => console.error(`✗ ${e}`));
    process.exit(1);
  }
  const plan = planPhotos(source.projects);
  printPlan(plan);
  if (plan.errors.length) {
    section('ERRORI nel piano');
    plan.errors.forEach((e) => line(`✗ ${e}`));
    process.exit(1);
  }

  if (mode === 'dry') {
    await estimateWeight(plan.unique);
    line();
    line('Prova a secco: non è stato scaricato né scritto nulla.');
    return;
  }
  if (mode === 'verify') {
    await verify(buildClient(false), limit ? { ...plan, projects: plan.projects.slice(0, limit) } : plan);
    return;
  }

  const client = buildClient(true);
  const selected = limit ? plan.projects.slice(0, limit) : plan.projects;
  line();
  line(`Dataset di destinazione: ${dataset}${limit ? ` (solo i primi ${limit} progetti)` : ''}${flag('update') ? ' (con --update)' : ''}`);

  // Progetti già completi: si saltano (le foto sono contenuto dell'editor, non si sovrascrivono)
  const current = await client.fetch<Array<{ _id: string; cover: string | null; gallery: number }>>(
    `*[_type == "project" && !(_id in path("drafts.**"))]{ _id, "cover": coverImage.asset._ref, "gallery": count(gallery) }`,
  );
  const state = new Map(current.map((p) => [p._id, p]));
  const missingDocs = selected.filter((p) => !state.has(p.documentId));
  if (missingDocs.length) {
    throw new Error(`Progetti non presenti nel dataset (esegui prima l'importazione dei dati): ${missingDocs.slice(0, 3).map((p) => p.title).join(', ')}…`);
  }
  const todo = selected.filter((p) => {
    const s = state.get(p.documentId);
    return flag('update') || !s?.cover || (s.gallery ?? 0) < p.gallery.length;
  });
  const skipped = selected.length - todo.length;
  line(`Progetti da completare: ${todo.length}${skipped ? ` · già completi (saltati): ${skipped}` : ''}`);

  const needed = new Map<string, PhotoRef>();
  for (const project of todo) for (const photo of [project.cover, ...project.gallery]) needed.set(photo.id, photo);
  const files = [...needed.values()];

  // Asset già caricati in questo dataset (mappa locale verificata contro il dataset)
  await mkdir(join(CACHE, 'photos'), { recursive: true });
  const mapPath = join(CACHE, `assets-${dataset}.json`);
  let assetByWixId: Record<string, string> = {};
  try {
    assetByWixId = JSON.parse(await readFile(mapPath, 'utf8')) as Record<string, string>;
  } catch {
    // prima esecuzione
  }
  const known = Object.values(assetByWixId);
  const existing = known.length ? new Set(await client.fetch<string[]>(`*[_id in $ids]._id`, { ids: known })) : new Set<string>();
  for (const [wixId, assetId] of Object.entries(assetByWixId)) if (!existing.has(assetId)) delete assetByWixId[wixId];

  section('Download e caricamento');
  const failures: string[] = [];
  let done = 0;
  let bytesTotal = 0;
  await runPool(files, CONCURRENCY, async (photo) => {
    try {
      if (!assetByWixId[photo.id]) {
        const path = await download(photo);
        bytesTotal += (await stat(path)).size;
        const asset = await withRetry(`upload ${photo.id}`, () =>
          client.assets.upload('image', createReadStream(path), { filename: photo.fileName }),
        );
        assetByWixId[photo.id] = asset._id;
      }
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
    done++;
    if (done % 25 === 0 || done === files.length) line(`   ${done}/${files.length} foto (${mb(bytesTotal)} scaricati in questa esecuzione)`);
  });
  await writeFile(mapPath, JSON.stringify(assetByWixId, null, 1));

  if (failures.length) {
    section('Foto non riuscite');
    failures.forEach((f) => line(`✗ ${f}`));
  }

  // Collegamento ai progetti: solo se tutte le sue foto sono state caricate
  section('Collegamento ai progetti');
  const reference = (photo: PhotoRef) => ({ _type: 'reference', _ref: assetByWixId[photo.id] as string });
  let linked = 0;
  const incomplete: string[] = [];
  for (const project of todo) {
    const photos = [project.cover, ...project.gallery];
    if (photos.some((photo) => !assetByWixId[photo.id])) {
      incomplete.push(project.title);
      continue;
    }
    await client
      .patch(project.documentId)
      .set({
        coverImage: { _type: 'photo', asset: reference(project.cover) },
        gallery: project.gallery.map((photo, i) => ({ _type: 'photo', _key: `photo-${String(i + 1).padStart(3, '0')}`, asset: reference(photo) })),
      })
      .commit();
    linked++;
  }
  line(`Progetti collegati: ${linked}${incomplete.length ? ` · NON completati per foto mancanti: ${incomplete.join(', ')}` : ''}`);

  await verify(client, { ...plan, projects: selected });
  if (failures.length || incomplete.length) process.exit(1);
}

async function verify(client: SanityClient, plan: PhotoPlan): Promise<void> {
  section(`Verifiche sul dataset "${dataset}"`);
  const rows = await client.fetch<Array<{ _id: string; cover: string | null; gallery: number; ids: string[] }>>(
    `*[_type == "project" && !(_id in path("drafts.**"))]{ _id, "cover": coverImage.asset._ref, "gallery": count(gallery), "ids": gallery[].asset._ref }`,
  );
  const byId = new Map(rows.map((r) => [r._id, r]));
  const wrong: string[] = [];
  let withoutCover = 0;
  let galleryTotal = 0;
  for (const project of plan.projects) {
    const row = byId.get(project.documentId);
    if (!row?.cover) {
      withoutCover++;
      wrong.push(`${project.title}: senza copertina`);
      continue;
    }
    galleryTotal += row.gallery;
    // Numero di foto = N. foto (Wix), meno la copertina duplicata
    const expected = project.sheetCount - (project.coverWasInGallery ? 1 : 0);
    if (row.gallery !== expected) wrong.push(`${project.title}: galleria ${row.gallery} foto, attese ${expected}`);
  }
  const ok = (cond: boolean, label: string, detail: string): void => line(`${cond ? '✓' : '✗'} ${label}: ${detail}`);
  ok(withoutCover === 0, 'Progetti con copertina', `${plan.projects.length - withoutCover} su ${plan.projects.length}`);
  ok(wrong.length === 0, 'Foto per progetto = N. foto (Wix) meno la copertina duplicata', wrong.length ? `${wrong.length} progetti diversi` : 'tutti uguali');
  wrong.slice(0, 10).forEach((w) => line(`     · ${w}`));
  line(`  Foto di galleria collegate: ${galleryTotal}`);

  const assets = await client.fetch<Array<{ _id: string; size: number; sha1: string; refs: number }>>(
    `*[_type == "sanity.imageAsset"]{ _id, size, "sha1": sha1hash, "refs": count(*[references(^._id)]) }`,
  );
  const orphans = assets.filter((a) => a.refs === 0).length;
  const sha = assets.map((a) => a.sha1);
  const duplicates = sha.filter((s, i) => sha.indexOf(s) !== i).length;
  const total = assets.reduce((sum, a) => sum + a.size, 0);
  ok(orphans === 0, 'Asset orfani', `${orphans} (atteso 0)`);
  ok(duplicates === 0, 'Asset duplicati (stesso contenuto)', `${duplicates} (atteso 0)`);
  line(`  Peso totale degli asset: ${mb(total)} in ${assets.length} immagini`);

  const nonMeta = await client.fetch<number>(
    `count(*[_type == "sanity.imageAsset" && (!defined(metadata.dimensions) || !defined(metadata.palette))])`,
  );
  ok(nonMeta === 0, 'Asset con dimensioni e colore dominante', nonMeta === 0 ? 'tutti' : `${nonMeta} senza metadati (Sanity li elabora in pochi secondi: riprova)`);

  const failed = wrong.length > 0 || withoutCover > 0 || orphans > 0 || duplicates > 0;
  line();
  line(failed ? 'Alcune verifiche non sono superate.' : 'Tutte le verifiche sono verdi.');
  if (failed) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(`\n✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
