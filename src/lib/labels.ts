import type { CategoryValue, ProjectSummary, SectorValue } from './types';

export const CATEGORY_LABELS: Record<CategoryValue, string> = {
  eventi: 'Eventi',
  vetrine: 'Vetrine',
  'set-design': 'Set design',
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

/** Riga `meta` di schede e carousel: "Eventi · Automotive". Nessun cliente, nessun anno. */
export function metaLine(project: Pick<ProjectSummary, 'category' | 'sector'>): string {
  return `${CATEGORY_LABELS[project.category]} · ${SECTOR_LABELS[project.sector]}`;
}
