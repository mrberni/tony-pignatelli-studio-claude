/** Verifiche automatiche a fine importazione (HANDOFF §8.5.3). */
import type { SanityClient } from '@sanity/client';
import { EXPECTED } from './source.ts';

export interface Check {
  label: string;
  ok: boolean;
  detail: string;
}

/** `expectedClients`: i 45 clienti dei progetti più i clienti aggiuntivi che esistono solo per ospitare un logo. */
export async function verifyDataset(client: SanityClient, expectedClients: number = EXPECTED.clients): Promise<Check[]> {
  const checks: Check[] = [];
  const add = (label: string, ok: boolean, detail: string): void => {
    checks.push({ label, ok, detail });
  };
  const same = (label: string, actual: number, expected: number): void =>
    add(label, actual === expected, `${actual} (atteso ${expected})`);

  // Solo documenti pubblicati
  type Project = { _id: string; title?: string; category?: string; sector?: string; order?: number; clientOk?: boolean; slug?: string; featured?: boolean };
  const projects = await client.fetch<Project[]>(
    `*[_type == "project" && !(_id in path("drafts.**"))]{
      _id, title, category, sector, order, featured, "slug": slug.current,
      "clientOk": defined(client->name)
    }`,
  );
  same('Progetti', projects.length, EXPECTED.projects);
  for (const [category, expected] of Object.entries(EXPECTED.perCategory)) {
    same(`  di cui ${category}`, projects.filter((p) => p.category === category).length, expected);
  }

  const clients = await client.fetch<number>(`count(*[_type == "client" && !(_id in path("drafts.**"))])`);
  same('Clienti (progetti + solo logo)', clients, expectedClients);
  const linked = await client.fetch<number>(`count(array::unique(*[_type == "project" && !(_id in path("drafts.**"))].client._ref))`);
  same('  di cui collegati ai progetti', linked, EXPECTED.clients);
  same('Progetti in evidenza', projects.filter((p) => p.featured).length, EXPECTED.featured);

  const carousel = await client.fetch<number>(`count(*[_id == "homePage"][0].carousel[]->_id)`);
  same('Progetti nel carousel (riferimenti validi)', carousel, EXPECTED.carousel);

  const orders = projects.map((p) => p.order ?? 0).sort((a, b) => a - b);
  const contiguous = orders.every((order, i) => order === i + 1);
  add('Ordine da 1 a ' + EXPECTED.projects + ' senza buchi né doppioni', contiguous, contiguous ? 'ok' : `trovato: ${orders.join(',')}`);

  const noClient = projects.filter((p) => !p.clientOk);
  add('Ogni progetto ha un cliente', noClient.length === 0, noClient.length ? noClient.map((p) => p.title).join(', ') : 'ok');
  const noSector = projects.filter((p) => !p.sector);
  add('Ogni progetto ha un settore', noSector.length === 0, noSector.length ? noSector.map((p) => p.title).join(', ') : 'ok');
  const slugs = projects.map((p) => p.slug ?? '');
  const dupSlugs = slugs.filter((s, i) => !s || slugs.indexOf(s) !== i);
  add('Slug univoci e presenti', dupSlugs.length === 0, dupSlugs.length ? dupSlugs.join(', ') : 'ok');

  const singletons = await client.fetch<string[]>(
    `*[_id in ["siteSettings","homePage","studioPage","servicesPage","contactPage"]]._id`,
  );
  same('Pagine singole popolate', singletons.length, 5);

  const drafts = await client.fetch<number>(`count(*[_id in path("drafts.**") && _type in ["project","client"]])`);
  add('Nessuna bozza di progetti o clienti', drafts === 0, `${drafts} bozze`);

  const orphans = await client.fetch<number>(
    `count(*[_type in ["sanity.imageAsset","sanity.fileAsset"] && count(*[references(^._id)]) == 0])`,
  );
  add('Asset orfani', orphans === 0, `${orphans} (atteso 0)`);

  return checks;
}
