export const CATEGORIES = [
  { title: 'Eventi', value: 'eventi' },
  { title: 'Vetrine', value: 'vetrine' },
  { title: 'Set design', value: 'set-design' },
] as const;

export const SECTORS = [
  { title: 'Automotive', value: 'automotive' },
  { title: 'Fashion', value: 'fashion' },
  { title: 'Beauty', value: 'beauty' },
  { title: 'Food & beverage', value: 'food-beverage' },
  { title: 'Technology', value: 'technology' },
  { title: 'Entertainment', value: 'entertainment' },
  { title: 'Retail', value: 'retail' },
  { title: 'Sport', value: 'sport' },
] as const;

export const SUGGESTED_SERVICES = [
  'Concept',
  'Progettazione',
  'Produzione',
  'Allestimento',
  'Set design',
  'Scenografia',
  'Art direction',
  'Styling',
  'Regia',
] as const;

/** Numero di progetti mostrati in "Progetti selezionati" in home. */
export const FEATURED_LIMIT = 8;

export const SINGLETON_TYPES = [
  'homePage',
  'studioPage',
  'servicesPage',
  'contactPage',
  'siteSettings',
] as const;

export function labelOf(
  list: ReadonlyArray<{ title: string; value: string }>,
  value: string | undefined,
): string {
  return list.find((item) => item.value === value)?.title ?? '';
}
