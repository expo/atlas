import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import type { ModuleGraphResponse } from '~/app/--/entries/[entry]/modules/graph+api';
import { BreadcrumbLinks } from '~/components/BreadcrumbLinks';
import { BundleGraph } from '~/components/BundleGraph';
import { StateInfo } from '~/components/StateInfo';
import { EntrySelectForm } from '~/components/forms/EntrySelect';
import { ModuleFiltersForm } from '~/components/forms/ModuleFilter';
import { EntryDeltaToast, useEntry } from '~/providers/entries';
import { Layout, LayoutHeader, LayoutNavigation, LayoutTitle } from '~/ui/Layout';
import { Tag } from '~/ui/Tag';
import { fetchApi } from '~/utils/api';
import { breadcrumbsForPath } from '~/utils/entry';
import { type ModuleFilters, useModuleFilters, moduleFiltersToParams } from '~/utils/filters';
import { formatFileSize } from '~/utils/formatString';
import { type PartialAtlasEntry } from '~core/data/types';

export default function FolderPage() {
  const { path: absolutePath } = useLocalSearchParams<{ path: string }>();
  const { entry } = useEntry();
  const { filters, filtersEnabled } = useModuleFilters();
  const modules = useModuleGraphDataInFolder(entry.id, absolutePath!, filters);
  const treeHasData = !!modules.data?.data?.children?.length;

  return (
    <Layout variant="viewport">
      <LayoutNavigation>
        <EntrySelectForm />
      </LayoutNavigation>
      <LayoutHeader>
        <LayoutTitle>
          <FolderTitle entry={entry} folderPath={absolutePath!} />
          {!!modules.data && <FolderSummary data={modules.data} />}
        </LayoutTitle>
        <ModuleFiltersForm disableNodeModules />
      </LayoutHeader>
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
            {filtersEnabled ? 'Try adjusting or clearing the filters' : 'Try another bundle entry'}
          </StateInfo>
        )
      )}
    </Layout>
  );
}

function FolderTitle({ entry, folderPath }: { entry: PartialAtlasEntry; folderPath: string }) {
  const links = useMemo(() => breadcrumbsForPath(entry, folderPath), [entry, folderPath]);
  return <BreadcrumbLinks entryId={entry.id} links={links} />;
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
