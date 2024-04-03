import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { ModuleGraphResponse } from '~/app/api/stats/[entry]/modules/graph+api';
import { Page, PageHeader, PageTitle } from '~/components/Page';
import {
  type ModuleFilters,
  StatsModuleFilter,
  statsModuleFiltersToUrlParams,
  useStatsModuleFilters,
} from '~/components/forms/StatsModuleFilter';
import { BundleGraph } from '~/components/graphs/BundleGraph';
import { useStatsEntry } from '~/providers/stats';
import { Spinner } from '~/ui/Spinner';
import { Tag } from '~/ui/Tag';
import { fetchApi } from '~/utils/api';
import { formatFileSize } from '~/utils/formatString';

export default function StatsPage() {
  const { entry } = useStatsEntry();
  const { filters, filtersEnabled } = useStatsModuleFilters();
  const modules = useModuleGraphData(entry.id, filters);
  const treeHasData = !!modules.data?.data?.children?.length;

  return (
    <Page variant="viewport">
      <div className="flex flex-1 flex-col">
        <PageHeader>
          <PageTitle>
            <h1 className="text-lg font-bold mr-4">Bundle</h1>
            {!!modules.data && <BundleSummary data={modules.data} />}
          </PageTitle>
          <StatsModuleFilter />
        </PageHeader>
        {(modules.isPending && !modules.isPlaceholderData) || modules.isError ? (
          <div className="flex flex-1 justify-center items-center text-secondary">
            {modules.isError ? 'Could not load the graph, try reloading this page' : <Spinner />}
          </div>
        ) : treeHasData ? (
          <BundleGraph entry={entry} graph={modules.data!.data} />
        ) : (
          <div className="flex flex-1 justify-center items-center text-secondary">
            {!filtersEnabled ? 'No data available' : 'No data available, try resetting the filters'}
          </div>
        )}
      </div>
    </Page>
  );
}

function BundleSummary({ data }: { data: ModuleGraphResponse }) {
  return (
    <div className="font-sm text-secondary inline-block">
      <Tag variant={data.entry.platform} />
      <span className="text-tertiary mx-2 select-none">-</span>
      <span>{data.entry.moduleFiles} modules</span>
      <span className="text-tertiary mx-2 select-none">-</span>
      <span>{formatFileSize(data.entry.moduleSize)}</span>
      {data.filtered.moduleFiles !== data.entry.moduleFiles && (
        <div className="text-tertiary italic inline">
          <span className="mx-2 select-none">—</span>
          <span className="mr-2 select-none italic ">visible:</span>
          <span>{data.filtered.moduleFiles} modules</span>
          <span className="mx-2 select-none">-</span>
          <span>{formatFileSize(data.filtered.moduleSize)}</span>
        </div>
      )}
    </div>
  );
}

/** Load the bundle graph data from API, with default or custom filters */
function useModuleGraphData(entryId: string, filters: ModuleFilters) {
  return useQuery<ModuleGraphResponse>({
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    queryKey: [`bundle-graph`, entryId, filters],
    queryFn: ({ queryKey }) => {
      const [_key, entry, filters] = queryKey as [string, string, ModuleFilters | undefined];
      const url = filters
        ? `/api/stats/${entry}/modules/graph?${statsModuleFiltersToUrlParams(filters)}`
        : `/api/stats/${entry}/modules/graph`;

      return fetchApi(url)
        .then((res) => (res.ok ? res : Promise.reject(res)))
        .then((res) => res.json());
    },
  });
}
