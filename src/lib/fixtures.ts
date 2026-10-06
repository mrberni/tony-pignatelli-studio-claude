/**
 * Dati di prova, usati finché il sito non legge Sanity. Titoli, categorie e settori
 * sono quelli dei mockup; le foto sono segnaposto. Testi di sezione: HANDOFF, Appendice A.
 */
import type { HomePageData, LogoClient, Project, SiteSettings } from './types';

const slugify = (title: string): string =>
  title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');

/** Titoli, categorie e settori dei 63 progetti, nell'ordine dei mockup (1 = più recente). */
const projectRows: ReadonlyArray<readonly [string, Project['category'], Project['sector']]> = [
  ["Nescafé Dolce Gusto - Neo", 'eventi', 'food-beverage'],
  ["Disney - Toy Story 5 - Premiere", 'eventi', 'entertainment'],
  ["World Ducati Week 2026 - Main Stage", 'eventi', 'automotive'],
  ["Starbucks at Home - Pop up activation", 'eventi', 'food-beverage'],
  ["Lego Stadium", 'eventi', 'entertainment'],
  ["Stellantis - Installazione Milano Cortina", 'eventi', 'automotive'],
  ["Disney - Jumpers", 'eventi', 'entertainment'],
  ["YouTube Creator Collective", 'eventi', 'technology'],
  ["On Location Ultimate Hospitality - Interior Design", 'eventi', 'automotive'],
  ["Disney - Avatar Fuoco & Cenere Premiere", 'eventi', 'entertainment'],
  ["Disney+ All's Fair", 'eventi', 'entertainment'],
  ["Disney - Fantastici 4 Premiere", 'eventi', 'entertainment'],
  ["Google Pixel 9 - Summer tour", 'eventi', 'technology'],
  ["Google Pixel 9 Activation", 'eventi', 'technology'],
  ["Xiaomi Note 14 Series Launch", 'eventi', 'technology'],
  ["Honor - Magic 7 Launch", 'eventi', 'technology'],
  ["Disney - Deadpool & Wolverine - Première party", 'eventi', 'entertainment'],
  ["Miele - Milan Design Week", 'eventi', 'technology'],
  ["BMW - XM Launch", 'eventi', 'automotive'],
  ["Lamborghini Revuelto Dynamic Training Event", 'eventi', 'automotive'],
  ["Arena", 'eventi', 'sport'],
  ["Philadelphia", 'eventi', 'food-beverage'],
  ["Mini Big Love Days", 'eventi', 'automotive'],
  ["Sneakerness 2019", 'eventi', 'fashion'],
  ["Disney - Avatar", 'eventi', 'entertainment'],
  ["Disney - Frozen", 'eventi', 'entertainment'],
  ["Pandora Look Factory", 'eventi', 'fashion'],
  ["NYX Mini Corner", 'eventi', 'beauty'],
  ["NYX Halloween", 'eventi', 'beauty'],
  ["FOX Circus", 'eventi', 'entertainment'],
  ["Edison", 'eventi', 'technology'],
  ["Bauli", 'eventi', 'food-beverage'],
  ["Paul & Shark - Cortina", 'vetrine', 'fashion'],
  ["Bialetti Store", 'vetrine', 'retail'],
  ["Gutteridge", 'vetrine', 'fashion'],
  ["Bixio x Paul & Shark", 'vetrine', 'fashion'],
  ["Paul & Shark - Pitti - Firenze", 'vetrine', 'fashion'],
  ["Paul & Shark - Pitti - Venezia", 'vetrine', 'fashion'],
  ["Paul & Shark - Firenze", 'vetrine', 'fashion'],
  ["Vans - The Imaginary Wilderness", 'vetrine', 'fashion'],
  ["Missoni", 'vetrine', 'fashion'],
  ["EICMA - 2018", 'vetrine', 'automotive'],
  ["Le Pandorine", 'vetrine', 'fashion'],
  ["VANS - TNT Advanced Prototype", 'vetrine', 'fashion'],
  ["Ferrari - World's Strongest Brand", 'vetrine', 'automotive'],
  ["Trussardi", 'vetrine', 'fashion'],
  ["Moleskine", 'vetrine', 'retail'],
  ["Ferrari", 'vetrine', 'automotive'],
  ["EICMA - Rinascente", 'vetrine', 'automotive'],
  ["Paul & Shark - Rinascente", 'vetrine', 'fashion'],
  ["MSGM", 'vetrine', 'fashion'],
  ["Rinascente - Food", 'vetrine', 'retail'],
  ["Rinascente Annex", 'vetrine', 'retail'],
  ["Brian & Berry", 'vetrine', 'fashion'],
  ["Estee Lauder", 'vetrine', 'beauty'],
  ["Serapian", 'vetrine', 'fashion'],
  ["Vans - Frida Kahlo", 'vetrine', 'fashion'],
  ["Vans - Harry Potter", 'vetrine', 'fashion'],
  ["Superga", 'set-design', 'fashion'],
  ["Canali", 'set-design', 'fashion'],
  ["IO Donna", 'set-design', 'fashion'],
  ["Maliparmi", 'set-design', 'fashion'],
  ["Nero Giardini", 'set-design', 'fashion'],
];

const FEATURED_TITLES = new Set([
  'Lego Stadium',
  'Google Pixel 9 - Summer tour',
  'Disney - Deadpool & Wolverine - Première party',
  'Miele - Milan Design Week',
  'BMW - XM Launch',
  'Gutteridge',
  'Ferrari',
  'EICMA - Rinascente',
]);

const CAROUSEL_TITLES = [
  'Disney - Toy Story 5 - Premiere',
  'Stellantis - Installazione Milano Cortina',
  'Disney - Avatar Fuoco & Cenere Premiere',
  'Philadelphia',
  'VANS - TNT Advanced Prototype',
];

export const projectFixtures: Project[] = projectRows.map(([title, category, sector], index) => ({
  slug: slugify(title),
  title,
  category,
  sector,
  order: index + 1,
  // Il cliente vero arriva da Sanity: qui un segnaposto ricavato dal titolo.
  client: title.split(' - ')[0] ?? title,
  featured: FEATURED_TITLES.has(title),
  cover: { width: 1600, height: 1200 },
  gallery: [],
  services: [],
}));

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
  carouselSlugs: CAROUSEL_TITLES.map(slugify),
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
