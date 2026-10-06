import type { Project, ProjectSummary } from './types';

/** Il lavoro più recente è il primo (`order` crescente). */
export function byOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export const toSummary = ({ slug, title, category, sector, order, cover }: Project): ProjectSummary => ({
  slug,
  title,
  category,
  sector,
  order,
  cover,
});
