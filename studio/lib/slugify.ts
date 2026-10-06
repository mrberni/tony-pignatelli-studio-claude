/**
 * Regole di HANDOFF §8.3: minuscolo, senza accenti, "&" e simboli eliminati,
 * spazi e trattini ridotti a un solo "-", massimo 80 caratteri.
 * Esempio: "Paul & Shark - Pitti - Firenze" → "paul-shark-pitti-firenze".
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .slice(0, 80)
    .replace(/^-+|-+$/g, '');
}
