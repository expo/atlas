import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

import type { ModuleGraphResponse } from '~/app/--/entries/[entry]/modules/graph+api';
import { BreadcrumbLinks } from '~/components/BreadcrumbLinks';
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
import { type ModuleFilters, useModuleFilters, moduleFiltersToParams } from '~/utils/filters';
import { formatFileSize } from '~/utils/formatString';

export default function FolderPage() {
  const { path: absolutePath } = useLocalSearchParams<{ path: string }>();
  const { entry } = useEntry();
  const { filters, filtersEnabled } = useModuleFilters();
  const modules = useModuleGraphDataInFolder(entry.id, absolutePath!, filters);
  const treeHasData = !!modules.data?.data?.children?.length;

  return (
    <Layout variant="viewport">
      <LayoutNavigation>
        <BundleSelectForm />
      </LayoutNavigation>
      <LayoutHeader>
        <LayoutTitle>
          <BreadcrumbLinks entry={entry} path={absolutePath!} />
          {!!modules.data && (
            <PropertySummary>
              <Tag variant={entry.platform} />
              <span>folder</span>
              <span>
                {modules.data.filtered.moduleFiles === 1
                  ? `${modules.data.filtered.moduleFiles} module`
                  : `${modules.data.filtered.moduleFiles} modules`}
              </span>
              <span>{formatFileSize(modules.data.filtered.moduleSize)}</span>
            </PropertySummary>
          )}
        </LayoutTitle>
        <ModuleFiltersForm disableNodeModules />
      </LayoutHeader>
      <EntryDeltaToast entryId={entry.id} />
      {modules.isPending && !modules.isPlaceholderData ? (
        <StateInfo>
          <Spinner />
        </StateInfo>
      ) : modules.isError ? (
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
