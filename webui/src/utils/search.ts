import path from 'path';
import picomatch from 'picomatch';

import { type StatsModule } from '~core/data/types';

type ModuleFilters = {
  include?: string;
  exclude?: string;
};

/**
 * Filter the modules based on the include and exclude glob patterns.
 * Note, you can provide multiple patterns using the comma separator.
 * This also only searches the relative module path from project root, avoiding false positives.
 */
export function globFilterModules(
  items: StatsModule[],
  projectRoot: string,
  options: ModuleFilters
) {
  if (!options.include && !options.exclude) {
    return items;
  }

  const matcher = picomatch(splitPattern(options.include || '**'), {
    cwd: '',
    dot: true,
    nocase: true,
    contains: true,
    ignore: !options.exclude ? undefined : splitPattern(options.exclude),
  });

  return items.filter((item) => matcher(path.relative(projectRoot, item.path)));
}

/**
 * Split the comma separated string into an array of separate patterns.
 * This splits on any combination of `,` and whitespaces.
 */
function splitPattern(pattern: string) {
  const split = pattern.split(/\s*,\s*/).filter(Boolean);
  return split.length ? split : undefined;
}
