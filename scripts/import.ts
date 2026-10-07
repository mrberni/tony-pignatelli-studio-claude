/**
 * Importatore Wix → Sanity (HANDOFF §8): progetti, clienti e pagine, SENZA foto (Fase 4).
 *
 *   pnpm import:dry                                    legge foglio e CSV, non scrive nulla
 *   pnpm import:dry -- --dataset staging               + confronta con ciò che c'è già nel dataset (sola lettura)
 *   pnpm import:run -- --dataset staging               scrive nel dataset (serve SANITY_WRITE_TOKEN)
 *   pnpm import:run -- --dataset staging --prune       prima cancella i documenti estranei all'importazione
 *   pnpm import:run -- --dataset staging --update      aggiorna anche i campi dei documenti già esistenti
 *   pnpm import:verify -- --dataset staging            solo le verifiche finali
 *
 * Idempotente: gli `_id` sono deterministici (`project-<slug>`, `client-<slug>`). Per default i
 * documenti già presenti NON vengono toccati (tranne `legacy`), così le modifiche fatte nello
 * Studio non si perdono. `production` richiede in più `--confirm-production`.
 */
import { createReadStream } from 'node:fs';
import { basename } from 'node:path';
import { createClient, type SanityClient } from '@sanity/client';
import {
  clientFields,
  projectFields,
  projectId,
  projectLegacy,
  singletonDocuments,
  type SanityDoc,
} from './lib/documents.ts';
import { EXPECTED, loadSource, type Source } from './lib/source.ts';
import { verifyDataset } from './lib/verify.ts';

const API_VERSION = process.env.SANITY_API_VERSION ?? '2026-10-01';
// L'ID del progetto Sanity non è un segreto (compare nel sito pubblicato)
const PROJECT_ID = process.env.SANITY_PROJECT_ID ?? '8yzoe1bm';
const BATCH = 25;

const args = process.argv.slice(2);
const flag = (name: string): boolean => args.includes(`--${name}`);
const option = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const mode = flag('run') ? 'run' : flag('verify') ? 'verify' : 'dry';
const dataset = option('dataset');

const line = (text = ''): void => console.log(text);
const section = (title: string): void => {
  line();
  line(`── ${title}`);
};

function printSource(source: Source): void {
  const { projects, clients } = source;
  section('Foglio e CSV');
  line(`Progetti: ${projects.length}  (Eventi ${projects.filter((p) => p.category === 'eventi').length}, Vetrine ${projects.filter((p) => p.category === 'vetrine').length}, Set design ${projects.filter((p) => p.category === 'set-design').length})`);
  line(`Clienti:  ${clients.length}  (nella striscia loghi: ${clients.filter((c) => c.showInLogoStrip).length})`);
  line(`In evidenza: ${projects.filter((p) => p.featured).length} · nel carousel: ${projects.filter((p) => p.carousel).length} · ordine: ${Math.min(...projects.map((p) => p.order))}–${Math.max(...projects.map((p) => p.order))}`);
  line(`Titoli Wix collegati tramite URL: ${projects.filter((p) => p.wixRow).length} su ${projects.length}`);
  const renamed = projects.filter((p) => p.wixTitle && p.wixTitle !== p.title);
  line(`Titoli diversi tra foglio e Wix (normale, il foglio vale): ${renamed.length}`);
  const withLogo = clients.filter((c) => c.logoPath).length;
  line(`Loghi SVG trovati in data/logos/: ${withLogo} su ${clients.filter((c) => c.logoFile).length} dichiarati nel foglio`);
  line(`Clienti aggiuntivi solo per il logo (nomi della lista Studio senza progetto): ${source.extraClients.length}`);

  // Controllo informativo per la Fase 4: foto dichiarate nel foglio vs foto nell'export Wix
  let mismatch = 0;
  let totalPhotos = 0;
  for (const p of projects) {
    totalPhotos += p.photoCount;
    const raw = p.wixRow?.['Gallery'] ?? '[]';
    try {
      const gallery = JSON.parse(raw) as unknown[];
      if (gallery.length !== p.photoCount) mismatch++;
    } catch {
      mismatch++;
    }
  }
  line(`Foto dichiarate nel foglio: ${totalPhotos} (progetti con conteggio diverso dall'export Wix: ${mismatch}: se ne riparla in Fase 4)`);

  const slugged = projects.filter((p) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug));
  if (slugged.length) line(`⚠ Slug anomali: ${slugged.map((p) => p.slug).join(', ')}`);
}

function printMessages(source: Source): void {
  if (source.warnings.length) {
    section('Note e avvisi');
    source.warnings.forEach((w) => line(`• ${w}`));
  }
  if (source.errors.length) {
    section('ERRORI (l\'importazione non può partire)');
    source.errors.forEach((e) => line(`✗ ${e}`));
  }
}

function buildClient(withToken: boolean): SanityClient {
  const token = process.env.SANITY_WRITE_TOKEN;
  if (withToken && !token) {
    throw new Error('Manca SANITY_WRITE_TOKEN: mettilo in .env.local (mai nel repository, mai in chat).');
  }
  return createClient({
    projectId: PROJECT_ID,
    dataset: dataset ?? '',
    apiVersion: API_VERSION,
    useCdn: false,
    ...(withToken && token ? { token } : {}),
  });
}

/** Documenti di tipi gestiti dall'importatore che non fanno parte dell'importazione. */
async function findForeign(client: SanityClient, ids: Set<string>): Promise<Array<{ _id: string; _type: string; label: string }>> {
  const existing = await client.fetch<Array<{ _id: string; _type: string; label: string }>>(
    `*[_type in ["project","client","homePage","studioPage","servicesPage","contactPage","siteSettings"]]{
      _id, _type, "label": coalesce(title, name, _type)
    }`,
  );
  return existing.filter((doc) => !ids.has(doc._id.replace(/^drafts\./, '')) || doc._id.startsWith('drafts.'));
}

async function main(): Promise<void> {
  const source = loadSource();
  printSource(source);
  printMessages(source);
  if (source.errors.length) process.exit(1);

  // 45 clienti dei progetti + i nomi della lista Studio che hanno solo il logo (documenti `client` per ospitarlo)
  const clientDocs = [...source.clients, ...source.extraClients];
  const projectDocs = source.projects;
  const singletons = singletonDocuments(source);
  const importIds = new Set<string>([
    ...clientDocs.map((c) => c.id),
    ...projectDocs.map(projectId),
    ...singletons.map((s) => s._id),
  ]);

  section('Da scrivere');
  line(`${clientDocs.length} clienti · ${projectDocs.length} progetti · ${singletons.length} pagine (Impostazioni, Home, Studio, Servizi, Contatti) = ${importIds.size} documenti`);

  if (mode === 'dry') {
    if (dataset) {
      const client = buildClient(false);
      const foreign = await findForeign(client, importIds);
      const present = await client.fetch<number>(`count(*[_id in $ids])`, { ids: [...importIds] });
      section(`Confronto con il dataset "${dataset}" (sola lettura)`);
      line(`Documenti dell'importazione già presenti: ${present} su ${importIds.size}`);
      line(`Documenti estranei (verrebbero rimossi solo con --prune): ${foreign.length}`);
      foreign.forEach((doc) => line(`   · ${doc._type}: ${doc.label} (${doc._id})`));
    }
    line();
    line('Prova a secco: non è stato scritto nulla.');
    return;
  }

  if (!dataset) throw new Error('Indica il dataset: --dataset staging');
  if (dataset === 'production' && !flag('confirm-production')) {
    throw new Error('Scrivere in "production" richiede --confirm-production (e l\'ok dell\'utente).');
  }

  if (mode === 'verify') {
    await runVerify(buildClient(false), EXPECTED.clients + source.extraClients.length);
    return;
  }

  const client = buildClient(true);
  line();
  line(`Dataset di destinazione: ${dataset}${flag('prune') ? ' (con --prune)' : ''}${flag('update') ? ' (con --update)' : ''}`);

  // 1. Documenti estranei
  const foreign = await findForeign(client, importIds);
  if (foreign.length && !flag('prune')) {
    section('Documenti estranei nel dataset');
    foreign.forEach((doc) => line(`   · ${doc._type}: ${doc.label} (${doc._id})`));
    throw new Error('Ci sono documenti estranei. Rimuovili a mano oppure rilancia con --prune (cancellazione: serve l\'ok dell\'utente).');
  }
  if (foreign.length && flag('prune')) {
    section('Pulizia');
    // I progetti prima dei clienti: un documento citato da altri non si può cancellare
    const ORDER = ['project', 'homePage', 'studioPage', 'servicesPage', 'contactPage', 'siteSettings', 'client'];
    foreign.sort((a, b) => ORDER.indexOf(a._type) - ORDER.indexOf(b._type));
    for (const doc of foreign) {
      await client.delete(doc._id);
      line(`   ✗ cancellato ${doc._type}: ${doc.label} (${doc._id})`);
    }
    // Asset non più referenziati (es. foto di prova)
    const orphans = await client.fetch<string[]>(
      `*[_type in ["sanity.imageAsset","sanity.fileAsset"] && count(*[references(^._id)]) == 0]._id`,
    );
    for (const id of orphans) {
      await client.delete(id);
      line(`   ✗ cancellato asset orfano ${id}`);
    }
  }

  // 2. Clienti, poi progetti (i progetti puntano ai clienti)
  section('Scrittura');
  const update = flag('update');
  for (let i = 0; i < clientDocs.length; i += BATCH) {
    const tx = client.transaction();
    for (const c of clientDocs.slice(i, i + BATCH)) {
      tx.createIfNotExists({ _id: c.id, _type: 'client', ...clientFields(c) });
      if (update) tx.patch(c.id, (p) => p.set(clientFields(c)));
    }
    await tx.commit();
  }
  line(`   clienti: ${clientDocs.length}`);

  for (let i = 0; i < projectDocs.length; i += BATCH) {
    const tx = client.transaction();
    for (const p of projectDocs.slice(i, i + BATCH)) {
      const id = projectId(p);
      tx.createIfNotExists({ _id: id, _type: 'project', ...projectFields(p) });
      tx.patch(id, (patch) => patch.set(update ? { ...projectFields(p), legacy: projectLegacy(p) } : { legacy: projectLegacy(p) }));
    }
    await tx.commit();
  }
  line(`   progetti: ${projectDocs.length}`);

  const tx = client.transaction();
  for (const doc of singletons) tx.createIfNotExists(doc as SanityDoc & { _id: string });
  await tx.commit();
  line(`   pagine: ${singletons.length} (create solo se mancanti: i testi già modificati non si toccano)`);

  // 3. Loghi (solo quelli presenti in data/logos/)
  const logos = clientDocs.filter((c) => c.logoPath);
  for (const c of logos) {
    const asset = await client.assets.upload('file', createReadStream(c.logoPath as string), {
      filename: basename(c.logoPath as string),
      contentType: 'image/svg+xml',
    });
    await client.patch(c.id).set({ logo: { _type: 'file', asset: { _type: 'reference', _ref: asset._id } } }).commit();
  }
  line(`   loghi caricati: ${logos.length}${logos.length === 0 ? ' (nessun file in data/logos/)' : ''}`);

  await runVerify(client, EXPECTED.clients + source.extraClients.length);
}

async function runVerify(client: SanityClient, expectedClients: number): Promise<void> {
  section(`Verifiche sul dataset "${dataset}"`);
  const checks = await verifyDataset(client, expectedClients);
  for (const check of checks) line(`${check.ok ? '✓' : '✗'} ${check.label}: ${check.detail}`);
  line('✓ Foto per progetto: non applicabile (le foto si importano in Fase 4)');
  const failed = checks.filter((c) => !c.ok);
  line();
  line(failed.length === 0 ? 'Tutte le verifiche sono verdi.' : `${failed.length} verifiche non superate.`);
  if (failed.length) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(`\n✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
