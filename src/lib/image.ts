import type { PhotoData } from './types';

/** Larghezze del `srcset` (HANDOFF §3). */
export const IMAGE_WIDTHS = [480, 768, 1200, 1800, 2400] as const;

/** URL dell'immagine ridimensionata dal CDN di Sanity, con formato automatico. */
export function sizedUrl(src: string, width: number): string {
  const url = new URL(src);
  url.searchParams.set('w', String(width));
  url.searchParams.set('auto', 'format');
  url.searchParams.set('fit', 'max');
  return url.toString();
}

/** Immagine per Open Graph e anteprime social: sempre JPEG (i social non leggono tutti WebP/AVIF), larga 1200. */
export function ogImageUrl(src: string): string {
  const url = new URL(src);
  url.searchParams.set('w', '1200');
  url.searchParams.set('fm', 'jpg');
  url.searchParams.set('fit', 'max');
  return url.toString();
}

export function buildSrcset(photo: PhotoData): { src: string; srcset: string } | undefined {
  if (!photo.src) return undefined;
  const widths = IMAGE_WIDTHS.filter((w) => w <= photo.width);
  const usable = widths.length > 0 ? widths : [Math.min(...IMAGE_WIDTHS)];
  return {
    src: sizedUrl(photo.src, usable[usable.length - 1] ?? IMAGE_WIDTHS[0]),
    srcset: usable.map((w) => `${sizedUrl(photo.src as string, w)} ${w}w`).join(', '),
  };
}

/** `object-position` dal punto focale, per non tagliare il soggetto. */
export function objectPosition(photo: PhotoData): string {
  const x = Math.round((photo.focal?.x ?? 0.5) * 100);
  const y = Math.round((photo.focal?.y ?? 0.5) * 100);
  return `${x}% ${y}%`;
}
