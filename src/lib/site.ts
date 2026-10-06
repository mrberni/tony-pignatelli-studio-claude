export const siteName = 'Tony Pignatelli Studio';

export const navItems = [
  { label: 'Progetti', href: '/progetti' },
  { label: 'Studio', href: '/studio' },
  { label: 'Servizi', href: '/servizi' },
  { label: 'Contatti', href: '/contatti' },
] as const;

export const social = {
  instagram: 'https://instagram.com/tonypignatellistudio/',
  linkedin: 'https://www.linkedin.com/in/tony-pignatelli-studio-27238436/',
} as const;

/** `/progetti/[slug]` evidenzia "Progetti". */
export function isActive(href: string, currentPath: string): boolean {
  const path = currentPath.replace(/\/$/, '') || '/';
  return path === href || path.startsWith(`${href}/`);
}
