import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import { MouseEvent, useEffect, useState } from 'react';
import sourcemap, { SourceMapConsumer } from 'source-map';

import { Page, PageHeader, PageTitle } from '~/components/Page';
import { CodeBlock, guessLanguageFromPath } from '~/components/code/CodeBlock';
import { CodeBlockSectionWithPrettier } from '~/components/code/CodeBlockWithPrettier';
import { EntryDeltaToast, useEntry } from '~/providers/entries';
import { Skeleton } from '~/ui/Skeleton';
import { Tag } from '~/ui/Tag';
import { fetchApi } from '~/utils/api';
import { relativeEntryPath } from '~/utils/entry';
import { formatFileSize } from '~/utils/formatString';
import { type PartialAtlasEntry, type AtlasModule } from '~core/data/types';

export default function ModulePage() {
  const { entry } = useEntry();
  const { path: absolutePath } = useLocalSearchParams<{ path: string }>();
  const module = useModuleData(entry.id, absolutePath!);
  const outputJs = module.data?.output?.find((output) => output.type.startsWith('js'));
  const [outputSourcemap, setOutputSourcemap] = useState<SourceMapConsumer | null>(null);

  useEffect(() => {
    if (outputSourcemap) return () => outputSourcemap.destroy();
  }, [outputSourcemap]);

  useEffect(() => {
    if (outputJs?.data.map) {
      // @ts-expect-error
      sourcemap.SourceMapConsumer.initialize({
        'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.4/lib/mappings.wasm',
      });

      sourcemap.SourceMapConsumer.with(outputJs?.data.map, null, (instance) => {
        setOutputSourcemap(instance);
      });
    }
  }, [outputJs?.data.map]);

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
            {relativeEntryPath(entry, module.data.path)}
          </h1>
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

        <CodeBlock onMouseUpCapture={onMouseClick} className="codeblock">
          <CodeBlockSectionWithPrettier
            title="Source"
            language={guessLanguageFromPath(module.data?.path)}
            code={module.data.source || '[no data available]'}
            sourceType="code"
          />
          <CodeBlockSectionWithPrettier
            title="Output"
            language="js"
            code={outputJs?.data.code || '[no data available]'}
            sourcemap={outputSourcemap || undefined}
            sourceType="output"
          />
        </CodeBlock>
      </div>
    </Page>
  );
}

function findLine(element: HTMLElement) {
  if (element.classList.contains('line')) {
    return element as HTMLSpanElement;
  }

  const parent = element.closest('.line');
  if (parent) return parent as HTMLSpanElement;

  return null;
}

function onMouseClick(event: MouseEvent<HTMLDivElement>) {
  const elCode = findLine(event.target as HTMLSpanElement);
  const elOutput = findLine(event.target as HTMLSpanElement);

  const lineCode = elCode?.dataset.lineCode;
  const mapCode = elOutput?.dataset.mapCode;

  event.currentTarget.classList.add('has-focus');
  window.document.querySelectorAll('.focused').forEach((el) => {
    el.classList.remove('focused');
  });

  if (mapCode) {
    elOutput.classList.add('focused');
    window.document.querySelectorAll(`[data-line-code="${mapCode}"]`).forEach((el) => {
      el.classList.add('focused');
    });
  } else if (lineCode) {
    elCode.classList.add('focused');
    window.document.querySelectorAll(`[data-map-code="${lineCode}"]`).forEach((el) => {
      el.classList.add('focused');
    });
  } else {
    event.currentTarget.classList.remove('has-focus');
  }
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
