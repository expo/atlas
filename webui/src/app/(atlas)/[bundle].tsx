import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { ModuleGraphResponse } from '~/app/--/bundles/[bundle]/modules/graph+api';
import { BundleGraph } from '~/components/BundleGraph';
import { BundleSelectForm } from '~/components/BundleSelectForm';
import { ModuleFiltersForm } from '~/components/ModuleFilterForm';
import { PropertySummary } from '~/components/PropertySummary';
import { StateInfo } from '~/components/StateInfo';
import { BundleDeltaToast, useBundle } from '~/providers/bundle';
import { Layout, LayoutHeader, LayoutNavigation, LayoutTitle } from '~/ui/Layout';
import { Spinner } from '~/ui/Spinner';
import { Tag } from '~/ui/Tag';
import { fetchApi, handleApiError } from '~/utils/api';
import { type ModuleFilters, moduleFiltersToParams, useModuleFilters } from '~/utils/filters';
import { formatFileSize } from '~/utils/formatString';

export default function BundlePage() {
  const { bundle } = useBundle();
  const { filters, filtersEnabled } = useModuleFilters();
  const modules = useModuleGraphData(bundle.id, filters);
  const treeHasData = !!modules.data?.data?.children?.length;

  return (
    <Layout variant="viewport">
      <BundleDeltaToast bundle={bundle} />

      <LayoutNavigation>
        <BundleSelectForm />
      </LayoutNavigation>
      <LayoutHeader>
        <LayoutTitle>
          <h1 className="text-lg font-bold mr-8">Bundle</h1>
          <PropertySummary>
            <Tag variant={bundle.platform} />
            {!!modules.data && <span>{modules.data.bundle.moduleFiles} modules</span>}
            {!!modules.data && <span>{formatFileSize(modules.data.bundle.moduleSize)}</span>}
            {modules.data &&
              modules.data.filtered.moduleFiles !== modules.data.bundle.moduleFiles && (
                <PropertySummary
                  className="text-tertiary italic"
                  prefix={<span className="select-none mr-2">visible:</span>}
                >
                  <span>{modules.data.filtered.moduleFiles} modules</span>
                  <span>{formatFileSize(modules.data.filtered.moduleSize)}</span>
                </PropertySummary>
              )}
          </PropertySummary>
        </LayoutTitle>
        <ModuleFiltersForm />
      </LayoutHeader>

      {modules.isPending && !modules.isPlaceholderData ? (
        <StateInfo>
          <Spinner />
        </StateInfo>
      ) : modules.isError ? (
        <StateInfo title="Failed to generate graph.">
          <p>Try restarting Expo Atlas. If this error keeps happening, open a bug report.</p>
        </StateInfo>
      ) : treeHasData ? (
        <BundleGraph bundle={bundle} graph={modules.data!.data} />
      ) : (
        <StateInfo title={filtersEnabled ? 'No data matching filters' : 'No data available'}>
          <p>{filtersEnabled ? 'Try adjusting or clearing the filters' : 'Try another bundle'}</p>
        </StateInfo>
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
