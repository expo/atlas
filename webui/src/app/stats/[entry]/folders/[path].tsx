import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

import type { ModuleGraphResponse } from '~/app/api/stats/[entry]/modules/graph+api';
import { BundleGraph } from '~/components/BundleGraph';
import { Page, PageHeader, PageTitle } from '~/components/Page';
import {
  ModuleFilters,
  StatsModuleFilter,
  statsModuleFiltersToUrlParams,
  useStatsModuleFilters,
} from '~/components/forms/StatsModuleFilter';
import { useStatsEntry } from '~/providers/stats';
import { Tag } from '~/ui/Tag';
import { fetchApi } from '~/utils/api';
import { formatFileSize } from '~/utils/formatString';
import { relativeEntryPath } from '~/utils/stats';

export default function FolderPage() {
  const { path: absolutePath } = useLocalSearchParams<{ path: string }>();
  const { entry } = useStatsEntry();
  const { filters, filtersEnabled } = useStatsModuleFilters();
  const modules = useModuleGraphDataInFolder(entry.id, absolutePath, filters);
  const treeHasData = !!modules.data?.data?.children?.length;

  return (
    <Page variant="viewport">
      <div className="flex flex-1 flex-col">
        <PageHeader>
          <PageTitle>
            <h1 className="text-slate-50 font-bold text-lg mr-4" title={absolutePath}>
              {relativeEntryPath(entry, absolutePath)}/
            </h1>
            {!!modules.data && <FolderSummary data={modules.data} />}
          </PageTitle>
          <StatsModuleFilter disableNodeModules />
        </PageHeader>
        {modules.isError ? (
          <div className="flex flex-1 justify-center items-center text-secondary">
            Could not load the graph, try reloading this page
          </div>
        ) : treeHasData ? (
          <BundleGraph entry={entry} graph={modules.data!.data} />
        ) : (
          !modules.isPending && (
            <div className="flex flex-1 justify-center items-center text-secondary">
              {!filtersEnabled
                ? 'No data available'
                : 'No data available, try resetting the filters'}
            </div>
          )
        )}
      </div>
    </Page>
  );
}

function FolderSummary({ data }: { data: ModuleGraphResponse }) {
  return (
    <div className="font-sm text-secondary">
      {!!data.entry.platform && (
        <>
          <Tag variant={data.entry.platform} />
          <span className="text-tertiary mx-2 select-none">-</span>
        </>
      )}
      <span>folder</span>
      <span className="text-tertiary mx-2 select-none">-</span>
      <span>
        {data.filtered.moduleFiles === 1
          ? `${data.filtered.moduleFiles} module`
          : `${data.filtered.moduleFiles} modules`}
      </span>
      <span className="text-tertiary mx-2 select-none">-</span>
      <span>{formatFileSize(data.filtered.moduleSize)}</span>
    </div>
  );
}

/** Load the folder data from API, by path reference only */
function useModuleGraphDataInFolder(entryId: string, path: string, filters: ModuleFilters) {
  return useQuery<ModuleGraphResponse>({
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    queryKey: [`module`, entryId, path, filters],
    queryFn: async ({ queryKey }) => {
      const [_key, entry, path, filters] = queryKey as [
        string,
        string,
        string,
        ModuleFilters | undefined,
      ];
      const url = filters
        ? `/api/stats/${entry}/modules/graph?path=${encodeURIComponent(path)}&${statsModuleFiltersToUrlParams(filters)}`
        : `/api/stats/${entry}/modules/graph?path=${encodeURIComponent(path)}`;

      return fetchApi(url)
        .then((res) => (res.ok ? res : Promise.reject(res)))
        .then((res) => res.json());
    },
  });
}
