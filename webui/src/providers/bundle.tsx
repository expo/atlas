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

import { type BundleDeltaResponse } from '~/app/--/bundles/[bundle]/delta+api';
import { StateInfo } from '~/components/StateInfo';
import { Button } from '~/ui/Button';
import { Spinner } from '~/ui/Spinner';
import { ToastAction, type ToasterToast, useToast } from '~/ui/Toast';
import { fetchApi } from '~/utils/api';
import { type PartialAtlasBundle } from '~core/data/types';

type BundleContext = {
  bundles: NonNullable<ReturnType<typeof useBundleData>['data']>;
};

export const bundleContext = createContext<BundleContext>({
  bundles: [],
});

export const useBundle = () => {
  const { bundles } = useContext(bundleContext);
  const { entry: bundleId } = useLocalSearchParams<{ entry?: string }>();
  const bundle = useMemo(
    () => bundles.find((entry) => entry.id === bundleId) || bundles[0],
    [bundles, bundleId]
  );

  return { bundle, bundles };
};

export function BundleProvider({ children }: PropsWithChildren) {
  const bundles = useBundleData();

  if (bundles.data?.length) {
    return (
      <bundleContext.Provider value={{ bundles: bundles.data || [] }}>
        {children}
      </bundleContext.Provider>
    );
  }

  // TODO: add better UX for loading
  if (bundles.isFetching && !bundles.data?.length) {
    return (
      <StateInfo>
        <Spinner />
      </StateInfo>
    );
  }

  // TODO: add better UX for empty state
  if (bundles.isFetched && !bundles.data?.length) {
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

/** Load all available bundles from API, this is refetched every 2s when no data is present */
function useBundleData() {
  return useQuery<PartialAtlasBundle[]>({
    refetchOnWindowFocus: false,
    refetchInterval: (query) => (!query.state.data?.length ? 2000 : false),
    queryKey: ['bundles'],
    queryFn: () => fetchApi('/bundles').then((res) => res.json()),
  });
}

/** A logic-component to show a toast notification when the entry is outdated. */
export function BundleDeltaToast({
  bundle,
  modulePath,
}: {
  bundle: Pick<PartialAtlasBundle, 'id'>;
  modulePath?: string;
}) {
  const client = useQueryClient();
  const toaster = useToast();

  const deltaResponse = useBundleDeltaData(bundle.id);
  const entryDelta = deltaResponse.data?.delta;

  const refetchEntryData = useCallback(
    () =>
      fetchApi(`/bundles/${bundle.id}/reload`)
        .then((res) => (!res.ok ? Promise.reject(res) : res.text()))
        .then(() => client.refetchQueries({ queryKey: ['bundles', bundle.id], type: 'active' })),
    [bundle.id]
  );

  useEffect(() => {
    if (!entryDelta) return;

    if (modulePath) {
      if (entryDelta.deletedPaths.includes(modulePath)) {
        toaster.toast(toastModuleDeleted(bundle.id));
      } else if (entryDelta.modifiedPaths.includes(modulePath)) {
        refetchEntryData().then(() => toaster.toast(toastModuleModified(bundle.id)));
      }
      return;
    }

    toaster.toast(toastBundleUpdate(bundle.id, refetchEntryData));
  }, [bundle.id, entryDelta, refetchEntryData, modulePath]);

  return null;
}

function toastModuleModified(entryId: string): ToasterToast {
  return {
    id: `bundle-delta-${entryId}`,
    title: 'Module modified',
    description: 'This module is updated to reflect the latest changes.',
  };
}

function toastModuleDeleted(entryId: string): ToasterToast {
  return {
    id: `bundle-delta-${entryId}`,
    title: 'Module deleted',
    description: 'This file is deleted since latest build, and is no longer available.',
  };
}

function toastBundleUpdate(entryId: string, refetchEntryData: () => any): ToasterToast {
  return {
    id: `bundle-delta-${entryId}`,
    title: 'Bundle outdated',
    description: 'The code was changed since last build.',
    action: (
      <ToastAction altText="Reload bundle">
        <Button variant="secondary" size="xs" onClick={refetchEntryData}>
          Reload bundle
        </Button>
      </ToastAction>
    ),
  };
}

/** Poll the server to check for possible changes in bundles */
function useBundleDeltaData(bundleId: string) {
  return useQuery<BundleDeltaResponse>({
    refetchInterval: (query) => (query.state.data?.isEnabled === false ? false : 2000),
    queryKey: ['bundles', bundleId, 'delta'],
    queryFn: ({ queryKey }) => {
      const [_key, bundle] = queryKey as [string, string];
      return fetchApi(`/bundles/${bundle}/delta`).then((res) => res.json());
    },
  });
}
