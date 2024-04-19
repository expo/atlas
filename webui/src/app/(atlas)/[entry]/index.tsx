import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { ModuleGraphResponse } from '~/app/--/entries/[entry]/modules/graph+api';
import { BundleGraph } from '~/components/BundleGraph';
import { BundleSelectForm } from '~/components/BundleSelectForm';
import { ModuleFiltersForm } from '~/components/ModuleFilterForm';
import { PropertySummary } from '~/components/PropertySummary';
import { StateInfo } from '~/components/StateInfo';
import { EntryDeltaToast, useEntry } from '~/providers/entries';
import { Layout, LayoutHeader, LayoutNavigation, LayoutTitle } from '~/ui/Layout';
import { Spinner } from '~/ui/Spinner';
import { Tag } from '~/ui/Tag';
import { fetchApi } from '~/utils/api';
import { type ModuleFilters, moduleFiltersToParams, useModuleFilters } from '~/utils/filters';
import { formatFileSize } from '~/utils/formatString';

export default function BundlePage() {
  const { entry } = useEntry();
  const { filters, filtersEnabled } = useModuleFilters();
  const modules = useModuleGraphData(entry.id, filters);
  const treeHasData = !!modules.data?.data?.children?.length;

  return (
    <Layout variant="viewport">
      <LayoutNavigation>
        <BundleSelectForm />
      </LayoutNavigation>
      <LayoutHeader>
        <LayoutTitle>
          <h1 className="text-lg font-bold mr-8">Bundle</h1>
          <PropertySummary>
            <Tag variant={entry.platform} />
            {!!modules.data && <span>{modules.data.entry.moduleFiles} modules</span>}
            {!!modules.data && <span>{formatFileSize(modules.data.entry.moduleSize)}</span>}
            {modules.data &&
              modules.data.filtered.moduleFiles !== modules.data.entry.moduleFiles && (
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
      <EntryDeltaToast entryId={entry.id} />
      {modules.isPending && !modules.isPlaceholderData ? (
        <StateInfo>
          <Spinner />
        </StateInfo>
      ) : modules.isError ? (
        <StateInfo title="Failed to generate graph.">
          <p>Try restarting Expo Atlas. If this error keeps happening, open a bug report.</p>
        </StateInfo>
      ) : treeHasData ? (
        <BundleGraph entry={entry} graph={modules.data!.data} />
      ) : (
        <StateInfo title={filtersEnabled ? 'No data matching filters' : 'No data available'}>
          <p>
            {filtersEnabled ? 'Try adjusting or clearing the filters' : 'Try another bundle entry'}
          </p>
        </StateInfo>
      )}
    </Layout>
  );
}

/** Load the bundle graph data from API, with default or custom filters */
function useModuleGraphData(entryId: string, filters: ModuleFilters) {
  return useQuery<ModuleGraphResponse>({
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    queryKey: [`entries`, entryId, 'bundle-graph', filters],
    queryFn: ({ queryKey }) => {
      const [_key, entry, _graph, filters] = queryKey as [
        string,
        string,
        string,
        ModuleFilters | undefined,
      ];

      const url = filters
        ? `/entries/${entry}/modules/graph?${moduleFiltersToParams(filters)}`
        : `/entries/${entry}/modules/graph`;

      return fetchApi(url)
        .then((res) => (res.ok ? res : Promise.reject(res)))
        .then((res) => res.json());
    },
  });
}
