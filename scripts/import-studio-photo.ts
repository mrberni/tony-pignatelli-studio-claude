/**
 * Foto della pagina Studio (da https://www.tonypignatellistudio.com/about) → Sanity.
 *
 *   pnpm import:studio-photo -- --dataset staging            carica la foto e la collega a studioPage.intro.photo
 *   pnpm import:studio-photo -- --dataset staging --update   sostituisce una foto già presente
 *
 * Idempotente: se la foto c'è già, non fa nulla. In `production` serve `--confirm-production`.
 * L'originale su Wix è di soli 600×397 px: va sostituito con una foto più grande dallo Studio.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createClient } from '@sanity/client';
import { withRetry, wixMediaUrl } from './lib/photos.ts';
import { ROOT } from './lib/source.ts';

const MEDIA_ID = 'ccac1d_4e031590e2e44c53b9a8b191d2d71913~mv2.jpg';
const FILE_NAME = 'studio-photo.jpg';
const ALT = 'Ritratto con un neon blu';
// Punto focale: il volto sta a destra del centro; il ritaglio 4:5 della pagina lo conserva.
const HOTSPOT = { _type: 'sanity.imageHotspot', x: 0.6, y: 0.5, width: 0.54, height: 1 };

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

const existing = await withRetry('lettura studioPage', () =>
  client.fetch<{ _id: string; hasPhoto: boolean } | null>(
    `*[_id == "studioPage"][0]{ _id, "hasPhoto": defined(intro.photo.asset) }`,
  ),
);
if (!existing) throw new Error(`Nel dataset "${dataset}" manca il documento studioPage: lancia prima l'importatore dati.`);
if (existing.hasPhoto && !flag('update')) {
  console.log('La foto dello Studio c\'è già: nessuna modifica (usa --update per sostituirla).');
  process.exit(0);
}

const cache = join(ROOT, 'data', '.cache');
const path = join(cache, FILE_NAME);
let bytes: Buffer;
try {
  bytes = await readFile(path);
} catch {
  bytes = await withRetry('download foto', async () => {
    const response = await fetch(wixMediaUrl(MEDIA_ID));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  });
  await mkdir(cache, { recursive: true });
  await writeFile(path, bytes);
}

const asset = await withRetry('caricamento foto', () =>
  client.assets.upload('image', bytes, { filename: FILE_NAME }),
);
await client
  .patch('studioPage')
  .set({
    'intro.photo': { _type: 'photo', asset: { _type: 'reference', _ref: asset._id }, alt: ALT, hotspot: HOTSPOT },
  })
  .commit();
console.log(`Foto collegata a studioPage.intro.photo nel dataset "${dataset}" (${asset._id}).`);
