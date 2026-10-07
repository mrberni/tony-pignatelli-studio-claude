/**
 * Prepara i loghi SVG forniti dall'utente (cartella `svg/`) per il sito:
 *
 *   pnpm logos:prepare [-- --from svg]
 *
 * 1. Assegna a ogni file il nome atteso (HANDOFF §8.5.4): quello della colonna "Logo (file SVG)" del
 *    foglio Clienti; per i nomi della lista Clienti dello Studio che non sono clienti di un progetto,
 *    lo slug del nome.
 * 2. **Ritaglia lo spazio vuoto**: misura i pixel realmente disegnati (con Chrome, quindi tiene conto
 *    di tratti, maschere e immagini incorporate) e stringe il `viewBox` attorno al logo. Così tutti i
 *    loghi hanno proporzioni vere e nessun margine proprio, e il sito può dimensionarli in modo uniforme.
 * 3. Pulisce il codice: toglie script, attributi `on…`, metadati, commenti, dimensioni fisse.
 * 4. Scrive il risultato in `data/logos/` e un rapporto in `data/.cache/logo-report.json`.
 *
 * I file originali non vengono toccati. Il sito mostra i loghi in un solo colore (`--ink`) tramite
 * `mask-image`: conta solo la trasparenza, i colori originali si perdono.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { studioPageInitial } from '../studio/schemaTypes/initialContent.ts';
import { slugify } from '../studio/lib/slugify.ts';
import { loadSource, ROOT } from './lib/source.ts';

const args = process.argv.slice(2);
const from = join(ROOT, args[args.indexOf('--from') + 1] || 'svg');
const OUT = join(ROOT, 'data', 'logos');
const CACHE = join(ROOT, 'data', '.cache');
const RENDER = 2400; // lato lungo del rendering usato per misurare

const norm = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '');

/** Ripulisce il codice SVG: nessuno script, nessun gestore di eventi, nessun metadato. */
function sanitize(svg: string): string {
  return svg
    .replace(/^\uFEFF/, '')
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
    .replace(/<(title|desc)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/(xlink:href|href)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '')
    .trim();
}

interface RootInfo {
  tag: string;
  viewBox: [number, number, number, number] | undefined;
  width: number | undefined;
  height: number | undefined;
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  if (value.trim().endsWith('%')) return undefined;
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function rootInfo(svg: string): RootInfo {
  const tag = /<svg\b[^>]*>/i.exec(svg)?.[0] ?? '';
  const attr = (name: string): string | undefined => new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag)?.slice(2).find((v) => v !== undefined);
  const vb = attr('viewBox')?.trim().split(/[\s,]+/).map(Number);
  const viewBox = vb && vb.length === 4 && vb.every(Number.isFinite) && (vb[2] ?? 0) > 0 && (vb[3] ?? 0) > 0 ? (vb as [number, number, number, number]) : undefined;
  return { tag, viewBox, width: parseNumber(attr('width')), height: parseNumber(attr('height')) };
}

/** Sostituisce l'elemento radice con uno senza dimensioni fisse e con il `viewBox` indicato. */
function withRoot(svg: string, tag: string, viewBox: string, extra = ''): string {
  const attrs = tag
    .replace(/^<svg/i, '')
    .replace(/>$/, '')
    .replace(/\s(viewBox|width|height|preserveAspectRatio|x|y|style|version|enable-background|xml:space)\s*=\s*("[^"]*"|'[^']*')/gi, '');
  const hasNs = /xmlns\s*=/.test(attrs);
  return svg.replace(tag, `<svg${hasNs ? '' : ' xmlns="http://www.w3.org/2000/svg"'}${attrs} viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet"${extra}>`);
}

/** Toglie il rettangolo bianco a tutta pagina che molti SVG hanno come primo elemento. */
function stripBackground(svg: string, vb: [number, number, number, number]): { svg: string; removed: number } {
  const [, , w, h] = vb;
  const near = (a: number, b: number): boolean => Math.abs(a - b) <= Math.max(b * 0.02, 0.5);
  const white = /(fill\s*=\s*["'](#fff(?:fff)?|white)["']|fill\s*:\s*(#fff(?:fff)?|white))/i;
  let removed = 0;
  const out = svg.replace(/<(path|rect)\b[^>]*?\/>/gi, (element) => {
    if (!white.test(element)) return element;
    // percorso "M0 0 h<larghezza> v<altezza> H0 V0 z" = riquadro dell'intera tavola
    const d = /\sd\s*=\s*["']\s*M\s*0[ ,]+0\s*[hH]\s*([\d.]+)\s*[vV]\s*([\d.]+)\s*[hH]\s*-?0\s*[vV]\s*0\s*[zZ]/i.exec(element);
    if (d && near(Number(d[1]), w) && near(Number(d[2]), h)) {
      removed++;
      return '';
    }
    const rw = /\swidth\s*=\s*["']([\d.]+)["']/i.exec(element)?.[1];
    const rh = /\sheight\s*=\s*["']([\d.]+)["']/i.exec(element)?.[1];
    if (/^<rect/i.test(element) && rw && rh && near(Number(rw), w) && near(Number(rh), h)) {
      removed++;
      return '';
    }
    return element;
  });
  return { svg: out, removed };
}

/**
 * Un `<use>` che richiama un `<symbol>` senza larghezza e altezza si adatta all'area visibile: se si
 * stringe il `viewBox` della radice, il disegno si sposta fuori campo. Gli si danno le dimensioni originali.
 */
function fixSymbolUses(svg: string, vb: [number, number, number, number]): { svg: string; fixed: number } {
  const [x, y, w, h] = vb;
  let fixed = 0;
  const out = svg.replace(/<use\b[^>]*>/gi, (use) => {
    if (/\swidth\s*=/i.test(use) || !/#/.test(use)) return use;
    fixed++;
    return use.replace(/<use\b/i, `<use x="${x}" y="${y}" width="${w}" height="${h}"`);
  });
  return { svg: out, fixed };
}

/**
 * Per i loghi con parti chiare opache dentro forme scure (scritte bianche su un fondo nero): con un solo
 * colore diventerebbero una sagoma piena. Il filtro trasforma la luminosità in trasparenza (chiaro = vuoto,
 * scuro o colorato = inchiostro) e le scritte tornano a essere bucature.
 */
function applyInk(svg: string): string {
  const tag = /<svg\b[^>]*>/i.exec(svg)?.[0] ?? '';
  const matrix = '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.6378 -2.1456 -0.2166 3 0';
  const filter =
    `<defs><filter id="tps-ink" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${matrix}"/></filter></defs>` +
    '<g filter="url(#tps-ink)">';
  return svg.replace(tag, `${tag}${filter}`).replace(/<\/svg>\s*$/i, '</g></svg>');
}

interface Job {
  file: string;
  target: string;
  reason: string;
  svg: string;
  vb: [number, number, number, number];
  /** Filtro luminosità → trasparenza applicato (vedi `applyInk`). */
  ink?: boolean;
}

interface Measure {
  file: string;
  index?: number;
  /** Quota di pixel opachi quasi bianchi / non bianchi (serve a riconoscere le scritte bianche su fondo scuro). */
  white?: number;
  inked?: number;
  bbox: [number, number, number, number] | null; // in unità del viewBox originale
  fill: number; // quota di pixel opachi dentro il riquadro
  error?: string;
}

/** Misura, con Chrome headless, il riquadro dei pixel disegnati di ogni SVG. */
function measureWithChrome(jobs: Job[]): Measure[] {
  const chrome = [
    process.env.CHROME_PATH ?? '',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].find((p) => p && existsSync(p));
  if (!chrome) throw new Error('Serve Chrome (o Edge) per misurare i loghi: imposta CHROME_PATH.');

  const items = jobs.map((job, index) => ({ index, file: job.file, svg: job.svg, vb: job.vb }));
  const page = `<!doctype html><meta charset="utf-8"><body><pre id="out">attesa</pre><script>
const items = ${JSON.stringify(items).replace(/</g, '\\u003c')};
const RENDER = ${RENDER};
async function measure(item) {
  const [x, y, w, h] = item.vb;
  const scale = RENDER / Math.max(w, h);
  const W = Math.max(1, Math.round(w * scale)), H = Math.max(1, Math.round(h * scale));
  const text = item.svg.replace(/<svg\\b[^>]*>/i, (tag) => {
    const clean = tag.replace(/\\s(width|height|viewBox|preserveAspectRatio)\\s*=\\s*("[^"]*"|'[^']*')/gi, '').replace(/>$/, '');
    return clean + ' width="' + W + '" height="' + H + '" viewBox="' + item.vb.join(' ') + '" preserveAspectRatio="none">';
  });
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);
  await img.decode();
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const data = ctx.getImageData(0, 0, W, H).data;
  let minX = W, minY = H, maxX = -1, maxY = -1, solid = 0;
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    if (data[(py * W + px) * 4 + 3] > 12) { if (px < minX) minX = px; if (px > maxX) maxX = px; if (py < minY) minY = py; if (py > maxY) maxY = py; solid++; }
  }
  if (maxX < 0) return { index: item.index, file: item.file, bbox: null, fill: 0 };
  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  let light = 0, dark = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    if (lum > 0.92) light++; else dark++;
  }
  const opaque = Math.max(1, light + dark);
  return { index: item.index, file: item.file, bbox: [x + minX / scale, y + minY / scale, bw / scale, bh / scale], fill: solid / (bw * bh), white: light / opaque, inked: dark / opaque };
}
(async () => {
  const out = [];
  for (const item of items) { try { out.push(await measure(item)); } catch (e) { out.push({ index: item.index, file: item.file, bbox: null, fill: 0, error: String(e) }); } }
  document.getElementById('out').textContent = 'JSON:' + JSON.stringify(out) + ':END';
})();
</script>`;
  mkdirSync(join(CACHE, 'logos-tmp'), { recursive: true });
  const htmlPath = join(CACHE, 'logos-tmp', 'measure.html');
  writeFileSync(htmlPath, page);
  const result = spawnSync(
    chrome,
    ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom', `file:///${htmlPath.replace(/\\/g, '/')}`],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 180_000 },
  );
  const match = /JSON:([\s\S]*?):END/.exec(result.stdout ?? '');
  if (!match) throw new Error(`Chrome non ha restituito misure.\n${(result.stderr ?? '').slice(0, 500)}`);
  // Il DOM serializzato da Chrome protegge &, < e > come entità: si ripristinano prima di leggere il JSON
  const json = (match[1] ?? '[]').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  return JSON.parse(json) as Measure[];
}

function main(): void {
  if (!existsSync(from)) throw new Error(`Cartella non trovata: ${from}`);
  const source = loadSource();
  const files = readdirSync(from).filter((f) => /\.svg$/i.test(f));
  const skipped = readdirSync(from).filter((f) => !/\.svg$/i.test(f));

  // --- 1. Nomi
  const used = new Set<string>();
  const jobs: Job[] = [];
  const byFileNorm = new Map(files.map((f) => [norm(f.replace(/\.svg$/i, '')), f]));
  const takes = (file: string, target: string, reason: string): void => {
    if (used.has(file)) return;
    used.add(file);
    const raw = readFileSync(join(from, file), 'utf8');
    const cleaned = sanitize(raw);
    const info = rootInfo(cleaned);
    const vb = info.viewBox ?? (info.width && info.height ? ([0, 0, info.width, info.height] as [number, number, number, number]) : undefined);
    if (!vb) {
      console.warn(`✗ ${file}: nessun viewBox né larghezza/altezza leggibili, saltato`);
      return;
    }
    const used2 = fixSymbolUses(cleaned, vb);
    const { svg, removed } = stripBackground(used2.svg, vb);
    const notes = [removed ? 'sfondo bianco tolto' : '', used2.fixed ? 'richiamo <use> con dimensioni' : ''].filter(Boolean);
    jobs.push({ file, target, reason: notes.length ? `${reason}, ${notes.join(', ')}` : reason, svg, vb });
  };
  // a) clienti del foglio: prima i file con il nome esatto dichiarato, poi per somiglianza
  for (const client of source.clients) if (files.includes(client.logoFile)) takes(client.logoFile, client.logoFile, 'nome esatto');
  for (const client of source.clients) {
    if (client.logoFile && !files.some((f) => used.has(f) && norm(f.replace(/\.svg$/i, '')) === norm(client.logoFile.replace(/\.svg$/i, '')))) {
      const alias = byFileNorm.get(norm(client.logoFile.replace(/\.svg$/i, ''))) ?? byFileNorm.get(norm(client.name));
      if (alias && !used.has(alias)) takes(alias, client.logoFile, `rinominato da "${alias}"`);
    }
  }
  // b) nomi della lista Clienti dello Studio che non sono clienti dei progetti
  const sheetNames = new Set(source.clients.map((c) => norm(c.name)));
  for (const name of studioPageInitial.clientNames) {
    if (sheetNames.has(norm(name))) continue;
    const file = byFileNorm.get(norm(name));
    if (file && !used.has(file)) takes(file, `${slugify(name)}.svg`, `lista Studio: "${name}"`);
  }
  // c) tutto il resto
  for (const file of files) if (!used.has(file)) takes(file, `${slugify(file.replace(/\.svg$/i, ''))}.svg`, 'nessun cliente corrispondente');

  // --- 2. Misura e ritaglio
  console.log(`Misuro ${jobs.length} loghi con Chrome…`);
  const measures = new Map(measureWithChrome(jobs).map((m) => [m.index ?? -1, m]));
  // Secondo passaggio: parti chiare opache dentro forme scure → filtro "chiaro = vuoto", poi si rimisura
  const needInk = jobs.flatMap((_job, position) => {
    const m = measures.get(position);
    return m?.bbox && (m.white ?? 0) > 0.04 && (m.inked ?? 0) > 0.2 ? [position] : [];
  });
  if (needInk.length) {
    const second = needInk.map((position) => {
      const job = jobs[position] as Job;
      return { ...job, svg: applyInk(job.svg) };
    });
    const results = measureWithChrome(second);
    needInk.forEach((position, i) => {
      const job = jobs[position] as Job;
      const result = results[i];
      if (!result?.bbox) return; // il filtro ha cancellato tutto: si tiene la versione senza filtro
      job.svg = (second[i] as Job).svg;
      job.ink = true;
      job.reason += ', scritte chiare rese vuote';
      measures.set(position, { ...result, index: position });
    });
  }
  mkdirSync(OUT, { recursive: true });
  const report: Array<Record<string, unknown>> = [];
  for (const [position, job] of jobs.entries()) {
    const m = measures.get(position);
    const entry: Record<string, unknown> = { origine: job.file, file: job.target, motivo: job.reason };
    if (!m?.bbox) {
      entry['problema'] = m?.error ?? 'immagine vuota (nessun pixel disegnato)';
      report.push(entry);
      continue;
    }
    const [x, y, w, h] = m.bbox;
    const [, , ow, oh] = job.vb;
    // Una frazione di unità di margine evita tagli sul bordo dovuti all'antialiasing
    const pad = Math.max(w, h) / RENDER;
    const viewBox = [x - pad, y - pad, w + pad * 2, h + pad * 2].map((n) => +n.toFixed(3)).join(' ');
    // Un logo con meno del 5% di pixel pieni dentro il proprio riquadro è quasi sicuramente un file incompleto
    if (m.fill < 0.05) {
      entry['problema'] = 'quasi vuoto (file probabilmente incompleto): NON usato, resta il nome in testo';
      report.push(entry);
      continue;
    }
    const info = rootInfo(job.svg);
    writeFileSync(join(OUT, job.target), withRoot(job.svg, info.tag, viewBox) + '\n');
    entry['rapporto'] = +(w / h).toFixed(3);
    entry['vuotoRimosso'] = `${Math.round((1 - (w * h) / (ow * oh)) * 100)}%`;
    entry['riempimento'] = +m.fill.toFixed(2);
    if (m.fill > 0.9) entry['problema'] = 'sagoma quasi piena: probabile sfondo o riquadro opaco';
    report.push(entry);
  }
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(join(CACHE, 'logo-report.json'), JSON.stringify(report, null, 1));

  // --- 3. Riepilogo
  console.log(`\n✓ ${report.filter((r) => r['rapporto']).length} loghi scritti in data/logos/`);
  for (const r of report) {
    const note = r['problema'] ? `  ⚠ ${r['problema']}` : '';
    console.log(`  ${String(r['file']).padEnd(30)} rapporto ${String(r['rapporto'] ?? '-').padEnd(7)} vuoto tolto ${String(r['vuotoRimosso'] ?? '-').padEnd(5)} riemp. ${String(r['riempimento'] ?? '-').padEnd(5)} ${String(r['motivo'])}${note}`);
  }
  if (skipped.length) console.log(`\nSaltati (non SVG): ${skipped.join(', ')}`);
}

main();
