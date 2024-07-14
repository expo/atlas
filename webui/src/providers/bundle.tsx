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

import { StateInfo } from '~/components/StateInfo';
import { Button } from '~/ui/Button';
import { Spinner } from '~/ui/Spinner';
import { ToastAction, type ToasterToast, useToast } from '~/ui/Toast';
import { fetchApi, handleApiError } from '~/utils/api';
import { type PartialAtlasBundle } from '~core/data/types';

type BundleContext = {
  bundles: NonNullable<ReturnType<typeof useBundleData>['data']>;
};

export const bundleContext = createContext<BundleContext>({
  bundles: [],
});

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

/** A logic-component to show a toast notification when the bundle is outdated. */
export function BundleDeltaToast({
  bundle,
  modulePath,
}: {
  bundle: Pick<PartialAtlasBundle, 'id'>;
  modulePath?: string;
}) {
  const client = useQueryClient();
  const toaster = useToast();

  const deltaResponse: any = { data: { delta: null } };
  const bundleDelta = deltaResponse.data?.delta;

  const refetchBundleData = useCallback(
    () =>
      fetchApi(`/bundles/${bundle.id}/reload`)
        .then(handleApiError)
        .then((response) => response?.text())
        .then(() => client.refetchQueries({ queryKey: ['bundles', bundle.id], type: 'active' })),
    [bundle.id]
  );

  useEffect(() => {
    if (!bundleDelta) return;

    if (modulePath) {
      if (bundleDelta.deletedPaths.includes(modulePath)) {
        toaster.toast(toastModuleDeleted(bundle.id));
      } else if (bundleDelta.modifiedPaths.includes(modulePath)) {
        refetchBundleData().then(() => toaster.toast(toastModuleModified(bundle.id)));
      }
      return;
    }

    toaster.toast(toastBundleUpdate(bundle.id, refetchBundleData));
  }, [bundle.id, bundleDelta, refetchBundleData, modulePath]);

  return null;
}

function toastModuleModified(bundleId: string): ToasterToast {
  return {
    id: `bundle-delta-${bundleId}`,
    title: 'Module modified',
    description: 'This module is updated to reflect the latest changes.',
  };
}

function toastModuleDeleted(bundleId: string): ToasterToast {
  return {
    id: `bundle-delta-${bundleId}`,
    title: 'Module deleted',
    description: 'This file is deleted since latest build, and is no longer available.',
  };
}

function toastBundleUpdate(bundleId: string, refetchBundleData: () => any): ToasterToast {
  return {
    id: `bundle-delta-${bundleId}`,
    title: 'Bundle outdated',
    description: 'The code was changed since last build.',
    action: (
      <ToastAction altText="Reload bundle">
        <Button variant="secondary" size="xs" onClick={refetchBundleData}>
          Reload bundle
        </Button>
      </ToastAction>
    ),
  };
}
