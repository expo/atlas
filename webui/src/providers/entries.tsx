import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useMemo,
  useEffect,
  useCallback,
} from 'react';

import { type EntryDeltaResponse } from '~/app/--/entries/[entry]/delta+api';
import { PageContent } from '~/components/Page';
import { Button } from '~/ui/Button';
import { Spinner } from '~/ui/Spinner';
import { ToastAction, useToast } from '~/ui/Toast';
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
      <PageContent>
        <Spinner />
      </PageContent>
    );
  }

  // TODO: add better UX for empty state
  if (entries.isFetched && !entries.data?.length) {
    return (
      <PageContent title="No data found.">
        <p>Open your app in the browser, or device, to collect data.</p>
      </PageContent>
    );
  }

  // TODO: add better UX for error state
  return (
    <PageContent title="No data source.">
      <p>Try restarting Expo Atlas. If this error keeps happening, open a bug report.</p>
    </PageContent>
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

/** A logic-component to show a toast notification when the entry is outdated. */
export function EntryDeltaToast({ entryId }: { entryId: string }) {
  const client = useQueryClient();
  const toaster = useToast();

  const deltaResponse = useEntryDeltaData(entryId);
  const entryDelta = deltaResponse.data?.delta;

  const refetchEntryData = useCallback(
    () =>
      fetchApi(`/entries/${entryId}/reload`)
        .then((res) => (!res.ok ? Promise.reject(res) : res.text()))
        .then(() => client.refetchQueries({ queryKey: ['entries', entryId], type: 'active' })),
    [entryId]
  );

  useEffect(() => {
    if (!entryDelta) return;

    // TODO: update message when current module path is deleted
    // TODO: auto-update when current module path is modified

    toaster.toast({
      id: `entry-delta-${entryId}`,
      title: 'Bundle outdated',
      description: 'The code was changed since last build.',
      action: (
        <ToastAction altText="Reload bundle">
          <Button variant="secondary" size="xs" onClick={refetchEntryData}>
            Reload bundle
          </Button>
        </ToastAction>
      ),
    });
  }, [entryId, entryDelta, refetchEntryData]);

  return null;
}

/** Poll the server to check for possible changes in entries */
function useEntryDeltaData(entryId: string) {
  return useQuery<EntryDeltaResponse>({
    refetchInterval: (query) => (query.state.data?.isEnabled === false ? false : 2000),
    queryKey: ['entries', entryId, 'delta'],
    queryFn: ({ queryKey }) => {
      const [_key, entry] = queryKey as [string, string];
      return fetchApi(`/entries/${entry}/delta`).then((res) => res.json());
    },
  });
}
