import { useQuery } from '@tanstack/react-query';

import type { EntryGraphData } from '~/app/api/stats/[entry]/modules/index+api';
import { Page, PageHeader, PageTitle } from '~/components/Page';
import { StatsModuleFilter } from '~/components/forms/StatsModuleFilter';
import { TreemapGraph } from '~/components/graphs/TreemapGraph';
import {
  type ModuleFilters,
  useModuleFilterContext,
  filtersToUrlParams,
} from '~/providers/modules';
import { useStatsEntryContext } from '~/providers/stats';
import { Tag } from '~/ui/Tag';
import { formatFileSize } from '~/utils/formatString';

export default function GraphScreen() {
  const { entryId } = useStatsEntryContext();
  const { filters } = useModuleFilterContext();

  const graph = useBundleGraphData(entryId, filters);

  return (
    <Page variant="viewport">
      <div className="flex flex-1 flex-col">
        <PageHeader>
          <PageTitle>
            <h1 className="text-lg font-bold mr-4">Bundle</h1>
            {!!graph.data && <BundleSummary data={graph.data} />}
          </PageTitle>
          <StatsModuleFilter />
        </PageHeader>
        <TreemapGraph key={`bundle-graph-${entryId}`} modules={graph.data?.data?.modules ?? []} />
      </div>
    </Page>
  );
}

function BundleSummary({ data }: { data: EntryGraphData }) {
  return (
    <div className="font-sm text-secondary inline-block">
      <Tag variant={data.metadata.platform} />
      <span className="text-tertiary mx-2 select-none">-</span>
      <span>{data.metadata.modulesCount} modules</span>
      <span className="text-tertiary mx-2 select-none">-</span>
      <span>{formatFileSize(data.metadata.size)}</span>
      {data.metadata.modulesCount !== data.data.modulesCount && (
        <div className="text-tertiary italic inline">
          <span className="mx-2 select-none">—</span>
          <span className="mr-2 select-none italic ">visible:</span>
          <span>{data.data.modulesCount} modules</span>
          <span className="mx-2 select-none">-</span>
          <span>{formatFileSize(data.data.size)}</span>
        </div>
      )}
    </div>
  );
}

/** Load the bundle graph data from API, with default or custom filters */
function useBundleGraphData(entryId: string, filters?: ModuleFilters) {
  return useQuery<EntryGraphData>({
    queryKey: [`bundle-graph`, entryId, filters],
    queryFn: ({ queryKey }) => {
      const [_key, entry, filters] = queryKey as [string, string, ModuleFilters | undefined];
      const url = filters
        ? `/api/stats/${entry}/modules?${filtersToUrlParams(filters)}`
        : `/api/stats/${entry}/modules`;

      return fetch(url)
        .then((res) => (res.ok ? res : Promise.reject(res)))
        .then((res) => res.json());
    },
  });
}
