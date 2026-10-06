/**
 * Costruzione dei documenti Sanity (HANDOFF §8.3). Gli `_id` sono deterministici:
 * rilanciare l'importatore non crea duplicati.
 */
import {
  contactPageInitial,
  homePageInitial,
  servicesPageInitial,
  siteSettingsInitial,
  studioPageInitial,
} from '../../studio/schemaTypes/initialContent.ts';
import type { Source, SourceClient, SourceProject } from './source.ts';

export interface SanityDoc {
  _id: string;
  _type: string;
  [field: string]: unknown;
}

export const projectId = (project: Pick<SourceProject, 'slug'>): string => `project-${project.slug}`;

/** Campi che l'importazione scrive; gli altri (testi, foto…) li compila l'editor nello Studio. */
export function projectFields(project: SourceProject): Record<string, unknown> {
  return {
    title: project.title,
    slug: { _type: 'slug', current: project.slug },
    category: project.category,
    sector: project.sector,
    client: { _type: 'reference', _ref: project.clientId },
    ...(project.city ? { city: project.city } : {}),
    order: project.order,
    featured: project.featured,
  };
}

/** Tracciabilità e redirect: sempre aggiornato, anche sui documenti già esistenti. */
export function projectLegacy(project: SourceProject): Record<string, unknown> {
  return { wixUrl: project.wixUrl, wixTitle: project.wixTitle };
}

export function clientFields(client: SourceClient): Record<string, unknown> {
  return {
    name: client.name,
    slug: { _type: 'slug', current: client.slug },
    showInLogoStrip: client.showInLogoStrip,
  };
}

/** Elementi di un array di oggetti con nome: servono `_type` e `_key`. */
function withTypes<T extends { _key: string }>(items: T[], type: string): Array<T & { _type: string }> {
  return items.map((item) => ({ ...item, _type: type }));
}

export function singletonDocuments(source: Source): SanityDoc[] {
  const carousel = source.projects
    .filter((p) => p.carousel)
    .sort((a, b) => a.order - b.order)
    .map((p) => ({ _type: 'reference', _key: `carousel-${p.slug}`.slice(0, 64), _ref: projectId(p) }));

  return [
    {
      _id: 'siteSettings',
      _type: 'siteSettings',
      ...siteSettingsInitial,
      defaultSeo: { _type: 'seo', ...siteSettingsInitial.defaultSeo },
    },
    { _id: 'homePage', _type: 'homePage', ...homePageInitial, carousel },
    {
      _id: 'studioPage',
      _type: 'studioPage',
      ...studioPageInitial,
      method: { ...studioPageInitial.method, steps: withTypes(studioPageInitial.method.steps, 'step') },
    },
    {
      _id: 'servicesPage',
      _type: 'servicesPage',
      ...servicesPageInitial,
      services: withTypes(servicesPageInitial.services, 'service'),
      collaboration: {
        ...servicesPageInitial.collaboration,
        roles: withTypes(servicesPageInitial.collaboration.roles, 'role'),
      },
    },
    { _id: 'contactPage', _type: 'contactPage', ...contactPageInitial },
  ];
}
