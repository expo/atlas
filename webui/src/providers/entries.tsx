import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { type PropsWithChildren, createContext, useContext, useMemo } from 'react';

import { StateInfo } from '~/components/StateInfo';
import { Spinner } from '~/ui/Spinner';
import { fetchApi } from '~/utils/api';
import { type PartialAtlasEntry } from '~core/data/types';

type EntryContext = {
  entries: NonNullable<ReturnType<typeof useEntryData>['data']>;
};

export const entryContext = createContext<EntryContext>({
  entries: [],
});

export const useEntry = () => {
  const { entries } = useContext(entryContext);
  const { entry: entryId } = useLocalSearchParams<{ entry?: string }>();
  const entry = useMemo(
    () => entries.find((entry) => entry.id === entryId) || entries[0],
    [entries, entryId]
  );

  return { entry, entries };
};

export function EntryProvider({ children }: PropsWithChildren) {
  const entries = useEntryData();

  if (entries.data?.length) {
    return (
      <entryContext.Provider value={{ entries: entries.data || [] }}>
        {children}
      </entryContext.Provider>
    );
  }

  // TODO: add better UX for loading
  if (entries.isFetching && !entries.data?.length) {
    return (
      <StateInfo>
        <Spinner />
      </StateInfo>
    );
  }

  // TODO: add better UX for empty state
  if (entries.isFetched && !entries.data?.length) {
    return (
      <StateInfo title="No data found.">
        <p>Open your app in the browser, or device, to collect data.</p>
      </StateInfo>
    );
  }

  // TODO: add better UX for error state
  return (
    <StateInfo title="No data source.">
      <p>Try restarting Expo Atlas. If this error keeps happening, open a bug report.</p>
    </StateInfo>
  );
}

/** Load all available entries from API */
function useEntryData() {
  return useQuery<PartialAtlasEntry[]>({
    refetchOnWindowFocus: false,
    queryKey: ['entries'],
    queryFn: () => fetchApi('/entries').then((res) => res.json()),
  });
}
