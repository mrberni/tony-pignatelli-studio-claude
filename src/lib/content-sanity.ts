/** Sorgente Sanity: query GROQ al momento del build (documenti pubblicati). */
import { fetchText, query, sanityDataset } from './sanity';
import { ratioFromSvg } from './logo-size';
import { byOrder, toSummary } from './project-utils';
import type {
  CategoryValue,
  ContactPageData,
  HomePageData,
  LogoClient,
  PhotoData,
  Project,
  ProjectSummary,
  SectorValue,
  ServicesPageData,
  SiteSettings,
  StudioPageData,
} from './types';

/** Proporzione di riserva per i progetti senza foto: si mostra il segnaposto. */
const PLACEHOLDER = { width: 1600, height: 1200 } as const;

/** Proiezione GROQ di un'immagine: URL, dimensioni vere, colore dominante, punto focale. */
const IMAGE = `{
  alt,
  "focal": hotspot{x, y},
  "src": asset->url,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height,
  "bg": asset->metadata.palette.dominant.background
}`;

interface RawImage {
  alt?: string | null;
  focal?: { x: number; y: number } | null;
  src?: string | null;
  width?: number | null;
  height?: number | null;
  bg?: string | null;
}

function toPhoto(raw: RawImage | null | undefined, fallbackAlt?: string): PhotoData {
  const alt = raw?.alt?.trim() || fallbackAlt;
  return {
    width: raw?.width ?? PLACEHOLDER.width,
    height: raw?.height ?? PLACEHOLDER.height,
    ...(raw?.src ? { src: raw.src } : {}),
    ...(alt ? { alt } : {}),
    ...(raw?.focal ? { focal: raw.focal } : {}),
    ...(raw?.bg ? { bg: raw.bg } : {}),
  };
}

/** Un documento unico (singleton): se manca, il build si ferma con un messaggio chiaro. */
async function singleton<T>(id: string, projection: string): Promise<T> {
  const doc = await query<T | null>(`*[_id == $id][0]${projection}`, { id });
  if (!doc) {
    throw new Error(
      `Documento "${id}" non trovato nel dataset "${sanityDataset}". Esegui l'importazione (pnpm import:run) o crealo nello Studio.`,
    );
  }
  return doc;
}

const text = (value: string | null | undefined): string => value ?? '';
const seoOf = (
  seo: { title?: string | null; description?: string | null } | null | undefined,
): { seo?: { title?: string; description?: string } } => {
  const title = seo?.title?.trim();
  const description = seo?.description?.trim();
  return title || description
    ? { seo: { ...(title ? { title } : {}), ...(description ? { description } : {}) } }
    : {};
};

// --- Impostazioni del sito

interface RawSiteSettings {
  studioName?: string;
  email?: string;
  phone?: string;
  address?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  projectCtaQuestion?: string;
  defaultSeo?: { title?: string; description?: string };
}

let settingsPromise: Promise<SiteSettings> | undefined;
export function getSiteSettings(): Promise<SiteSettings> {
  settingsPromise ??= singleton<RawSiteSettings>('siteSettings', '').then((raw) => ({
    studioName: text(raw.studioName),
    email: text(raw.email),
    phone: text(raw.phone),
    address: text(raw.address),
    instagramUrl: text(raw.instagramUrl),
    linkedinUrl: text(raw.linkedinUrl),
    projectCtaQuestion: text(raw.projectCtaQuestion),
    defaultSeo: { title: text(raw.defaultSeo?.title), description: text(raw.defaultSeo?.description) },
  }));
  return settingsPromise;
}

// --- Progetti

interface RawProject {
  slug: string;
  title: string;
  category: CategoryValue;
  sector: SectorValue;
  order: number;
  featured?: boolean | null;
  city?: string | null;
  intro?: string | null;
  description?: string | null;
  services?: string[] | null;
  client?: string | null;
  seo?: { title?: string | null; description?: string | null; imageUrl?: string | null } | null;
  cover?: RawImage | null;
  gallery?: RawImage[] | null;
}

const PROJECT_FIELDS = `{
  "slug": slug.current, title, category, sector, order, featured, city, intro, description, services,
  "client": client->name,
  seo{title, description, "imageUrl": image.asset->url},
  "cover": coverImage ${IMAGE},
  "gallery": gallery[] ${IMAGE}
}`;

function toProject(raw: RawProject): Project {
  const imageUrl = raw.seo?.imageUrl?.trim();
  const seo = seoOf(raw.seo).seo;
  return {
    slug: raw.slug,
    title: raw.title,
    category: raw.category,
    sector: raw.sector,
    order: raw.order,
    client: text(raw.client),
    featured: raw.featured === true,
    cover: toPhoto(raw.cover, raw.title),
    gallery: (raw.gallery ?? []).filter((image) => image?.src).map((image) => toPhoto(image, raw.title)),
    services: raw.services ?? [],
    ...(raw.city ? { city: raw.city } : {}),
    ...(raw.intro ? { intro: raw.intro } : {}),
    ...(raw.description ? { description: raw.description } : {}),
    ...(seo || imageUrl ? { seo: { ...seo, ...(imageUrl ? { imageUrl } : {}) } } : {}),
  };
}

let projectsPromise: Promise<Project[]> | undefined;
/** Una sola query per build, condivisa da tutte le pagine. */
export function getProjects(): Promise<Project[]> {
  projectsPromise ??= query<RawProject[]>(`*[_type == "project" && defined(slug.current)] | order(order asc) ${PROJECT_FIELDS}`)
    .then((rows) => byOrder(rows.map(toProject)));
  return projectsPromise;
}

// --- Home

interface RawHome {
  studioSection?: { title?: string; text?: string };
  servicesSection?: { title?: string; text?: string };
  ctaQuestion?: string;
  carousel?: Array<Omit<RawProject, 'gallery'> | null> | null;
}

export async function getHomePage(): Promise<HomePageData> {
  const raw = await singleton<RawHome>(
    'homePage',
    `{
      studioSection, servicesSection, ctaQuestion,
      "carousel": carousel[]->{
        "slug": slug.current, title, category, sector, order, "cover": coverImage ${IMAGE}
      }
    }`,
  );
  const carousel: ProjectSummary[] = (raw.carousel ?? [])
    .filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined)
    .map((p) => toSummary(toProject({ ...p, gallery: [] })));
  return {
    carousel,
    studioSection: { title: text(raw.studioSection?.title), text: text(raw.studioSection?.text) },
    servicesSection: { title: text(raw.servicesSection?.title), text: text(raw.servicesSection?.text) },
    ctaQuestion: text(raw.ctaQuestion),
  };
}

// --- Clienti con logo

const ratioCache = new Map<string, Promise<number | undefined>>();
/** Proporzione del logo letta dal `viewBox` dell'SVG (una sola richiesta per file e per build). */
function logoRatio(url: string): Promise<number | undefined> {
  let ratio = ratioCache.get(url);
  if (!ratio) {
    ratio = fetchText(url).then(ratioFromSvg, () => undefined);
    ratioCache.set(url, ratio);
  }
  return ratio;
}

async function toLogoClient(row: { name: string; logoUrl?: string | null }): Promise<LogoClient> {
  if (!row.logoUrl) return { name: row.name };
  const ratio = await logoRatio(row.logoUrl);
  return { name: row.name, logoUrl: row.logoUrl, ...(ratio ? { logoRatio: ratio } : {}) };
}

/** Clienti con `showInLogoStrip = true`, in ordine alfabetico (senza distinguere maiuscole). */
export async function getLogoClients(): Promise<LogoClient[]> {
  const rows = await query<Array<{ name: string; logoUrl?: string | null }>>(
    `*[_type == "client" && showInLogoStrip == true] | order(lower(name) asc){ name, "logoUrl": logo.asset->url }`,
  );
  return Promise.all(rows.map(toLogoClient));
}

const normalize = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Elenco "Clienti" della pagina Studio: logo dove esiste l'SVG, altrimenti il nome in testo. */
export async function getStudioClients(names: string[]): Promise<LogoClient[]> {
  const withLogo = await query<Array<{ name: string; logoUrl: string }>>(
    `*[_type == "client" && defined(logo.asset)]{ name, "logoUrl": logo.asset->url }`,
  );
  const logoByName = new Map(withLogo.map((row) => [normalize(row.name), row.logoUrl]));
  return Promise.all(names.map((name) => toLogoClient({ name, logoUrl: logoByName.get(normalize(name)) ?? null })));
}

// --- Studio, Servizi, Contatti

interface RawStudio {
  intro?: { text1?: string; text2?: string; photo?: RawImage | null };
  experience?: { lead?: string; text?: string };
  clientNames?: string[];
  brandToSpace?: { lead?: string; text2?: string; text3?: string };
  method?: { intro?: string; steps?: Array<{ title?: string; description?: string }> };
  ctaQuestion?: string;
  seo?: { title?: string; description?: string };
}

export async function getStudioPage(): Promise<StudioPageData> {
  const raw = await singleton<RawStudio>(
    'studioPage',
    `{
      intro{text1, text2, "photo": photo ${IMAGE}},
      experience, clientNames, brandToSpace,
      method{intro, steps[]{title, description}},
      ctaQuestion, seo{title, description}
    }`,
  );
  const photo = raw.intro?.photo?.src ? toPhoto(raw.intro.photo, 'Tony Pignatelli Studio') : undefined;
  return {
    intro: {
      text1: text(raw.intro?.text1),
      text2: text(raw.intro?.text2),
      ...(photo ? { photo } : {}),
    },
    experience: { lead: text(raw.experience?.lead), text: text(raw.experience?.text) },
    clientNames: raw.clientNames ?? [],
    brandToSpace: {
      lead: text(raw.brandToSpace?.lead),
      text2: text(raw.brandToSpace?.text2),
      text3: text(raw.brandToSpace?.text3),
    },
    method: {
      intro: text(raw.method?.intro),
      steps: (raw.method?.steps ?? []).map((s) => ({ title: text(s.title), description: text(s.description) })),
    },
    ctaQuestion: text(raw.ctaQuestion),
    ...seoOf(raw.seo),
  };
}

interface RawServices {
  intro?: string;
  services?: Array<{ title?: string; description?: string }>;
  collaboration?: { title?: string; intro?: string; roles?: Array<{ title?: string; description?: string }> };
  ctaQuestion?: string;
  seo?: { title?: string; description?: string };
}

export async function getServicesPage(): Promise<ServicesPageData> {
  const raw = await singleton<RawServices>(
    'servicesPage',
    `{
      intro, services[]{title, description},
      collaboration{title, intro, roles[]{title, description}},
      ctaQuestion, seo{title, description}
    }`,
  );
  const item = (i: { title?: string; description?: string }) => ({ title: text(i.title), description: text(i.description) });
  return {
    intro: text(raw.intro),
    services: (raw.services ?? []).map(item),
    collaboration: {
      title: text(raw.collaboration?.title),
      intro: text(raw.collaboration?.intro),
      roles: (raw.collaboration?.roles ?? []).map(item),
    },
    ctaQuestion: text(raw.ctaQuestion),
    ...seoOf(raw.seo),
  };
}

interface RawContact {
  intro?: string;
  formTitle?: string;
  privacyNote?: string;
  seo?: { title?: string; description?: string };
}

export async function getContactPage(): Promise<ContactPageData> {
  const raw = await singleton<RawContact>('contactPage', '{ intro, formTitle, privacyNote, seo{title, description} }');
  return {
    intro: text(raw.intro),
    formTitle: text(raw.formTitle),
    privacyNote: text(raw.privacyNote),
    ...seoOf(raw.seo),
  };
}

/** Immagine di condivisione di riserva: quella delle Impostazioni, altrimenti la prima del carousel. */
export async function getDefaultOgImage(): Promise<string | undefined> {
  const fromSettings = await query<string | null>(
    `*[_id == "siteSettings"][0].defaultSeo.image.asset->url`,
  );
  if (fromSettings) return fromSettings;
  const home = await getHomePage();
  return home.carousel[0]?.cover.src;
}
