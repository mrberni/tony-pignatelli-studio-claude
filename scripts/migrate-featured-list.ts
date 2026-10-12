/**
 * Passaggio da "In evidenza in home" (spunta sui progetti) all'elenco trascinabile
 * "Progetti selezionati" della pagina Home. Una tantum, per ogni dataset.
 *
 *   pnpm migrate:featured -- --dataset staging              riempie homePage.featuredProjects con i progetti
 *                                                           oggi in evidenza, nell'ordine attuale (non tocca nulla se l'elenco c'è già)
 *   pnpm migrate:featured -- --dataset staging --cleanup    toglie il vecchio campo `featured` dai progetti
 *                                                           (da fare solo dopo che il sito nuovo è online)
 *
 * In `production` serve `--confirm-production`.
 */
import { createClient } from '@sanity/client';

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

if (flag('cleanup')) {
  const ids = await client.fetch<string[]>(`*[_type == "project" && defined(featured)]._id`);
  let tx = client.transaction();
  for (const id of ids) tx = tx.patch(id, (patch) => patch.unset(['featured']));
  await tx.commit();
  console.log(`Campo "featured" tolto da ${ids.length} progetti nel dataset "${dataset}".`);
} else {
  const home = await client.fetch<{ count: number } | null>(`*[_id == "homePage"][0]{ "count": count(featuredProjects) }`);
  if (!home) throw new Error(`Nel dataset "${dataset}" manca il documento homePage.`);
  if (home.count > 0) {
    console.log(`L'elenco "Progetti selezionati" ha già ${home.count} progetti: nessuna modifica.`);
  } else {
    const ids = await client.fetch<string[]>(
      `*[_type == "project" && featured == true && !(_id in path("drafts.**"))] | order(order asc)[0...8]._id`,
    );
    if (ids.length < 4) throw new Error(`Trovati solo ${ids.length} progetti in evidenza: ne servono almeno 4.`);
    await client
      .patch('homePage')
      .set({ featuredProjects: ids.map((id) => ({ _type: 'reference', _key: `featured-${id}`.slice(0, 64), _ref: id })) })
      .commit();
    console.log(`Elenco "Progetti selezionati" creato con ${ids.length} progetti nel dataset "${dataset}".`);
  }
}
