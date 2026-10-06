/** Parser CSV minimo (RFC 4180): campi tra virgolette con virgole, a capo e `""` all'interno. */
import { readFileSync } from 'node:fs';

export type CsvRow = Record<string, string>;

export function parseCsv(text: string): CsvRow[] {
  const source = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += char;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header = [], ...body] = rows;
  return body
    .filter((cells) => cells.some((c) => c.trim() !== ''))
    .map((cells) => Object.fromEntries(header.map((key, i) => [key.trim(), cells[i] ?? ''])));
}

export function readCsv(path: string): CsvRow[] {
  return parseCsv(readFileSync(path, 'utf8'));
}
