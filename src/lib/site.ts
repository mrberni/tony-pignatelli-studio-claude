export const navItems = [
  { label: 'Progetti', href: '/progetti' },
  { label: 'Studio', href: '/studio' },
  { label: 'Servizi', href: '/servizi' },
  { label: 'Contatti', href: '/contatti' },
] as const;

/**
 * Percorso pulito di una pagina. Nel sito generato (`build.format: 'file'`) Astro riporta
 * `/progetti.html` e `/index.html`, mentre gli indirizzi veri sono `/progetti` e `/`.
 */
export function cleanPath(pathname: string): string {
  const path = pathname.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
  return path.length > 1 ? path.replace(/\/$/, '') : '/';
}

/** `/progetti/[slug]` evidenzia "Progetti". */
export function isActive(href: string, currentPath: string): boolean {
  const path = cleanPath(currentPath);
  return path === href || path.startsWith(`${href}/`);
}

/** Numero di telefono in formato `tel:` (solo cifre e +). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
