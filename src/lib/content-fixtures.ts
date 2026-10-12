/** Sorgente di prova: dati di `fixtures.ts`, usati finché `SANITY_DATASET` non è impostato. */
import {
  contactPageFixture,
  homePageFixture,
  stripClientFixtures,
  projectFixtures,
  servicesPageFixture,
  siteSettingsFixture,
  studioPageFixture,
} from './fixtures';
import { byOrder, toSummary } from './project-utils';
import type {
  ContactPageData,
  HomePageData,
  ClientEntry,
  Project,
  ProjectSummary,
  ServicesPageData,
  SiteSettings,
  StudioPageData,
} from './types';

export async function getSiteSettings(): Promise<SiteSettings> {
  return siteSettingsFixture;
}

export async function getProjects(): Promise<Project[]> {
  return byOrder(projectFixtures);
}

export async function getHomePage(): Promise<HomePageData> {
  const { carouselSlugs, featuredSlugs, ...rest } = homePageFixture;
  const all = await getProjects();
  const pick = (slugs: string[]): ProjectSummary[] =>
    slugs
      .map((slug) => all.find((p) => p.slug === slug))
      .filter((p): p is Project => p !== undefined)
      .map(toSummary);
  return { ...rest, carousel: pick(carouselSlugs), featured: pick(featuredSlugs) };
}

/** Clienti con `showInLogoStrip = true`. */
export async function getStripClients(): Promise<ClientEntry[]> {
  return stripClientFixtures;
}

export async function getStudioPage(): Promise<StudioPageData> {
  return studioPageFixture;
}

/** Elenco "Clienti" della pagina Studio: i nomi, nell'ordine scelto. */
export async function getStudioClients(names: string[]): Promise<ClientEntry[]> {
  return names.map((name) => ({ name }));
}

export async function getServicesPage(): Promise<ServicesPageData> {
  return servicesPageFixture;
}

export async function getContactPage(): Promise<ContactPageData> {
  return contactPageFixture;
}

/** Immagine di condivisione di riserva: i dati di prova non hanno foto. */
export async function getDefaultOgImage(): Promise<string | undefined> {
  return undefined;
}
