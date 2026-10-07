/**
 * Dimensione ottica uniforme dei loghi dei clienti.
 *
 * I loghi hanno proporzioni molto diverse (da un marchio quasi quadrato a una scritta lunga 12 volte
 * l'altezza). Con una sola altezza le scritte lunghe sembrerebbero enormi e i marchi compatti minuscoli;
 * con una sola larghezza accadrebbe il contrario. Qui si fissa invece un'**area** simile per tutti
 * (altezza = √(area / proporzione)), poi si limitano altezza e larghezza massime.
 *
 * Il `viewBox` di ogni SVG è già stretto attorno al disegno (`pnpm logos:prepare`), quindi la
 * proporzione è quella vera del logo e non c'è spazio vuoto proprio.
 */
export interface LogoBox {
  width: number;
  height: number;
}

/** Area ottica di riferimento, in px². */
const AREA = 4200;
const MAX_HEIGHT = 46;
const MAX_WIDTH = 150;
/** Le scritte molto lunghe non scendono sotto questa altezza. */
const MIN_HEIGHT = 17;

export function logoBox(ratio: number): LogoBox {
  const r = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  let height = Math.sqrt(AREA / r);
  let width = height * r;
  if (height > MAX_HEIGHT) {
    height = MAX_HEIGHT;
    width = height * r;
  }
  if (width > MAX_WIDTH) {
    width = MAX_WIDTH;
    height = width / r;
  }
  if (height < MIN_HEIGHT) {
    // una scritta lunghissima: meglio un po' più larga del massimo che illeggibile
    height = MIN_HEIGHT;
    width = Math.min(height * r, MAX_WIDTH * 1.25);
    height = width / r;
  }
  return { width: Math.round(width * 10) / 10, height: Math.round(height * 10) / 10 };
}

/**
 * Proporzione (larghezza / altezza) letta dal `viewBox` di un SVG già preparato.
 * `undefined` se il file non ha un `viewBox` leggibile.
 */
export function ratioFromSvg(svg: string): number | undefined {
  const tag = /<svg\b[^>]*>/i.exec(svg)?.[0] ?? '';
  const viewBox = /viewBox\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
  const parts = viewBox?.trim().split(/[\s,]+/).map(Number);
  if (parts && parts.length === 4 && parts.every(Number.isFinite) && (parts[2] ?? 0) > 0 && (parts[3] ?? 0) > 0) {
    return (parts[2] as number) / (parts[3] as number);
  }
  return undefined;
}
