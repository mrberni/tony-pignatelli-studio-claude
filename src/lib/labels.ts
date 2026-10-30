import type { CategoryValue, ProjectSummary, SectorValue } from './types';

export const CATEGORY_LABELS: Record<CategoryValue, string> = {
  eventi: 'Eventi',
  vetrine: 'Vetrine',
  'set-design': 'Set design',
  concept: 'Concept',
};

export const SECTOR_LABELS: Record<SectorValue, string> = {
  automotive: 'Automotive',
  fashion: 'Fashion',
  beauty: 'Beauty',
  'food-beverage': 'Food & beverage',
  technology: 'Technology',
  entertainment: 'Entertainment',
  retail: 'Retail',
  sport: 'Sport',
};

/**
 * Riga `meta` di schede e carousel: "Eventi · Automotive". Nessun cliente, nessun anno.
 * I Concept sono proposte non realizzate e lo dicono: "Concept · Non realizzato · Fashion".
 */
export function metaLine(project: Pick<ProjectSummary, 'category' | 'sector'>): string {
  const parts = [CATEGORY_LABELS[project.category]];
  if (project.category === 'concept') parts.push('Non realizzato');
  parts.push(SECTOR_LABELS[project.sector]);
  return parts.join(' · ');
}
