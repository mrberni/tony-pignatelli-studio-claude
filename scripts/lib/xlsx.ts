/**
 * Lettore minimo di file .xlsx, senza dipendenze: un .xlsx è uno zip di file XML.
 * Basta per il foglio dei progetti (celle di testo e numeri, nessuna formula complessa).
 */
import { inflateRawSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

export type Row = Record<string, string>;

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
}

function readZipDirectory(buffer: Buffer): Map<string, ZipEntry> {
  // Fine della directory centrale: firma 0x06054b50, cercata dal fondo
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 66000); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('File .xlsx non valido: directory dello zip non trovata');
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map<string, ZipEntry>();
  for (let i = 0; i < count; i++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Directory dello zip danneggiata');
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);
    entries.set(name, { name, method, compressedSize, localHeaderOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function readEntry(buffer: Buffer, entry: ZipEntry): string {
  const offset = entry.localHeaderOffset;
  const nameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const start = offset + 30 + nameLength + extraLength;
  const data = buffer.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return data.toString('utf8');
  if (entry.method === 8) return inflateRawSync(data).toString('utf8');
  throw new Error(`Metodo di compressione non supportato: ${entry.method}`);
}

const decodeXml = (text: string): string =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&');

/** Testo di una cella `<si>` o `<is>`: concatena tutti i `<t>` (anche il testo formattato). */
const textOf = (xml: string): string =>
  [...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => decodeXml(m[1] ?? '')).join('');

/** "B12" → indice di colonna 1 */
function columnIndex(ref: string): number {
  const letters = ref.replace(/[0-9]/g, '');
  let index = 0;
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
  return index - 1;
}

export interface Workbook {
  sheetNames: string[];
  /** Righe di un foglio come oggetti, con la prima riga come intestazioni. */
  rows(sheetName: string): Row[];
}

export function readWorkbook(path: string): Workbook {
  const buffer = readFileSync(path);
  const entries = readZipDirectory(buffer);
  const file = (name: string): string => {
    const entry = entries.get(name);
    if (!entry) throw new Error(`File mancante nel .xlsx: ${name}`);
    return readEntry(buffer, entry);
  };

  const shared = entries.has('xl/sharedStrings.xml')
    ? [...file('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1] ?? ''))
    : [];

  const workbookXml = file('xl/workbook.xml');
  const relsXml = file('xl/_rels/workbook.xml.rels');
  const targets = new Map<string, string>();
  for (const m of relsXml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const attrs = m[1] ?? '';
    const id = /Id="([^"]*)"/.exec(attrs)?.[1];
    const target = /Target="([^"]*)"/.exec(attrs)?.[1];
    if (id && target) targets.set(id, target.startsWith('/') ? target.slice(1) : `xl/${target}`);
  }
  const sheets = [...workbookXml.matchAll(/<sheet\b([^>]*)\/?>/g)].map((m) => {
    const attrs = m[1] ?? '';
    const name = decodeXml(/name="([^"]*)"/.exec(attrs)?.[1] ?? '');
    const rid = /r:id="([^"]*)"/.exec(attrs)?.[1] ?? '';
    return { name, path: targets.get(rid) ?? '' };
  });

  function grid(sheetName: string): string[][] {
    const sheet = sheets.find((s) => s.name === sheetName);
    if (!sheet) throw new Error(`Foglio non trovato: "${sheetName}" (fogli: ${sheets.map((s) => s.name).join(', ')})`);
    const xml = file(sheet.path);
    const rows: string[][] = [];
    for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells: string[] = [];
      for (const cellMatch of (rowMatch[1] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = cellMatch[1] ?? '';
        const inner = cellMatch[2] ?? '';
        const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1] ?? '';
        const type = /t="([^"]*)"/.exec(attrs)?.[1] ?? '';
        let value = '';
        if (type === 's') value = shared[Number(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? '-1')] ?? '';
        else if (type === 'inlineStr') value = textOf(inner);
        else value = decodeXml(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? '');
        if (ref) cells[columnIndex(ref)] = value;
      }
      rows.push(Array.from(cells, (c) => c ?? ''));
    }
    return rows;
  }

  return {
    sheetNames: sheets.map((s) => s.name),
    rows(sheetName: string): Row[] {
      const [header = [], ...body] = grid(sheetName);
      const keys = header.map((h) => h.trim());
      return body
        .filter((cells) => cells.some((c) => c.trim() !== ''))
        .map((cells) => Object.fromEntries(keys.map((key, i) => [key, (cells[i] ?? '').trim()])));
    },
  };
}
