import { useQuery } from '@tanstack/react-query';
import { type PartialAtlasBundle } from 'expo-atlas';
import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router';
import { type PropsWithChildren, createContext, useContext, useMemo } from 'react';

import { StateInfo } from '~/components/StateInfo';
import { Spinner } from '~/ui/Spinner';
import { fetchApi, handleApiError } from '~/utils/api';

type BundleContext = {
  bundles: NonNullable<ReturnType<typeof useBundleData>['data']>;
};

export const bundleContext = createContext<BundleContext>({
  bundles: [],
});

/** Get the current bundle identifier, this will always trigger an update */
export const useBundleId = () => {
  return useGlobalSearchParams<{ bundle?: string }>().bundle;
};

/**
 * Get the current or all known bundle information.
 * This method is optimized to trigger updates as little as possible.
 */
export const useBundle = () => {
  const { bundles } = useContext(bundleContext);
  const { bundle: bundleId } = useLocalSearchParams<{ bundle?: string }>();
  const bundle = useMemo(
    () => bundles.find((bundle) => bundle.id === bundleId) || bundles[0],
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
    queryFn: () =>
      fetchApi('/bundles')
        .then(handleApiError)
        .then((response) => response?.json()),
  });
}
