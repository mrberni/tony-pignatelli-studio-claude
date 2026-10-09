export type CategoryValue = 'eventi' | 'vetrine' | 'set-design';

export type SectorValue =
  | 'automotive'
  | 'fashion'
  | 'beauty'
  | 'food-beverage'
  | 'technology'
  | 'entertainment'
  | 'retail'
  | 'sport';

/** Punto focale (hotspot di Sanity), coordinate da 0 a 1. */
export interface FocalPoint {
  x: number;
  y: number;
}

export interface PhotoData {
  /** URL dell'asset (CDN di Sanity). Assente = segnaposto. */
  src?: string;
  width: number;
  height: number;
  alt?: string;
  focal?: FocalPoint;
  /** Colore dominante, usato come sfondo di attesa. */
  bg?: string;
}

/** Dati minimi per schede, carousel e navigazione precedente/successivo. */
export interface ProjectSummary {
  slug: string;
  title: string;
  category: CategoryValue;
  sector: SectorValue;
  order: number;
  cover: PhotoData;
}

export interface Project extends ProjectSummary {
  client: string;
  city?: string;
  featured: boolean;
  gallery: PhotoData[];
  intro?: string;
  description?: string;
  services: string[];
  seo?: { title?: string; description?: string; imageUrl?: string };
}

/** Un nome della lista clienti (striscia della home, elenco dello Studio). */
export interface ClientEntry {
  name: string;
}

export interface SiteSettings {
  studioName: string;
  email: string;
  phone: string;
  address: string;
  instagramUrl: string;
  linkedinUrl: string;
  projectCtaQuestion: string;
  defaultSeo: { title: string; description: string };
}

export interface TitledText {
  title: string;
  text: string;
}

export interface HomePageData {
  carousel: ProjectSummary[];
  studioSection: TitledText;
  servicesSection: TitledText;
  ctaQuestion: string;
}

export interface TitledItem {
  title: string;
  description: string;
}

export interface ServicesPageData {
  /** Titolo grande in cima alla pagina (`<h1>`). */
  intro: string;
  /** Il numero (01, 02…) è automatico e segue l'ordine. */
  services: TitledItem[];
  collaboration: { title: string; intro: string; roles: TitledItem[] };
  ctaQuestion: string;
  seo?: { title?: string; description?: string };
}

export interface StudioPageData {
  intro: { text1: string; text2: string; photo?: PhotoData };
  experience: { lead: string; text: string };
  /** Elenco "Clienti" della pagina: contenuto separato dai clienti collegati ai progetti. */
  clientNames: string[];
  brandToSpace: { lead: string; text2: string; text3: string };
  method: { intro: string; steps: Array<{ title: string; description: string }> };
  ctaQuestion: string;
  seo?: { title?: string; description?: string };
}

export interface ContactPageData {
  intro: string;
  formTitle: string;
  privacyNote: string;
  seo?: { title?: string; description?: string };
}
