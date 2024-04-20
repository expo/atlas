import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';

import { BreadcrumbLinks } from '~/components/BreadcrumbLinks';
import { BundleSelectForm } from '~/components/BundleSelectForm';
import { ModuleCode } from '~/components/ModuleCode';
import { PropertySummary } from '~/components/PropertySummary';
import { StateInfo } from '~/components/StateInfo';
import { BundleDeltaToast, useBundle } from '~/providers/bundle';
import { Layout, LayoutHeader, LayoutNavigation, LayoutTitle } from '~/ui/Layout';
import { Skeleton } from '~/ui/Skeleton';
import { Tag } from '~/ui/Tag';
import { fetchApi } from '~/utils/api';
import { relativeBundlePath } from '~/utils/bundle';
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
        <StateInfo title="Failed to load module.">
          Try restarting Expo Atlas. If this error keeps happening, open a bug report.
        </StateInfo>
      ) : !module.data ? (
        <StateInfo title="Module not found.">Try another bundle entry</StateInfo>
      ) : (
        <div className="mx-8 mb-4">
          {!!module.data.importedBy?.length && (
            <div className="my-4">
              <p className="text-md">Imported from:</p>
              <ul style={{ listStyle: 'initial' }} className="mb-6">
                {module.data.importedBy.map((path) => (
                  <li key={path} className="ml-4">
                    <Link
                      className="text-link hover:underline"
                      href={{
                        pathname: '/(atlas)/[entry]/modules/[path]',
                        params: { entry: bundle.id, path },
                      }}
                    >
                      {relativeBundlePath(bundle, path)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ModuleCode module={module.data} />
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
function useModuleData(entryId: string, path: string) {
  return useQuery<AtlasModule>({
    refetchOnWindowFocus: false,
    queryKey: [`entries`, entryId, `module`, path],
    queryFn: async ({ queryKey }) => {
      const [_key, entry, _module, path] = queryKey as [string, string, string, string];
      return fetchApi(`/entries/${entry}/modules`, {
        method: 'POST',
        body: JSON.stringify({ path }),
      })
        .then((res) => (res.ok ? res : Promise.reject(res)))
        .then((res) => res.json());
    },
  });
}

function ModulePageSkeleton() {
  return (
    <div className="flex flex-col mx-8 gap-4">
      <Skeleton className="w-52 h-6 bg-selected" />
      <Skeleton className="w-96 h-6 bg-selected" />
      <Skeleton className="grow h-96 rounded-md" />
    </div>
  );
}
