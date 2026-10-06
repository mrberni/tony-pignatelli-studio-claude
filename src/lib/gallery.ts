import type { PhotoData } from './types';

/**
 * Impaginazione sfalsata della galleria di un progetto (HANDOFF §4.5), calcolata in fase
 * di build a partire dalla proporzione REALE di ciascuna foto.
 *
 * Algoritmo
 * 1. Orientamento: orizzontale (larghezza/altezza ≥ 1,15), verticale (≤ 0,9), quadrata (in mezzo).
 * 2. Le foto, nell'ordine scelto dall'editor, si raggruppano in righe che seguono il ritmo
 *    1 · 2 · 3 · 2 · 1 · 3 foto (mai più di 3 per riga). L'ultima riga prende quel che resta.
 * 3. Larghezza in colonne (su 12) in base all'orientamento, con pesi orizzontale 6 · quadrata 4 ·
 *    verticale 3 e un minimo di 3 colonne:
 *    - riga da 3: 12 colonne divise in proporzione ai pesi;
 *    - riga da 2: 11 colonne divise in proporzione, con 1 colonna vuota in mezzo;
 *    - riga da 1: orizzontale a tutta larghezza o 8 colonne centrate (alternando),
 *      quadrata 6 colonne a sinistra o a destra (alternando), verticale 5 colonne (alternando).
 * 4. Scarto verticale: la prima foto di ogni riga parte a 0; le altre ricevono a rotazione
 *    16 · 32 · 48 · 64 · 96 px.
 * 5. Le foto non vengono ritagliate sul desktop (si usa la proporzione reale). Sul telefono
 *    le verticali si limitano a 4:5.
 */

export type Orientation = 'wide' | 'square' | 'tall';

export interface GalleryItem {
  photo: PhotoData;
  /** Posizione nella galleria, da 0. */
  index: number;
  orientation: Orientation;
  /** Colonna di partenza e di fine (esclusa), su una griglia di 12. */
  colStart: number;
  colEnd: number;
  marginTop: number;
  /** Larghezza / altezza reale. */
  ratio: number;
  /** Proporzione usata su mobile: le verticali non sono più alte di 4:5. */
  mobileRatio: number;
}

const ROW_SIZES = [1, 2, 3, 2, 1, 3] as const;
const OFFSETS = [64, 32, 96, 48, 16] as const;
const WEIGHT: Record<Orientation, number> = { wide: 6, square: 4, tall: 3 };
const MIN_SPAN = 3;
const COLUMNS = 12;

export function orientationOf(photo: PhotoData): Orientation {
  const ratio = photo.width / photo.height;
  if (ratio >= 1.15) return 'wide';
  if (ratio <= 0.9) return 'tall';
  return 'square';
}

/** Divide `total` colonne in proporzione ai pesi, con almeno `MIN_SPAN` ciascuna. */
function allocate(weights: number[], total: number): number[] {
  const spans = weights.map(() => MIN_SPAN);
  const remaining = total - MIN_SPAN * weights.length;
  const sum = weights.reduce((a, b) => a + b, 0);
  const shares = weights.map((w) => (remaining * w) / sum);
  shares.forEach((share, i) => {
    spans[i] = (spans[i] ?? MIN_SPAN) + Math.floor(share);
  });
  let left = total - spans.reduce((a, b) => a + b, 0);
  const byFraction = shares
    .map((share, i) => ({ i, fraction: share - Math.floor(share) }))
    .sort((a, b) => b.fraction - a.fraction);
  for (const { i } of byFraction) {
    if (left <= 0) break;
    spans[i] = (spans[i] ?? MIN_SPAN) + 1;
    left -= 1;
  }
  return spans;
}

function singleSpan(orientation: Orientation, rowNumber: number): [number, number] {
  const alternate = rowNumber % 2 === 1;
  if (orientation === 'wide') return alternate ? [3, 11] : [1, 13];
  if (orientation === 'square') return alternate ? [7, 13] : [1, 7];
  return alternate ? [8, 13] : [2, 7];
}

function rowSpans(orientations: Orientation[], rowNumber: number): Array<[number, number]> {
  if (orientations.length === 1) return [singleSpan(orientations[0] ?? 'wide', rowNumber)];
  const weights = orientations.map((o) => WEIGHT[o]);
  if (orientations.length === 2) {
    const [a, b] = allocate(weights, COLUMNS - 1) as [number, number];
    return [
      [1, 1 + a],
      [2 + a, 2 + a + b],
    ];
  }
  const spans = allocate(weights, COLUMNS);
  let start = 1;
  return spans.map((span) => {
    const range: [number, number] = [start, start + span];
    start += span;
    return range;
  });
}

export function layoutGallery(photos: PhotoData[]): GalleryItem[] {
  const items: GalleryItem[] = [];
  let cursor = 0;
  let rowNumber = 0;
  let offsetCounter = 0;

  while (cursor < photos.length) {
    const size = Math.min(ROW_SIZES[rowNumber % ROW_SIZES.length] ?? 1, photos.length - cursor);
    const row = photos.slice(cursor, cursor + size);
    const orientations = row.map(orientationOf);
    const spans = rowSpans(orientations, rowNumber);

    row.forEach((photo, i) => {
      const [colStart, colEnd] = spans[i] ?? [1, 13];
      const ratio = photo.width / photo.height;
      const isFirstInRow = i === 0;
      items.push({
        photo,
        index: cursor + i,
        orientation: orientations[i] ?? 'wide',
        colStart,
        colEnd,
        marginTop: isFirstInRow ? 0 : (OFFSETS[offsetCounter++ % OFFSETS.length] ?? 0),
        ratio,
        mobileRatio: Math.max(ratio, 4 / 5),
      });
    });

    cursor += size;
    rowNumber += 1;
  }
  return items;
}
