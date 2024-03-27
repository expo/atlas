import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

import { type FolderGraphData } from '../api/stats/[entry]/folders/index+api';

import { Page, PageHeader, PageTitle } from '~/components/Page';
import { TreemapGraph } from '~/components/graphs/TreemapGraph';
import { useStatsEntryContext } from '~/providers/stats';
import { Skeleton } from '~/ui/Skeleton';
import { Tag } from '~/ui/Tag';
import { fetchApi } from '~/utils/api';
import { formatFileSize } from '~/utils/formatString';
import { type PartialStatsEntry } from '~core/data/types';

export default function FolderPage() {
  const { entryId, entry, entryFilePath } = useStatsEntryContext();
  const { path: absolutePath } = useLocalSearchParams<{ path: string }>();
  const folder = useFolderData(entryId, absolutePath!);

  if (folder.isLoading) {
    return <FolderPageSkeleton />;
  }

  if (!folder.data || folder.isError) {
    // TODO: improve
    return (
      <div className="flex flex-1 flex-col justify-center items-center">
        <h2 className="text-slate-50 font-bold text-lg">Folder not found</h2>
      </div>
    );
  }

  return (
    <Page variant="viewport">
      <div className="flex flex-1 flex-col">
        <PageHeader>
          <PageTitle>
            <h1
              className="text-slate-50 font-bold text-lg mr-4"
              title={folder.data.metadata.folderPath}
            >
              {entryFilePath(folder.data.metadata.folderPath)}/
            </h1>
            <FolderSummary platform={entry?.platform} folder={folder.data.metadata} />
          </PageTitle>
        </PageHeader>

        <TreemapGraph
          key={`folder-graph-${entryId}`}
          name={`.../${entryFilePath(folder.data.metadata.folderName)}`}
          modules={folder.data?.data?.modules ?? []}
        />
      </div>
    </Page>
  );
}

function FolderSummary({
  folder,
  platform,
}: {
  folder: FolderGraphData['metadata'];
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
      <span>folder</span>
      <span className="text-tertiary mx-2 select-none">-</span>
      <span>
        {folder.modulesCount === 1
          ? `${folder.modulesCount} module`
          : `${folder.modulesCount} modules`}
      </span>
      <span className="text-tertiary mx-2 select-none">-</span>
      <span>{formatFileSize(folder.size)}</span>
    </div>
  );
}

/** Load the folder data from API, by path reference only */
function useFolderData(entryId: string, path: string) {
  return useQuery<FolderGraphData>({
    queryKey: [`module`, entryId, path],
    queryFn: async ({ queryKey }) => {
      const [_key, entry, path] = queryKey as [string, string, string];
      return fetchApi(`/api/stats/${entry}/folders`, {
        method: 'POST',
        body: JSON.stringify({ path }),
      })
        .then((res) => (res.ok ? res : Promise.reject(res)))
        .then((res) => res.json());
    },
  });
}

function FolderPageSkeleton() {
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
