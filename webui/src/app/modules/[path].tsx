import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { StatsEntry, useStatsEntryContext } from '~/providers/stats';
import { Button } from '~/ui/Button';
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockSection,
  CodeBlockTitle,
  guessLanguageFromPath,
} from '~/ui/CodeBlock';
import { PageHeader, PageTitle } from '~/ui/Page';
import { Skeleton } from '~/ui/Skeleton';
import { Tag } from '~/ui/Tag';
import { formatFileSize } from '~/utils/formatString';
import { formatCode } from '~/utils/prettier';
import { type MetroStatsModule } from '~plugin/metro/convertGraphToStats';

export default function ModulePage() {
  const { entryId, entry } = useStatsEntryContext();
  const { path: absolutePath } = useLocalSearchParams<{ path: string }>();
  const module = useModuleData(entryId, absolutePath);

  const [prettyModule, setPrettyModule] = useState<string | null>(null);

  useEffect(() => setPrettyModule(null), [module.data]);

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

  function onPrettyOutput() {
    if (module.data?.output.length) {
      formatCode(module.data.output.map((output) => output.data.code).join()).then(setPrettyModule);
    }
  }

  function resetPrettyOutput() {
    setPrettyModule(null);
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <PageHeader>
        <PageTitle>
          <h1 className="text-slate-50 font-bold text-lg mr-4" title={module.data.absolutePath}>
            {module.data.relativePath}
          </h1>
          <ModuleSummary platform={entry?.platform} module={module.data} />
        </PageTitle>
      </PageHeader>

      <div className="mx-8">
        {!!module.data.inverseDependencies.length && (
          <div className="my-4">
            <p className="text-md">Imported from:</p>
            <ul style={{ listStyle: 'initial' }} className="mb-6">
              {module.data.inverseDependencies.map(({ absolutePath, relativePath }) => (
                <li key={absolutePath} className="ml-4">
                  <Link
                    className="text-link hover:underline"
                    href={{ pathname: '/modules/[path]', params: { path: absolutePath } }}
                  >
                    {relativePath}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <CodeBlock>
          <CodeBlockSection>
            <CodeBlockHeader>Source</CodeBlockHeader>
            <CodeBlockContent language={guessLanguageFromPath(module.data.relativePath)}>
              {module.data.source}
            </CodeBlockContent>
          </CodeBlockSection>
          <CodeBlockSection>
            <CodeBlockHeader>
              <CodeBlockTitle>Output</CodeBlockTitle>
              <Button
                variant="quaternary"
                className="m-0"
                onClick={!prettyModule ? onPrettyOutput : resetPrettyOutput}
              >
                {!prettyModule ? 'format' : 'reset format'}
              </Button>
            </CodeBlockHeader>
            <CodeBlockContent>
              {prettyModule
                ? prettyModule
                : module.data.output.map((output) => output.data.code).join()}
            </CodeBlockContent>
          </CodeBlockSection>
        </CodeBlock>
      </div>
    </div>
  );
}

function ModuleSummary({
  module,
  platform,
}: {
  module: MetroStatsModule;
  platform?: StatsEntry['platform'];
}) {
  return (
    <div className="font-sm text-secondary">
      {!!platform && (
        <>
          <Tag variant={platform} />
          <span className="text-tertiary mx-2 select-none">-</span>
        </>
      )}
      {module.isNodeModule && (
        <>
          <span>{module.nodeModuleName}</span>
          <span className="text-tertiary mx-2 select-none">-</span>
        </>
      )}
      <span>{getModuleType(module)}</span>
      <span className="text-tertiary mx-2 select-none">-</span>
      <span>{formatFileSize(module.size)}</span>
    </div>
  );
}

function getModuleType(module: MetroStatsModule) {
  const type = module.relativePath.includes('?ctx=') ? 'require.context' : 'file';

  return module.isNodeModule ? `package ${type}` : type;
}

/** Load the module data from API, by path reference only */
function useModuleData(entry: number, path: string) {
  return useQuery<MetroStatsModule>({
    queryKey: [`module`, entry, path],
    queryFn: async ({ queryKey }) => {
      const [_key, entry, path] = queryKey as [string, number, string];
      const response = await fetch(`/api/stats/${entry}/modules`, {
        method: 'POST',
        body: JSON.stringify({ path }),
      });

      if (response.ok) {
        return await response.json();
      }

      throw new Error(`Failed to load module data: ${response.status}`);
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
