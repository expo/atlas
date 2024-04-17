import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import { type MouseEventHandler, useEffect, useState } from 'react';

import type { PartialModule } from '~/app/--/entries/[entry]/modules/index+api';
import { Page, PageHeader, PageTitle } from '~/components/Page';
import { StateInfo } from '~/components/StateInfo';
import {
  CodeBlockButton,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockTitle,
} from '~/components/code/CodeBlock';
import { EntryDeltaToast, useEntry } from '~/providers/entries';
import { Panel, PanelGroup } from '~/ui/Panel';
import { Skeleton } from '~/ui/Skeleton';
import { Spinner } from '~/ui/Spinner';
import { Tag } from '~/ui/Tag';
import { fetchApi } from '~/utils/api';
import { relativeEntryPath } from '~/utils/entry';
import { formatFileSize } from '~/utils/formatString';
import { applyHighlightOpacityFromHash } from '~/utils/highlighter';
import { type PartialAtlasEntry, type AtlasModule } from '~core/data/types';

export default function ModulePage() {
  const { entry } = useEntry();
  const { path: absolutePath } = useLocalSearchParams<{ path: string }>();
  const module = useModuleData({ entry: entry.id, path: absolutePath! });

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
        <ModuleCode entry={entry.id} path={absolutePath} />
      </div>
    </Page>
  );
}

function ModuleCode(props: { entry: string; path: string }) {
  const [outputFormat, setOutputFormat] = useState<ModuleCodeDataParams['format']>('raw');

  const source = useModuleCodeData({ ...props, type: 'source' });
  const output = useModuleCodeData({ ...props, type: 'output', format: outputFormat });

  useEffect(() => {
    const listener = (event: HashChangeEvent) => {
      const hash = event.newURL.split('#')[1];
      if (hash) applyHighlightOpacityFromHash(hash);
    };

    window.addEventListener('hashchange', listener);
    return () => {
      window.removeEventListener('hashchange', listener);
    };
  }, []);

  const onMouseUp: MouseEventHandler<'div'> = (event) => {
    console.log({
      target: event.target,
      currentTarget: event.currentTarget,
    });
  };

  return (
    <PanelGroup onMouseUp={onMouseUp}>
      <Panel>
        <CodeBlockHeader>Source</CodeBlockHeader>
        {source.isFetched && <CodeBlockContent>{source.data?.html || ''}</CodeBlockContent>}
        {source.isLoading && <Skeleton className="h-full w-full min-h-64 bg-hover" />}
      </Panel>
      <Panel>
        <CodeBlockHeader>
          <CodeBlockTitle>Output</CodeBlockTitle>
          <CodeBlockButton
            onClick={() => setOutputFormat((value) => (value === 'pretty' ? 'raw' : 'pretty'))}
            disabled={output.isLoading}
          >
            {outputFormat === 'pretty' ? 'Original' : 'Format'}
          </CodeBlockButton>
        </CodeBlockHeader>
        {output.isFetched && <CodeBlockContent>{output.data?.html || ''}</CodeBlockContent>}
        {output.isLoading && !output.isPlaceholderData && (
          <Skeleton className="h-full w-full min-h-64 bg-hover" />
        )}
      </Panel>
    </PanelGroup>
  );
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

type ModuleDataParams = {
  entry: string;
  path: string;
};

/** Load the module data from API, by path reference only */
function useModuleData(params: ModuleDataParams) {
  return useQuery<PartialModule>({
    refetchOnWindowFocus: false,
    queryKey: [`entries`, params.entry, `module`, params.path],
    queryFn: async ({ queryKey }) => {
      const [_key, entry, _module, path] = queryKey as [string, string, string, string];
      return fetchApi(`/entries/${entry}/modules/${encodeURIComponent(path)}`)
        .then((res) => (res.ok ? res : Promise.reject(res)))
        .then((res) => res.json());
    },
  });
}

type ModuleCodeDataParams = {
  type: 'source' | 'output';
  format?: 'pretty' | 'raw';
};

function useModuleCodeData(options: ModuleDataParams & ModuleCodeDataParams) {
  return useQuery<{ html: string }>({
    refetchOnWindowFocus: false,
    queryKey: [
      `entries`,
      options.entry,
      `module`,
      options.path,
      'code',
      options.type,
      options.format,
    ],
    queryFn: async ({ queryKey }) => {
      const [_key, entry, _module, path, _code, type, format] = queryKey as [
        'entries',
        string,
        'module',
        string,
        'code',
        ModuleCodeDataParams['type'],
        ModuleCodeDataParams['format'],
      ];

      const query = new URLSearchParams({ type, format: format || 'raw' });
      return fetchApi(`/entries/${entry}/modules/${encodeURIComponent(path)}/code?${query}`)
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
