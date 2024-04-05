import { useGlobalSearchParams } from 'expo-router';
import path from 'path';
import picomatch from 'picomatch';

import { type AtlasModule } from '~core/data/types';

export type ModuleFilters = {
  /** Only match the project code, or all code including (external) packages  */
  scope?: 'project';
  /** Include results based on comma separated glob patterns */
  include?: string;
  /** Exclude results based on comma separated glob patterns */
  exclude?: string;
};

/** The default filters to use */
export const DEFAULT_FILTERS: ModuleFilters = {
  scope: undefined,
  include: undefined,
  exclude: undefined,
};

/**
 * Get the module filters based on query parameters.
 *   - `modules=project,node_modules` to show only project code and/or node_modules
 *   - `include=<glob>` to only include specific glob patterns
 *   - `exclude=<glob>` to only exclude specific glob patterns
 */
export function moduleFiltersFromParams(params: URLSearchParams): ModuleFilters {
  const scope = params.get('scope') || undefined;
  return {
    scope: scope === 'project' ? scope : undefined,
    include: params.get('include') || undefined,
    exclude: params.get('exclude') || undefined,
  };
}

/**
 * Get the query parameters string for the module filters.
 * This only applies the filters that are set.
 */
export function moduleFiltersToParams(filters: ModuleFilters) {
  const params = new URLSearchParams();

  if (filters.scope) params.set('scope', filters.scope);
  if (filters.include) params.set('include', filters.include);
  if (filters.exclude) params.set('exclude', filters.exclude);

  return params;
}

/**
 * Get the current module filters from URL search params, using Expo Router.
 * This returns the filters, with default values, and if any of the filters has been defined.
 */
export function useModuleFilters() {
  const filters = useGlobalSearchParams<ModuleFilters>();
  return {
    filtersEnabled: !!filters.scope || !!filters.include || !!filters.exclude,
    filters,
  };
}

/** Filter the modules based on the filters, and an optional (root) path. */
export function filterModules(
  modules: AtlasModule[],
  options: {
    projectRoot: string;
    filters: ModuleFilters;
    rootPath?: string;
  }
) {
  const { filters, projectRoot, rootPath } = options;

  if (rootPath || filters.scope === 'project') {
    modules = modules.filter(
      (module) =>
        (!rootPath || module.path.startsWith(rootPath)) &&
        (filters.scope !== 'project' || !module.package)
    );
  }

  if (filters.include || filters.exclude) {
    const matcher = picomatch(splitPattern(options.filters.include) || '**', {
      cwd: '',
      dot: true,
      nocase: true,
      contains: true,
      ignore: !options.filters.exclude ? undefined : splitPattern(options.filters.exclude),
    });

    modules = modules.filter((module) => matcher(path.relative(projectRoot, module.path)));
  }

  return modules;
}

/**
 * Split the comma separated string into an array of separate patterns.
 * This splits on any combination of `,` and whitespaces.
 */
function splitPattern(pattern = '') {
  if (!pattern) return undefined;
  const split = pattern.split(/\s*,\s*/).filter(Boolean);
  return split.length ? split : undefined;
}
