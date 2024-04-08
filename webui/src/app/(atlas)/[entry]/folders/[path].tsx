import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

import type { ModuleGraphResponse } from '~/app/--/entries/[entry]/modules/graph+api';
import { BundleGraph } from '~/components/BundleGraph';
import { Page, PageHeader, PageTitle } from '~/components/Page';
import { StateInfo } from '~/components/StateInfo';
import { ModuleFiltersForm } from '~/components/forms/ModuleFilter';
import { EntryDeltaToast, useEntry } from '~/providers/entries';
import { Tag } from '~/ui/Tag';
import { fetchApi } from '~/utils/api';
import { relativeEntryPath } from '~/utils/entry';
import { type ModuleFilters, useModuleFilters, moduleFiltersToParams } from '~/utils/filters';
import { formatFileSize } from '~/utils/formatString';

export default function FolderPage() {
  const { path: absolutePath } = useLocalSearchParams<{ path: string }>();
  const { entry } = useEntry();
  const { filters, filtersEnabled } = useModuleFilters();
  const modules = useModuleGraphDataInFolder(entry.id, absolutePath!, filters);
  const treeHasData = !!modules.data?.data?.children?.length;

  return (
    <Page variant="viewport">
      <div className="flex flex-1 flex-col">
        <PageHeader>
          <PageTitle>
            <h1 className="text-slate-50 font-bold text-lg mr-4" title={absolutePath}>
              {relativeEntryPath(entry, absolutePath!)}/
            </h1>
            {!!modules.data && <FolderSummary data={modules.data} />}
          </PageTitle>
          <ModuleFiltersForm disableNodeModules />
        </PageHeader>
        <EntryDeltaToast entryId={entry.id} />
        {modules.isError ? (
          <StateInfo title="Failed to generate graph.">
            Try restarting Expo Atlas. If this error keeps happening, open a bug report.
          </StateInfo>
        ) : treeHasData ? (
          <BundleGraph entry={entry} graph={modules.data!.data} />
        ) : (
          !modules.isPending && (
            <StateInfo title={filtersEnabled ? 'No data matching filters' : 'No data available'}>
              <p>
                {filtersEnabled
                  ? 'Try adjusting or clearing the filters'
                  : 'Try another bundle entry'}
              </p>
            </StateInfo>
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
    queryKey: [`entries`, entryId, `module`, path, filters],
    queryFn: async ({ queryKey }) => {
      const [_key, entry, _module, path, filters] = queryKey as [
        string,
        string,
        string,
        string,
        ModuleFilters | undefined,
      ];

      const url = filters
        ? `/entries/${entry}/modules/graph?path=${encodeURIComponent(path)}&${moduleFiltersToParams(filters)}`
        : `/entries/${entry}/modules/graph?path=${encodeURIComponent(path)}`;

      return fetchApi(url)
        .then((res) => (res.ok ? res : Promise.reject(res)))
        .then((res) => res.json());
    },
  });
}
