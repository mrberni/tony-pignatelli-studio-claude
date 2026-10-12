/**
 * Disposizione a colonne (stile Pinterest): "Progetti selezionati" in home, elenco in /progetti e gallerie dei singoli progetti.
 * Funzione pura, usata sia al build (HTML) sia nel browser (filtri): la scheda successiva va sempre
 * nella colonna più bassa (a parità, la più a sinistra), quindi le prime tre stanno in alto e
 * l'ordine dello Studio si legge per righe. Chi dispone le prime N schede ottiene sempre lo stesso
 * risultato, qualunque sia il totale.
 */
export const MASONRY_COLUMNS = 3;

/** Proporzioni (larghezza, altezza) a ciclo, nell'ordine dell'elenco. */
const RATIOS: ReadonlyArray<readonly [number, number]> = [
  [3, 2], [4, 5], [1, 1], [4, 5], [3, 2], [1, 1], [4, 5], [3, 2],
];

/** Altezza stimata del testo sotto la foto, in rapporto alla larghezza della colonna. */
const TEXT_HEIGHT = 0.18;

export interface MasonrySlot {
  /** Posizione nell'elenco (0 = prima). */
  index: number;
  /** Colonna (0 = sinistra). */
  column: number;
  /** Proporzione CSS della foto, per esempio "4 / 5". */
  ratio: string;
}

/** Assegna ogni scheda (con la sua proporzione larghezza / altezza) alla colonna più bassa. */
function placeInColumns(ratios: number[]): number[] {
  const heights: number[] = Array.from({ length: MASONRY_COLUMNS }, () => 0);
  return ratios.map((ratio) => {
    let column = 0;
    heights.forEach((height, i) => {
      if (height < (heights[column] ?? 0)) column = i;
    });
    heights[column] = (heights[column] ?? 0) + 1 / ratio + TEXT_HEIGHT;
    return column;
  });
}

/** Elenchi di progetti: proporzioni a ciclo (foto ritagliate attorno al punto focale). */
export function layoutMasonry(count: number): MasonrySlot[] {
  const pairs = Array.from({ length: count }, (_, i) => RATIOS[i % RATIOS.length] ?? ([3, 2] as const));
  const columns = placeInColumns(pairs.map(([w, h]) => w / h));
  return pairs.map(([w, h], index) => ({ index, column: columns[index] ?? 0, ratio: `${w} / ${h}` }));
}

/** Gallerie dei progetti: proporzione reale di ogni foto (nessun ritaglio), tra 3:4 e 16:9. */
export function layoutMasonryFor(photos: ReadonlyArray<{ width: number; height: number }>): MasonrySlot[] {
  const ratios = photos.map((p) => Math.min(16 / 9, Math.max(3 / 4, p.width / p.height)));
  const columns = placeInColumns(ratios);
  return ratios.map((ratio, index) => ({ index, column: columns[index] ?? 0, ratio: `${ratio.toFixed(4)} / 1` }));
}
