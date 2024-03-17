import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';

import { Page, PageHeader, PageTitle } from '~/components/Page';
import { useStatsEntryContext } from '~/providers/stats';
import { CodeBlock, CodeBlockSectionWithPrettier, guessLanguageFromPath } from '~/ui/CodeBlock';
import { Skeleton } from '~/ui/Skeleton';
import { Tag } from '~/ui/Tag';
import { formatFileSize } from '~/utils/formatString';
import { type PartialStatsEntry, type StatsModule } from '~core/data/types';

export default function ModulePage() {
  const { entryId, entry, entryFilePath } = useStatsEntryContext();
  const { path: absolutePath } = useLocalSearchParams<{ path: string }>();
  const module = useModuleData(entryId, absolutePath!);

  const outputCode = module.data?.output?.map((output) => output.data.code).join('\n');

  if (module.isLoading) {
    return <ModulePageSkeleton />;
  }

  if (!module.data || module.isError) {
    // TODO: improve
    return (
      <div className="flex flex-1 flex-col justify-center items-center">
        <h2 className="text-slate-50 font-bold text-lg">Module not found</h2>
      </div>
    );
  }

  return (
    <Page>
      <PageHeader>
        <PageTitle>
          <h1 className="text-slate-50 font-bold text-lg mr-4" title={module.data.path}>
            {entryFilePath(module.data.path)}
          </h1>
          <ModuleSummary platform={entry?.platform} module={module.data} />
        </PageTitle>
      </PageHeader>

      <div className="mx-8 mb-4">
        {!!module.data.importedBy?.length && (
          <div className="my-4">
            <p className="text-md">Imported from:</p>
            <ul style={{ listStyle: 'initial' }} className="mb-6">
              {module.data.importedBy.map((path) => (
                <li key={path} className="ml-4">
                  <Link
                    className="text-link hover:underline"
                    href={{ pathname: '/modules/[path]', params: { path } }}
                  >
                    {entryFilePath(path)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <CodeBlock>
          <CodeBlockSectionWithPrettier
            title="Source"
            language={guessLanguageFromPath(module.data?.path)}
          >
            {module.data.source || '[no data available]'}
          </CodeBlockSectionWithPrettier>
          <CodeBlockSectionWithPrettier title="Output">
            {outputCode || '[no data available]'}
          </CodeBlockSectionWithPrettier>
        </CodeBlock>
      </div>
    </Page>
  );
}

function ModuleSummary({
  module,
  platform,
}: {
  module: StatsModule;
  platform?: PartialStatsEntry['platform'];
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

function getModuleType(module: StatsModule) {
  const type = module.path.includes('?ctx=') ? 'require.context' : 'file';
  return module.package ? `package ${type}` : type;
}

/** Load the module data from API, by path reference only */
function useModuleData(entryId: string, path: string) {
  return useQuery<StatsModule>({
    queryKey: [`module`, entryId, path],
    queryFn: async ({ queryKey }) => {
      const [_key, entry, path] = queryKey as [string, string, string];
      return fetch(`/api/stats/${entry}/modules`, {
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
