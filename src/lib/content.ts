/**
 * Unico punto di accesso ai contenuti per le pagine.
 *
 * - Con `SANITY_DATASET` impostato (anteprime → `staging`, produzione → `production`) i
 *   contenuti vengono letti da Sanity al momento del build.
 * - Senza, si usano i dati di prova (`fixtures.ts`): così `pnpm dev` e `pnpm build` funzionano
 *   anche senza configurazione, e `main` resta com'è finché il dataset di produzione non è pronto.
 */
import * as fixtures from './content-fixtures';
import * as sanity from './content-sanity';
import { isSanityConfigured } from './sanity';
import { toSummary } from './project-utils';
import type { Project, ProjectSummary } from './types';

const source: typeof fixtures = isSanityConfigured ? sanity : fixtures;

export const getSiteSettings = source.getSiteSettings;
export const getProjects = source.getProjects;
export const getHomePage = source.getHomePage;
export const getLogoClients = source.getLogoClients;
export const getStudioPage = source.getStudioPage;
export const getStudioClients = source.getStudioClients;
export const getServicesPage = source.getServicesPage;
export const getContactPage = source.getContactPage;
export { toSummary };

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
