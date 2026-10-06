/**
 * Lettura dei dati sorgente (HANDOFF §8): il foglio Excel è la fonte di verità per titolo,
 * settore, città, cliente, in evidenza, carousel, ordine, URL Wix e file dei loghi; gli export
 * CSV di Wix servono solo per il titolo originale e (Fase 4) per le immagini.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { slugify } from '../../studio/lib/slugify.ts';
import { readCsv, type CsvRow } from './csv.ts';
import { readWorkbook, type Row } from './xlsx.ts';

export const ROOT = join(import.meta.dirname, '..', '..');
const DATA = join(ROOT, 'data');
const LOGOS = join(DATA, 'logos');

export const CATEGORY_BY_SHEET: Record<string, string> = {
  Eventi: 'eventi',
  Vetrine: 'vetrine',
  'Set Design': 'set-design',
};

export const SECTOR_BY_SHEET: Record<string, string> = {
  Automotive: 'automotive',
  Fashion: 'fashion',
  Beauty: 'beauty',
  'Food & beverage': 'food-beverage',
  Technology: 'technology',
  Entertainment: 'entertainment',
  Retail: 'retail',
  Sport: 'sport',
};

/** Numeri attesi dall'HANDOFF (§8.5.3): servono a controllare che il foglio sia quello giusto. */
export const EXPECTED = {
  projects: 63,
  perCategory: { eventi: 32, vetrine: 26, 'set-design': 5 },
  clients: 45,
  featured: 8,
  carousel: 5,
  logoStrip: 12,
} as const;

export interface SourceProject {
  sheetId: string;
  title: string;
  slug: string;
  category: string;
  sector: string;
  city: string;
  featured: boolean;
  carousel: boolean;
  order: number;
  clientName: string;
  clientId: string;
  photoCount: number;
  wixUrl: string;
  wixTitle: string;
  /** Riga corrispondente nell'export CSV di Wix (per la Fase 4: immagini). */
  wixRow: CsvRow | undefined;
}

export interface SourceClient {
  name: string;
  slug: string;
  id: string;
  logoFile: string;
  logoPath: string | undefined;
  showInLogoStrip: boolean;
}

export interface Source {
  projects: SourceProject[];
  clients: SourceClient[];
  /** Errori: l'importazione non parte. */
  errors: string[];
  /** Avvisi e note informative: l'importazione parte comunque. */
  warnings: string[];
}

const isYes = (value: string): boolean => value.trim().toLowerCase().startsWith('s');
const SAMPLE_MARKER = /^esempio di riga compilata/i;

/** Righe utili di un foglio: si ferma alla riga "Esempio di riga compilata (da non importare)". */
function usableRows(rows: Row[], firstColumn: string): Row[] {
  const end = rows.findIndex((row) => SAMPLE_MARKER.test(row[firstColumn] ?? ''));
  return end < 0 ? rows : rows.slice(0, end);
}

function uniqueSlugs(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    const base = slugify(name) || 'senza-titolo';
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base.slice(0, 80 - String(n).length - 1)}-${n}`;
    used.add(slug);
    return slug;
  });
}

export function loadSource(): Source {
  const errors: string[] = [];
  const warnings: string[] = [];
  const workbook = readWorkbook(join(DATA, 'tony-pignatelli-progetti_v5.xlsx'));

  const projectRows = usableRows(workbook.rows('Progetti'), 'ID');
  const clientRows = usableRows(workbook.rows('Clienti'), 'Cliente');

  // --- Clienti
  const clientSlugs = uniqueSlugs(clientRows.map((r) => r['Cliente'] ?? ''));
  const clients: SourceClient[] = clientRows.map((row, i) => {
    const slug = clientSlugs[i] ?? '';
    const logoFile = (row['Logo (file SVG)'] ?? '').trim();
    const candidate = logoFile ? join(LOGOS, logoFile) : undefined;
    return {
      name: (row['Cliente'] ?? '').trim(),
      slug,
      id: `client-${slug}`,
      logoFile,
      logoPath: candidate && existsSync(candidate) ? candidate : undefined,
      showInLogoStrip: isYes(row['Mostra nella striscia loghi'] ?? ''),
    };
  });
  const clientByName = new Map(clients.map((c) => [c.name, c]));

  // --- Export CSV di Wix, indicizzati per URL (colonna "... (Item)")
  const wixByUrl = new Map<string, CsvRow>();
  for (const [file, column] of [
    ['Eventi.csv', 'Eventi (Item)'],
    ['Vetrine.csv', 'Vetrine (Item)'],
    ['Set_Design.csv', 'Set Design (Item)'],
  ] as const) {
    for (const row of readCsv(join(DATA, 'wix-export', file))) {
      const url = (row[column] ?? '').trim();
      if (url) wixByUrl.set(url, row);
    }
  }

  // --- Progetti
  const projectSlugs = uniqueSlugs(projectRows.map((r) => (r['Titolo progetto'] ?? '').trim()));
  const projects: SourceProject[] = projectRows.map((row, i) => {
    const title = (row['Titolo progetto'] ?? '').trim();
    const where = `Progetto "${title || `riga ${i + 1}`}"`;
    const category = CATEGORY_BY_SHEET[(row['Categoria'] ?? '').trim()];
    const sector = SECTOR_BY_SHEET[(row['Settore'] ?? '').trim()];
    if (!category) errors.push(`${where}: categoria non valida "${row['Categoria'] ?? ''}"`);
    if (!sector) errors.push(`${where}: settore non valido "${row['Settore'] ?? ''}"`);

    const clientName = (row['Cliente (solo pagina progetto)'] ?? '').trim();
    const client = clientByName.get(clientName);
    if (!client) errors.push(`${where}: cliente "${clientName}" assente dal foglio Clienti`);

    const wixUrl = (row['URL attuale Wix'] ?? '').trim();
    const wixRow = wixByUrl.get(wixUrl);
    if (!wixRow) errors.push(`${where}: URL Wix "${wixUrl}" non trovato negli export CSV`);

    const rawOrder = (row['Ordine'] ?? '').trim();
    const order = Number(rawOrder);
    if (!/^\d+$/.test(rawOrder) || order < 1) errors.push(`${where}: ordine non valido "${rawOrder}"`);

    return {
      sheetId: (row['ID'] ?? '').trim(),
      title,
      slug: projectSlugs[i] ?? '',
      category: category ?? '',
      sector: sector ?? '',
      city: (row['Città'] ?? '').trim(),
      featured: isYes(row['In evidenza'] ?? ''),
      carousel: isYes(row['Carousel home'] ?? ''),
      order,
      clientName,
      clientId: client?.id ?? '',
      photoCount: Number(row['N. foto (Wix)'] ?? '') || 0,
      wixUrl,
      wixTitle: (wixRow?.['Title'] ?? '').trim(),
      wixRow,
    };
  });

  // --- Controlli di coerenza del foglio
  const dup = <T>(values: T[]): T[] => values.filter((v, i) => values.indexOf(v) !== i);
  for (const title of dup(projects.map((p) => p.title))) errors.push(`Titolo duplicato: "${title}"`);
  for (const order of dup(projects.map((p) => p.order))) errors.push(`Ordine duplicato: ${order}`);
  for (const url of dup(projects.map((p) => p.wixUrl))) errors.push(`URL Wix duplicato: ${url}`);
  for (const name of dup(clients.map((c) => c.name))) errors.push(`Cliente duplicato: "${name}"`);

  const count = (n: number, expected: number, label: string): void => {
    if (n !== expected) errors.push(`${label}: nel foglio ${n}, attesi ${expected} (HANDOFF §8.5)`);
  };
  count(projects.length, EXPECTED.projects, 'Progetti');
  for (const [category, expected] of Object.entries(EXPECTED.perCategory)) {
    count(projects.filter((p) => p.category === category).length, expected, `Progetti ${category}`);
  }
  count(clients.length, EXPECTED.clients, 'Clienti');
  count(projects.filter((p) => p.featured).length, EXPECTED.featured, 'Progetti in evidenza');
  count(projects.filter((p) => p.carousel).length, EXPECTED.carousel, 'Progetti nel carousel');
  count(clients.filter((c) => c.showInLogoStrip).length, EXPECTED.logoStrip, 'Clienti nella striscia loghi');

  const orders = projects.map((p) => p.order).sort((a, b) => a - b);
  if (orders.some((order, i) => order !== i + 1)) errors.push('Ordine: non è la sequenza continua da 1 a ' + projects.length);

  const unused = clients.filter((c) => !projects.some((p) => p.clientId === c.id));
  for (const client of unused) warnings.push(`Cliente "${client.name}" senza progetti`);

  // --- Note per l'utente (HANDOFF §13.11 e §8.5.4)
  for (const name of ['FOX', 'Brian & Berry', 'Bixio x Paul & Shark']) {
    if (clientByName.has(name)) warnings.push(`Nome da verificare (§13.11): "${name}"`);
  }

  return { projects, clients, errors, warnings };
}
