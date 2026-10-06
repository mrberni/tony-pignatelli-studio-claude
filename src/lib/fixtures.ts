/**
 * Dati di prova, usati finché il sito non legge Sanity. Titoli, categorie e settori
 * sono quelli dei mockup; le foto sono segnaposto. Testi di sezione: HANDOFF, Appendice A.
 */
import type { HomePageData, LogoClient, Project, SiteSettings } from './types';

const placeholder = (width = 1600, height = 1200) => ({ width, height });

const project = (
  order: number,
  title: string,
  category: Project['category'],
  sector: Project['sector'],
  client: string,
  featured: boolean,
): Project => ({
  slug: title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-'),
  title,
  category,
  sector,
  order,
  client,
  featured,
  cover: placeholder(),
  gallery: [],
  services: [],
});

export const projectFixtures: Project[] = [
  project(1, 'Disney - Toy Story 5 - Premiere', 'eventi', 'entertainment', 'Disney', false),
  project(2, 'Stellantis - Installazione Milano Cortina', 'eventi', 'automotive', 'Stellantis', false),
  project(3, 'Disney - Avatar Fuoco & Cenere Premiere', 'eventi', 'entertainment', 'Disney', false),
  project(4, 'Philadelphia', 'eventi', 'food-beverage', 'Philadelphia', false),
  project(5, 'VANS - TNT Advanced Prototype', 'vetrine', 'fashion', 'Vans', false),
  project(6, 'Lego Stadium', 'eventi', 'entertainment', 'LEGO', true),
  project(7, 'Google Pixel 9 - Summer tour', 'eventi', 'technology', 'Google', true),
  project(8, 'Disney - Deadpool & Wolverine - Première party', 'eventi', 'entertainment', 'Disney', true),
  project(9, 'Miele - Milan Design Week', 'eventi', 'technology', 'Miele', true),
  project(10, 'BMW - XM Launch', 'eventi', 'automotive', 'BMW', true),
  project(11, 'Gutteridge', 'vetrine', 'fashion', 'Gutteridge', true),
  project(12, 'Ferrari', 'vetrine', 'automotive', 'Ferrari', true),
  project(13, 'EICMA - Rinascente', 'vetrine', 'automotive', 'Rinascente', true),
];

export const siteSettingsFixture: SiteSettings = {
  studioName: 'Tony Pignatelli Studio',
  email: 'tony@tonypignatellistudio.com',
  phone: '+39 339 469 5709',
  address: 'Via Ludovico Ariosto, 123 — 20099 Sesto San Giovanni (MI)',
  instagramUrl: 'https://instagram.com/tonypignatellistudio/',
  linkedinUrl: 'https://www.linkedin.com/in/tony-pignatelli-studio-27238436/',
  projectCtaQuestion: 'Hai in mente un progetto simile?',
  defaultSeo: {
    title: 'Tony Pignatelli Studio | Scenografia, allestimenti e set design a Milano',
    description:
      'Studio di scenografia e set design a Milano. Eventi, pop-up, vetrine e set per brand e agenzie in tutta Italia.',
  },
};

export const homePageFixture: Omit<HomePageData, 'carousel'> & { carouselSlugs: string[] } = {
  carouselSlugs: projectFixtures.slice(0, 5).map((p) => p.slug),
  studioSection: {
    title: 'Progettiamo spazi che rendono visibile una visione.',
    text: "Tony Pignatelli Studio è uno studio indipendente di set design, scenografia e progettazione degli spazi. Lavoriamo a partire da un'idea, da un brief o da una direzione creativa per trasformarla in uno spazio concreto, coerente e riconoscibile.",
  },
  servicesSection: {
    title: 'Dal concept alla realizzazione.',
    text: 'Concept design, set design e scenografia per eventi, brand experience, allestimenti e progetti speciali.',
  },
  ctaQuestion: 'Qual è lo spazio che vuoi raccontare?',
};

export const logoClientFixtures: LogoClient[] = [
  'BMW',
  'Disney',
  'Ferrari',
  'Google',
  'Lamborghini',
  'LEGO',
  'Miele',
  'Missoni',
  'Moleskine',
  'Rinascente',
  'Vans',
  'Xiaomi',
].map((name) => ({ name }));
