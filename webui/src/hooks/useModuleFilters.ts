import { useGlobalSearchParams, useRouter } from 'expo-router';

import { DEFAULT_FILTERS, type ModuleFilters } from '~/utils/filters';

/**
 * Get the current module filters from URL search params, using Expo Router.
 * This returns the filters, with default values, and if any of the filters has been defined.
 */
export function useModuleFilters() {
  const router = useRouter();
  const filters = useGlobalSearchParams<ModuleFilters>();
  return {
    filters,
    filtersEnabled: !!filters.scope || !!filters.include || !!filters.exclude,
    resetFilters: () => router.setParams(DEFAULT_FILTERS),
  };
}
