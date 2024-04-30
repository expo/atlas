import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

import { BreadcrumbLinks } from '~/components/BreadcrumbLinks';
import { BundleSelectForm } from '~/components/BundleSelectForm';
import { ModuleCode } from '~/components/ModuleCode';
import { ModuleReference } from '~/components/ModuleReference';
import { PropertySummary } from '~/components/PropertySummary';
import { DataErrorState, NoDataState } from '~/components/StateInfo';
import { BundleDeltaToast, useBundle } from '~/providers/bundle';
import { Layout, LayoutHeader, LayoutNavigation, LayoutTitle } from '~/ui/Layout';
import { Skeleton } from '~/ui/Skeleton';
import { Tag } from '~/ui/Tag';
import { fetchApi, handleApiError } from '~/utils/api';
import { formatFileSize } from '~/utils/formatString';
import { type AtlasModule } from '~core/data/types';

export default function ModulePage() {
  const { bundle } = useBundle();
  const { path: absolutePath } = useLocalSearchParams<{ path: string }>();
  const module = useModuleData(bundle.id, absolutePath!);

  return (
    <Layout>
      <BundleDeltaToast bundle={bundle} modulePath={absolutePath} />

      <LayoutNavigation>
        <BundleSelectForm />
      </LayoutNavigation>
      <LayoutHeader>
        <LayoutTitle>
          <BreadcrumbLinks bundle={bundle} path={absolutePath!} />
          <PropertySummary>
            <Tag variant={bundle.platform} />
            {!!module.data?.package && <span>{module.data.package}</span>}
            {!!module.data && <span>{getModuleType(module.data)}</span>}
            {!!module.data && <span>{formatFileSize(module.data.size)}</span>}
          </PropertySummary>
        </LayoutTitle>
      </LayoutHeader>

      {module.isLoading ? (
        <ModulePageSkeleton />
      ) : module.isError ? (
        <DataErrorState title="Failed to load module." />
      ) : !module.data ? (
        <NoDataState title="Module not found." />
      ) : (
        <div className="mx-6 mb-4">
          <ModuleReference className="mb-2 my-6" bundle={bundle} module={module.data} />
          <div className="mx-2 my-8">
            <h3 className="font-semibold my-2">Module content</h3>
            <ModuleCode module={module.data} />
          </div>
        </div>
      )}
    </Layout>
  );
}

function getModuleType(module: AtlasModule) {
  const type = module.path.includes('?ctx=') ? 'require.context' : 'file';
  return module.package ? `package ${type}` : type;
}

/** Load the module data from API, by path reference only */
function useModuleData(bundleId: string, path: string) {
  return useQuery<AtlasModule>({
    refetchOnWindowFocus: false,
    queryKey: [`bundles`, bundleId, `module`, path],
    queryFn: async ({ queryKey }) => {
      const [_key, bundle, _module, path] = queryKey as [string, string, string, string];
      return fetchApi(`/bundles/${bundle}/modules`, {
        method: 'POST',
        body: JSON.stringify({ path }),
      })
        .then(handleApiError)
        .then((response) => response?.json());
    },
  });
}

function ModulePageSkeleton() {
  return (
    <div className="flex flex-col mx-8 gap-4">
      <Skeleton className="w-52 h-6 bg-selected" />
      <Skeleton className="w-96 h-6 bg-selected" />
      <Skeleton className="w-52 h-6 bg-selected mt-4" />
      <Skeleton className="grow h-96 rounded-md" />
    </div>
  );
}
