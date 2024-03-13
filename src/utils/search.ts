import Fuse from 'fuse.js';

import { type StatsModule } from '../data/types';

type ModuleFilters = {
  include?: string;
  exclude?: string;
};

export function fuzzyFilterModules(items: StatsModule[], options: ModuleFilters) {
  if (!options.include && !options.exclude) {
    return items;
  }

  let results = items;
  const fuse = new Fuse(items, {
    keys: ['path'],
    useExtendedSearch: true,
    shouldSort: false,
    findAllMatches: true,
    threshold: 0.7,
  });

  if (options.include) {
    results = fuse.search(sanitizePattern(options.include)).map((result) => result.item);
  }

  if (options.exclude) {
    const excluded = new Set(
      fuse.search(sanitizePattern(options.exclude)).map((result) => result.item.path)
    );

    results = results.filter((item) => !excluded.has(item.path));
  }

  return results;
}

function sanitizePattern(pattern: string) {
  return pattern.replaceAll(/\s*,\s*/g, '|');
}
