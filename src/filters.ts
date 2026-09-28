/** Normalizes query filters and matches all filters against one entry. */
import type { Submission } from './schema';

export function parseFilterValues(raw: unknown): string[] {
  const values = typeof raw === 'string' ? [raw] : raw;
  if (!Array.isArray(values) || !values.every(value => typeof value === 'string')) return [];
  const normalized: string[] = [];
  for (const value of values) {
    for (const part of value.split(',')) {
      const item = part.trim().toLowerCase();
      if (item && !normalized.includes(item)) normalized.push(item);
    }
  }
  return normalized;
}
export function matchesFilters(submission: Submission, filters: { attackTypes: string[]; surfaces: string[] }): boolean {
  return submission.incidents.some(entry =>
    (!filters.attackTypes.length || filters.attackTypes.includes(entry.attackType.trim().toLowerCase())) &&
    (!filters.surfaces.length || filters.surfaces.includes(entry.surface.trim().toLowerCase())));
}
