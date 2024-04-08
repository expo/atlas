import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { ModuleGraphResponse } from '~/app/--/entries/[entry]/modules/graph+api';
import { BundleGraph } from '~/components/BundleGraph';
import { Page, PageHeader, PageTitle } from '~/components/Page';
import { StateInfo } from '~/components/StateInfo';
import { ModuleFiltersForm } from '~/components/forms/ModuleFilter';
import { useEntry } from '~/providers/entries';
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
    <Page variant="viewport">
      <div className="flex flex-1 flex-col">
        <PageHeader>
          <PageTitle>
            <h1 className="text-lg font-bold mr-4">Bundle</h1>
            {!!modules.data && <BundleSummary data={modules.data} />}
          </PageTitle>
          <ModuleFiltersForm />
        </PageHeader>
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
              {filtersEnabled
                ? 'Try adjusting or clearing the filters'
                : 'Try another bundle entry'}
            </p>
          </StateInfo>
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
        ? `/entries/${entry}/modules/graph?${moduleFiltersToParams(filters)}`
        : `/entries/${entry}/modules/graph`;

      return fetchApi(url)
        .then((res) => (res.ok ? res : Promise.reject(res)))
        .then((res) => res.json());
    },
  });
}
