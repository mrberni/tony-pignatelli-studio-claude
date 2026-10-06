export const navItems = [
  { label: 'Progetti', href: '/progetti' },
  { label: 'Studio', href: '/studio' },
  { label: 'Servizi', href: '/servizi' },
  { label: 'Contatti', href: '/contatti' },
] as const;

/** `/progetti/[slug]` evidenzia "Progetti". */
export function isActive(href: string, currentPath: string): boolean {
  const path = currentPath.replace(/\/$/, '') || '/';
  return path === href || path.startsWith(`${href}/`);
}

/** Numero di telefono in formato `tel:` (solo cifre e +). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
