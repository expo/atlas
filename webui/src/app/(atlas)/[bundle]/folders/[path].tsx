import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

import type { ModuleGraphResponse } from '~/app/--/bundles/[bundle]/modules/graph+api';
import { BreadcrumbLinks } from '~/components/BreadcrumbLinks';
import { BundleGraph } from '~/components/BundleGraph';
import { BundleSelectForm } from '~/components/BundleSelectForm';
import { ModuleFiltersForm } from '~/components/ModuleFilterForm';
import { PropertySummary } from '~/components/PropertySummary';
import {
  DataErrorState,
  LoadingState,
  NoDataState,
  NoDataWithFiltersState,
} from '~/components/StateInfo';
import { BundleDeltaToast, useBundle } from '~/providers/bundle';
import { Layout, LayoutHeader, LayoutNavigation, LayoutTitle } from '~/ui/Layout';
import { Tag } from '~/ui/Tag';
import { fetchApi, handleApiError } from '~/utils/api';
import { type ModuleFilters, useModuleFilters, moduleFiltersToParams } from '~/utils/filters';
import { formatFileSize } from '~/utils/formatString';

export default function FolderPage() {
  const { path: absolutePath } = useLocalSearchParams<{ path: string }>();
  const { bundle } = useBundle();
  const { filters, filtersEnabled } = useModuleFilters();
  const modules = useModuleGraphDataInFolder(bundle.id, absolutePath!, filters);
  const treeHasData = !!modules.data?.data?.children?.length;

  return (
    <Layout variant="viewport">
      <BundleDeltaToast bundle={bundle} />

      <LayoutNavigation>
        <BundleSelectForm />
      </LayoutNavigation>
      <LayoutHeader>
        <LayoutTitle>
          <BreadcrumbLinks bundle={bundle} path={absolutePath!} />
          <PropertySummary>
            <Tag variant={bundle.platform} />
            <span>folder</span>
            {!!modules.data?.filtered.moduleFiles && (
              <span>
                {modules.data.filtered.moduleFiles === 1
                  ? `${modules.data.filtered.moduleFiles} module`
                  : `${modules.data.filtered.moduleFiles} modules`}
              </span>
            )}
            {!!modules.data?.filtered.moduleSize && (
              <span>{formatFileSize(modules.data.filtered.moduleSize)}</span>
            )}
          </PropertySummary>
        </LayoutTitle>
        <ModuleFiltersForm disableNodeModules />
      </LayoutHeader>

      {modules.isPending && !modules.isPlaceholderData ? (
        <LoadingState />
      ) : modules.isError ? (
        <DataErrorState title="Failed to generate graph." />
      ) : treeHasData ? (
        <BundleGraph bundle={bundle} graph={modules.data!.data} />
      ) : filtersEnabled ? (
        <NoDataWithFiltersState />
      ) : (
        <NoDataState />
      )}
    </Layout>
  );
}

/** Load the folder data from API, by path reference only */
function useModuleGraphDataInFolder(bundleId: string, path: string, filters: ModuleFilters) {
  return useQuery<ModuleGraphResponse>({
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    queryKey: [`bundles`, bundleId, `module`, path, filters],
    queryFn: async ({ queryKey }) => {
      const [_key, bundle, _module, path, filters] = queryKey as [
        string,
        string,
        string,
        string,
        ModuleFilters | undefined,
      ];

      const url = filters
        ? `/bundles/${bundle}/modules/graph?path=${encodeURIComponent(path)}&${moduleFiltersToParams(filters)}`
        : `/bundles/${bundle}/modules/graph?path=${encodeURIComponent(path)}`;

      return fetchApi(url)
        .then(handleApiError)
        .then((response) => response?.json());
    },
  });
}
