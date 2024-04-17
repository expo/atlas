import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { BreadcrumbLinks } from '~/components/BreadcrumbLinks';
import { ModuleCode } from '~/components/ModuleCode';
import { Page, PageHeader, PageTitle } from '~/components/Page';
import { StateInfo } from '~/components/StateInfo';
import { EntryDeltaToast, useEntry } from '~/providers/entries';
import { Skeleton } from '~/ui/Skeleton';
import { Tag } from '~/ui/Tag';
import { fetchApi } from '~/utils/api';
import { breadcrumbsForPath, relativeEntryPath } from '~/utils/entry';
import { formatFileSize } from '~/utils/formatString';
import { type PartialAtlasEntry, type AtlasModule } from '~core/data/types';

export default function ModulePage() {
  const { entry } = useEntry();
  const { path: absolutePath } = useLocalSearchParams<{ path: string }>();
  const module = useModuleData(entry.id, absolutePath!);

  if (module.isLoading) {
    return <ModulePageSkeleton />;
  }

  if (!module.data) {
    return <StateInfo title="Module not found.">Try another bundle entry</StateInfo>;
  }

  if (module.isError) {
    return (
      <StateInfo title="Failed to load module.">
        Try restarting Expo Atlas. If this error keeps happening, open a bug report.
      </StateInfo>
    );
  }

  return (
    <Page>
      <PageHeader>
        <PageTitle>
          <ModuleTitle entry={entry} modulePath={absolutePath!} />
          <ModuleSummary platform={entry?.platform} module={module.data} />
        </PageTitle>
      </PageHeader>
      <EntryDeltaToast entryId={entry.id} modulePath={absolutePath} />
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
                      params: { entry: entry.id, path },
                    }}
                  >
                    {relativeEntryPath(entry, path)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ModuleCode module={module.data} />
      </div>
    </Page>
  );
}

function ModuleTitle({ entry, modulePath }: { entry: PartialAtlasEntry; modulePath: string }) {
  const links = useMemo(() => breadcrumbsForPath(entry, modulePath), [entry, modulePath]);
  return <BreadcrumbLinks entryId={entry.id} links={links} />;
}

function ModuleSummary({
  module,
  platform,
}: {
  module: AtlasModule;
  platform?: PartialAtlasEntry['platform'];
}) {
  return (
    <div className="font-sm text-secondary">
      {!!platform && (
        <>
          <Tag variant={platform} />
          <span className="text-tertiary mx-2 select-none">-</span>
        </>
      )}
      {!!module.package && (
        <>
          <span>{module.package}</span>
          <span className="text-tertiary mx-2 select-none">-</span>
        </>
      )}
      <span>{getModuleType(module)}</span>
      <span className="text-tertiary mx-2 select-none">-</span>
      <span>{formatFileSize(module.size)}</span>
    </div>
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
    <div className="flex flex-1 flex-col overflow-auto">
      <PageHeader>
        <PageTitle>
          <Skeleton className="w-48 h-6 bg-selected" />
          <Skeleton className="w-96 h-6 mx-2" />
        </PageTitle>
      </PageHeader>

      <div className="mx-8 flex-1">
        <Skeleton className="h-full rounded-md" />
      </div>
    </div>
  );
}
