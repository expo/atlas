import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { type PropsWithChildren, createContext, useContext, useMemo } from 'react';

import { Spinner } from '~/ui/Spinner';
import { fetchApi } from '~/utils/api';
import { type PartialStatsEntry } from '~core/data/types';

type StatsEntryContext = {
  entries: NonNullable<ReturnType<typeof useStatsEntriesData>['data']>;
};

export const statsEntryContext = createContext<StatsEntryContext>({
  entries: [],
});

export const useStatsEntry = () => {
  const { entries } = useContext(statsEntryContext);
  const { entry: entryId } = useLocalSearchParams<{ entry?: string }>();
  const entry = useMemo(
    () => entries.find((entry) => entry.id === entryId) || entries[0],
    [entries, entryId]
  );

  return { entry, entries };
};

export function StatsEntryProvider({ children }: PropsWithChildren) {
  const entries = useStatsEntriesData();

  if (entries.data?.length) {
    return (
      <statsEntryContext.Provider value={{ entries: entries.data || [] }}>
        {children}
      </statsEntryContext.Provider>
    );
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
  return (
    <div className="flex flex-1 justify-center items-center">
      <h2 className="text-lg font-bold m-4">No stats source.</h2>
      <p>Try restarting Expo Atlas. If this error keeps happening, open a bug report.</p>
    </div>
  );
}

/** Load all available stats entries from API */
function useStatsEntriesData() {
  return useQuery<PartialStatsEntry[]>({
    queryKey: ['stats-entries'],
    queryFn: () => fetchApi('/api/stats').then((res) => res.json()),
  });
}
