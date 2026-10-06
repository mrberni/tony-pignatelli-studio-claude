/**
 * Unico punto di accesso ai contenuti. Per ora legge i dati di prova (`fixtures.ts`);
 * quando arrivano le query Sanity cambia solo questo file, non le pagine.
 */
import {
  homePageFixture,
  logoClientFixtures,
  projectFixtures,
  siteSettingsFixture,
} from './fixtures';
import type { HomePageData, LogoClient, Project, ProjectSummary, SiteSettings } from './types';

/** Il lavoro più recente è il primo (`order` crescente). */
function byOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export const toSummary = ({ slug, title, category, sector, order, cover }: Project): ProjectSummary => ({
  slug,
  title,
  category,
  sector,
  order,
  cover,
});

export async function getSiteSettings(): Promise<SiteSettings> {
  return siteSettingsFixture;
}

export async function getProjects(): Promise<Project[]> {
  return byOrder(projectFixtures);
}

/** Tutti i progetti, dal più recente (pagina /progetti). */
export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  return (await getProjects()).map(toSummary);
}

/** "Progetti selezionati" in home: `featured`, ordinati per `order`, al massimo 8. */
export async function getFeaturedProjects(): Promise<ProjectSummary[]> {
  const all = await getProjects();
  return all.filter((p) => p.featured).slice(0, 8).map(toSummary);
}

export async function getHomePage(): Promise<HomePageData> {
  const { carouselSlugs, ...rest } = homePageFixture;
  const all = await getProjects();
  const carousel = carouselSlugs
    .map((slug) => all.find((p) => p.slug === slug))
    .filter((p): p is Project => p !== undefined)
    .map(toSummary);
  return { ...rest, carousel };
}

/** Clienti con `showInLogoStrip = true`. */
export async function getLogoClients(): Promise<LogoClient[]> {
  return logoClientFixtures;
}
