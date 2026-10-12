/**
 * Disposizione a colonne (stile Pinterest) di "Progetti selezionati" in home e dell'elenco in /progetti.
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

export function layoutMasonry(count: number): MasonrySlot[] {
  const heights: number[] = Array.from({ length: MASONRY_COLUMNS }, () => 0);
  const slots: MasonrySlot[] = [];
  for (let index = 0; index < count; index++) {
    const [w, h] = RATIOS[index % RATIOS.length] ?? [3, 2];
    let column = 0;
    heights.forEach((height, i) => {
      if (height < (heights[column] ?? 0)) column = i;
    });
    heights[column] = (heights[column] ?? 0) + h / w + TEXT_HEIGHT;
    slots.push({ index, column, ratio: `${w} / ${h}` });
  }
  return slots;
}
