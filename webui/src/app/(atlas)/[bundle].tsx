import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { ModuleGraphResponse } from '~/app/--/bundles/[bundle]/modules/graph+api';
import { BundleGraph } from '~/components/BundleGraph';
import { BundleSelectForm } from '~/components/BundleSelectForm';
import { BundleTag } from '~/components/BundleTag';
import { FileSize } from '~/components/FileSize';
import { ModuleFiltersForm } from '~/components/ModuleFilterForm';
import { PropertySummary } from '~/components/PropertySummary';
import {
  DataErrorState,
  LoadingState,
  NoDataState,
  NoDataWithFiltersState,
} from '~/components/StateInfo';
import { useModuleFilters } from '~/hooks/useModuleFilters';
import { useBundle } from '~/providers/bundle';
import { Layout, LayoutHeader, LayoutNavigation, LayoutTitle } from '~/ui/Layout';
import { fetchApi, handleApiError } from '~/utils/api';
import { type ModuleFilters, moduleFiltersToParams } from '~/utils/filters';

export default function BundlePage() {
  const { bundle } = useBundle();
  const { filters, filtersEnabled, resetFilters } = useModuleFilters();
  const modules = useModuleGraphData(bundle.id, filters);

  const treeHasData = !!modules.data?.data?.children?.length;
  const modulesAreFiltered = modules.data
    ? modules.data.filtered.moduleFiles !== modules.data.bundle.moduleFiles
    : null;

  return (
    <Layout variant="viewport">
      <LayoutNavigation>
        <BundleSelectForm />
      </LayoutNavigation>
      <LayoutHeader>
        <LayoutTitle>
          <h1 className="text-lg font-bold mr-8">Bundle</h1>
          <PropertySummary>
            <BundleTag platform={bundle.platform} environment={bundle.environment} />
            {!!modules.data && <span>{modules.data.bundle.moduleFiles} modules</span>}
            {!!modules.data && <FileSize byteSize={modules.data.bundle.moduleSize} />}
            {!!modules.data && modulesAreFiltered && (
              <PropertySummary
                className="text-tertiary italic"
                prefix={<span className="select-none mr-2">visible:</span>}
              >
                <span>{modules.data.filtered.moduleFiles} modules</span>
                <FileSize byteSize={modules.data.filtered.moduleSize} />
              </PropertySummary>
            )}
          </PropertySummary>
        </LayoutTitle>
        <ModuleFiltersForm />
      </LayoutHeader>

      {modules.isPending && !modules.isPlaceholderData ? (
        <LoadingState />
      ) : modules.isError ? (
        <DataErrorState title="Failed to generate graph." />
      ) : treeHasData ? (
        <BundleGraph bundle={bundle} graph={modules.data!.data} />
      ) : filtersEnabled ? (
        <NoDataWithFiltersState onResetFilters={resetFilters} />
      ) : (
        <NoDataState />
      )}
    </Layout>
  );
}

/** Load the bundle graph data from API, with default or custom filters */
function useModuleGraphData(bundleId: string, filters: ModuleFilters) {
  return useQuery<ModuleGraphResponse>({
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    queryKey: [`bundles`, bundleId, 'bundle-graph', filters],
    queryFn: ({ queryKey }) => {
      const [_key, bundle, _graph, filters] = queryKey as [
        string,
        string,
        string,
        ModuleFilters | undefined,
      ];

      const url = filters
        ? `/bundles/${bundle}/modules/graph?${moduleFiltersToParams(filters)}`
        : `/bundles/${bundle}/modules/graph`;

      return fetchApi(url)
        .then(handleApiError)
        .then((response) => response?.json());
    },
  });
}
