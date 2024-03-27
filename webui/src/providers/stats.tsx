import { useQuery } from '@tanstack/react-query';
import { type PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';

import { Spinner } from '~/ui/Spinner';
import { fetchApi } from '~/utils/api';
import { type PartialStatsEntry } from '~core/data/types';

type StatsEntryContext = {
  entryId: string;
  setEntryId: (id: string) => void;
  entries?: ReturnType<typeof useStatsEntriesData>;
  entry?: PartialStatsEntry;
  entryFilePath: (absolutePath: string) => string;
};

export const statsEntryContext = createContext<StatsEntryContext>({
  entryId: '2',
  setEntryId: () => {},
  entries: undefined,
  entry: undefined,
  entryFilePath: (absolutePath) => absolutePath,
});

export const useStatsEntryContext = () => useContext(statsEntryContext);

export function StatsEntryProvider({ children }: PropsWithChildren) {
  const entries = useStatsEntriesData();
  const [entryId, setEntryId] = useState<string>();
  const entryIdOrFirstEntry = entryId ?? entries.data?.[0]?.id;

  const entry = useMemo(
    () => entries.data?.find((entry) => entry.id === entryIdOrFirstEntry),
    [entries, entryIdOrFirstEntry]
  );

  function entryFilePath(absolutePath: string) {
    return entry?.projectRoot ? absolutePath.replace(entry.projectRoot + '/', '') : absolutePath;
  }

  // TODO: add better UX for loading
  if (entries.isFetching && !entries.data?.length) {
    return (
      <div className="flex flex-1 justify-center items-center">
        <Spinner />
      </div>
    );
  }

  // TODO: add better UX for empty state
  if (entries.isFetched && !entries.data?.length) {
    return (
      <div className="flex flex-1 justify-center items-center">
        <h2 className="text-lg font-bold m-4">No stats found.</h2>
        <p>Open your app in the browser, or device, to collect the stats.</p>
      </div>
    );
  }

  // TODO: add better UX for error state
  if (!entryIdOrFirstEntry) {
    return (
      <div className="flex flex-1 justify-center items-center">
        <h2 className="text-lg font-bold m-4">Unable to load stats.</h2>
        <p>Make sure you configured Expo Atlas properly.</p>
      </div>
    );
  }

  return (
    <statsEntryContext.Provider
      value={{ entryId: entryIdOrFirstEntry, setEntryId, entries, entry, entryFilePath }}
    >
      {children}
    </statsEntryContext.Provider>
  );
}

/** Load all available stats entries from API */
function useStatsEntriesData() {
  return useQuery<PartialStatsEntry[]>({
    queryKey: ['stats-entries'],
    queryFn: () => fetchApi('/api/stats').then((res) => res.json()),
  });
}
