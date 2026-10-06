/**
 * Unico punto di accesso ai contenuti. Per ora legge i dati di prova (`fixtures.ts`);
 * quando arrivano le query Sanity cambia solo questo file, non le pagine.
 */
import {
  clientLogoUrls,
  contactPageFixture,
  homePageFixture,
  logoClientFixtures,
  projectFixtures,
  servicesPageFixture,
  siteSettingsFixture,
  studioPageFixture,
} from './fixtures';
import type {
  ContactPageData,
  HomePageData,
  LogoClient,
  Project,
  ProjectSummary,
  ServicesPageData,
  SiteSettings,
  StudioPageData,
} from './types';

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

/**
 * Precedente / successivo in ordine di recenza: "Precedente" ha `order` immediatamente
 * inferiore (più recente), "Successivo" immediatamente superiore. Nessun ciclo: al primo
 * e all'ultimo progetto manca un lato.
 */
export async function getNeighbors(
  project: Project,
): Promise<{ previous?: ProjectSummary; next?: ProjectSummary }> {
  const all = await getProjects(); // già ordinati per `order`
  const i = all.findIndex((p) => p.slug === project.slug);
  const previous = i > 0 ? all[i - 1] : undefined;
  const next = i >= 0 && i < all.length - 1 ? all[i + 1] : undefined;
  return {
    ...(previous ? { previous: toSummary(previous) } : {}),
    ...(next ? { next: toSummary(next) } : {}),
  };
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

export async function getServicesPage(): Promise<ServicesPageData> {
  return servicesPageFixture;
}

export async function getStudioPage(): Promise<StudioPageData> {
  return studioPageFixture;
}

/** Elenco "Clienti" della pagina Studio: logo dove esiste l'SVG, altrimenti il nome in testo. */
export async function getStudioClients(names: string[]): Promise<LogoClient[]> {
  return names.map((name) => {
    const logoUrl = clientLogoUrls[name];
    return logoUrl ? { name, logoUrl } : { name };
  });
}

export async function getContactPage(): Promise<ContactPageData> {
  return contactPageFixture;
}
