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

export interface LogoClient {
  name: string;
  /** URL del file SVG. Assente = si mostra il nome in testo. */
  logoUrl?: string;
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
