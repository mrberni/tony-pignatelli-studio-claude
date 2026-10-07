/**
 * Redirect 301 dal vecchio sito Wix (HANDOFF §9.1) → `public/_redirects`.
 *
 *   pnpm redirects          genera `public/_redirects` (e controlla la copertura)
 *   pnpm redirects:check    dopo `pnpm build`: ogni destinazione deve esistere in `dist/`
 *
 * Sintassi e limiti verificati su developers.cloudflare.com/workers/static-assets/redirects:
 * `[origine] [destinazione] [codice]`, query string ammesse nella destinazione, al massimo
 * 2.000 redirect statici e 100 dinamici (con `*`), prima i statici.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadSource, ROOT } from './lib/source.ts';

/** Pagine principali di Wix → nuove pagine. */
const MAIN_PAGES: Array<[string, string]> = [
  ['/work', '/progetti'],
  ['/copia-di-work', '/progetti'],
  ['/about', '/studio'],
  ['/what-we-do', '/servizi'],
  ['/contact', '/contatti'],
  ['/eventi', '/progetti?categoria=eventi'],
  ['/vetrine', '/progetti?categoria=vetrine'],
  ['/set-design', '/progetti?categoria=set-design'],
];

/**
 * Pagine singole rimaste su Wix fuori dalle collezioni (vecchie pagine di progetto).
 * Destinazione = progetto corrispondente per titolo e contenuto della pagina; se non c'è una
 * corrispondenza sicura, l'elenco della categoria. `sicuro: false` = da confermare con l'utente.
 */
const LEGACY_PAGES: Array<{ from: string; to: string; nota: string; sicuro: boolean }> = [
  { from: '/moleskine-elefante', to: '/progetti/moleskine', nota: 'vetrina Moleskine, Rinascente Milano', sicuro: true },
  { from: '/missoni', to: '/progetti/missoni', nota: 'vetrina Missoni, Rinascente Milano', sicuro: true },
  { from: '/eicma', to: '/progetti/eicma-2018', nota: 'pagina "EICMA 2018"', sicuro: true },
  { from: '/eicma-1', to: '/progetti?categoria=vetrine', nota: 'pagina "EICMA 2019 / window design": nessun progetto 2019 nel foglio', sicuro: false },
  { from: '/ferrari', to: '/progetti/ferrari', nota: 'pagina "FERRARI" (esistono anche "Ferrari - World\'s Strongest Brand")', sicuro: false },
  { from: '/flussimaterici', to: '/progetti?categoria=vetrine', nota: '"Ferrari Flussi Materici": nessun progetto con questo nome nel foglio', sicuro: false },
  { from: '/fox', to: '/progetti/fox-circus', nota: 'pagina "FOX"', sicuro: true },
  { from: '/gazzetta', to: '/progetti/rinascente-food', nota: 'pagina "FOOD RINASCENTE"', sicuro: true },
  { from: '/le-pandorine', to: '/progetti/le-pandorine', nota: 'pagina "LE PANDORINE"', sicuro: true },
  { from: '/nyx-halloween', to: '/progetti/nyx-halloween', nota: 'pagina "NYX professional makeup"', sicuro: true },
  { from: '/paul-shark', to: '/progetti?categoria=vetrine', nota: 'vetrine Paul & Shark: nel foglio ce ne sono 7', sicuro: false },
  { from: '/rinascente-natale', to: '/progetti/disney-frozen', nota: 'contenuto "FROZEN / exhibitions design"', sicuro: false },
  { from: '/sneak-1', to: '/progetti/sneakerness-2019', nota: 'pagina "SNEAKERNESS"', sicuro: true },
  { from: '/vans-box', to: '/progetti?categoria=vetrine', nota: 'vetrina Vans: nel foglio ce ne sono 5', sicuro: false },
  { from: '/yoox', to: '/progetti/superga', nota: 'la pagina si chiama /yoox ma il contenuto è "SUPERGA / set design"', sicuro: false },
];

/** Fallback: un vecchio indirizzo di progetto che non conosciamo porta all'elenco della categoria. */
const CATEGORY_FALLBACKS: Array<[string, string]> = [
  ['/eventi/*', '/progetti?categoria=eventi'],
  ['/vetrine/*', '/progetti?categoria=vetrine'],
  ['/set-design/*', '/progetti?categoria=set-design'],
];

interface WixSitemap {
  progetti: string[];
  pagine: string[];
}

const wix = JSON.parse(readFileSync(join(ROOT, 'data', 'wix-sitemap.json'), 'utf8')) as WixSitemap;
const decode = (path: string): string => {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
};

/** Forme con cui un browser può richiedere lo stesso percorso (grezza, `encodeURI`, per segmento). */
function variants(path: string): string[] {
  const forms = [path, encodeURI(path), path.split('/').map(encodeURIComponent).join('/')];
  return [...new Set(forms)];
}

function build(): { text: string; problems: string[]; notes: string[]; counts: Record<string, number> } {
  const source = loadSource();
  const problems: string[] = [...source.errors];
  const notes: string[] = [];

  // 1. Il foglio e la sitemap di Wix devono contenere gli stessi indirizzi di progetto
  const sheetUrls = new Set(source.projects.map((p) => decode(p.wixUrl)));
  const sitemapUrls = new Set(wix.progetti.map(decode));
  for (const url of sitemapUrls) if (!sheetUrls.has(url)) problems.push(`In sitemap Wix ma non nel foglio: ${url}`);
  for (const url of sheetUrls) if (!sitemapUrls.has(url)) problems.push(`Nel foglio ma non nella sitemap Wix: ${url}`);

  // 2. Tutte le pagine della sitemap devono avere una regola (o essere la home)
  const covered = new Set([...MAIN_PAGES.map(([from]) => from), ...LEGACY_PAGES.map((p) => p.from), '/']);
  for (const page of wix.pagine) if (!covered.has(page)) problems.push(`Pagina Wix senza redirect: ${page}`);

  const lines: string[] = [
    '# Generato da `pnpm redirects` (scripts/generate-redirects.ts): non modificare a mano.',
    '# Redirect 301 dal vecchio sito Wix. Fonte degli indirizzi: data/wix-sitemap.json e foglio progetti.',
    '',
    '# Pagine principali',
  ];
  for (const [from, to] of MAIN_PAGES) lines.push(`${from} ${to} 301`);

  lines.push('', '# Vecchie pagine singole di Wix');
  for (const page of LEGACY_PAGES) {
    lines.push(`${page.from} ${page.to} 301`);
    if (!page.sicuro) notes.push(`${page.from} → ${page.to}  (${page.nota})`);
  }

  lines.push('', '# Progetti: 63 indirizzi del foglio');
  const seen = new Set<string>();
  let progetti = 0;
  for (const project of [...source.projects].sort((a, b) => a.order - b.order)) {
    const target = `/progetti/${project.slug}`;
    for (const form of variants(decode(project.wixUrl))) {
      if (seen.has(form)) continue;
      seen.add(form);
      lines.push(`${form} ${target} 301`);
      progetti++;
    }
  }

  // I redirect dinamici (con *) vanno in fondo, dopo tutti gli statici
  lines.push('', '# Fallback per vecchi indirizzi di progetto non elencati');
  for (const [from, to] of CATEGORY_FALLBACKS) lines.push(`${from} ${to} 301`);

  const staticCount = lines.filter((l) => /^\/\S+ \S+ \d{3}$/.test(l) && !l.includes('*')).length;
  const dynamicCount = CATEGORY_FALLBACKS.length;
  if (staticCount > 2000) problems.push(`Troppi redirect statici: ${staticCount} (limite 2000)`);
  if (lines.some((l) => l.length > 1000)) problems.push('Una riga supera i 1000 caratteri');
  for (const l of lines) {
    const origin = l.split(' ')[0] ?? '';
    if (!l.startsWith('#') && l.trim() && /:[A-Za-z]/.test(origin)) problems.push(`L'origine contiene un segnaposto ":nome": ${origin}`);
  }

  return {
    text: lines.join('\n') + '\n',
    problems,
    notes,
    counts: { principali: MAIN_PAGES.length, paginesingole: LEGACY_PAGES.length, progetti: progetti, statici: staticCount, dinamici: dynamicCount },
  };
}

function check(): string[] {
  const dist = join(ROOT, 'dist');
  if (!existsSync(dist)) return ['Manca dist/: esegui prima `pnpm build`.'];
  const file = join(ROOT, 'public', '_redirects');
  if (!existsSync(file)) return ['Manca public/_redirects: esegui `pnpm redirects`.'];
  const errors: string[] = [];
  const origins = new Set<string>();
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [origin = '', destination = '', code = ''] = line.split(' ');
    if (code !== '301') errors.push(`Codice non 301: ${line}`);
    if (!origin.includes('*') && origins.has(origin)) continue; // varianti identiche: la prima vince
    origins.add(origin);
    const path = destination.split('?')[0] ?? '';
    const html = path === '/' ? 'index.html' : `${path.slice(1)}.html`;
    if (!existsSync(join(dist, html))) errors.push(`La destinazione non esiste in dist: ${destination} (da ${origin})`);
    if (origin === path) errors.push(`Redirect su se stesso: ${origin}`);
    if (destination.startsWith('/') && origins.has(path) && !origin.includes('*')) errors.push(`Catena di redirect: ${origin} → ${destination}`);
  }
  return errors;
}

if (process.argv.includes('--check')) {
  const errors = check();
  if (errors.length) {
    errors.forEach((e) => console.error(`✗ ${e}`));
    process.exit(1);
  }
  console.log('✓ Tutte le destinazioni dei redirect esistono in dist/, nessun ciclo né catena.');
} else {
  const { text, problems, notes, counts } = build();
  if (problems.length) {
    problems.forEach((p) => console.error(`✗ ${p}`));
    process.exit(1);
  }
  writeFileSync(join(ROOT, 'public', '_redirects'), text);
  console.log(`✓ public/_redirects: ${counts['principali']} pagine principali, ${counts['paginesingole']} vecchie pagine singole, ${counts['progetti']} righe di progetto (63 indirizzi, varianti di codifica incluse), ${counts['dinamici']} fallback.`);
  console.log(`  Redirect statici: ${counts['statici']} su 2000 · dinamici: ${counts['dinamici']} su 100`);
  if (notes.length) {
    console.log('\nDa confermare (nessuna corrispondenza sicura):');
    notes.forEach((n) => console.log(`  • ${n}`));
  }
}
