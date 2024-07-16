import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type PropsWithChildren, useCallback, useEffect, useState } from 'react';

import { AtlasHmrClient, type HmrServerUpdate } from './hmr-client';

import { useBundleId } from '~/providers/bundle';
import { Button } from '~/ui/Button';
import { ToastAction, type ToasterToast, useToast } from '~/ui/Toast';
import { fetchApi, handleApiError } from '~/utils/api';
import type { AtlasBundleHmr } from '~core/data/types';

/** The function to reload all bundle data in Atlas */
type ReloadBundle = () => Promise<void | string>;

export function HmrProvider({ children }: PropsWithChildren) {
  const client = useQueryClient();
  const { toast, dismiss } = useToast();
  const bundleId = useBundleId();
  const bundleHmr = useBundleHmrData(bundleId);
  const [hmrClient] = useState(new AtlasHmrClient());

  const reloadBundle = useCallback<ReloadBundle>(() => {
    // Ensure no HMR toasts are left open
    dismiss('bundle-hmr');
    // Reload and refetch all bundle data
    return fetchApi('/bundles/reload', { method: 'POST' }).then((response) => {
      if (!response.ok) {
        return response.statusText;
      }

      client.refetchQueries({ queryKey: ['bundles'], type: 'active' });
    });
  }, [client, dismiss]);

  // Manage the HMR connection when switching to a new bundle
  useEffect(() => {
    const newBundleId = bundleHmr.data?.bundleId;
    const oldBundleId = hmrClient.bundleId;

    if (newBundleId && newBundleId !== oldBundleId) {
      hmrClient.enable(bundleHmr.data!, createUpdateHandler({ reloadBundle, toast }));
    }
  }, [reloadBundle, bundleHmr.data?.bundleId, hmrClient.bundleId]);

  return children;
}

function useBundleHmrData(bundleId?: string) {
  return useQuery<AtlasBundleHmr>({
    refetchOnWindowFocus: false,
    queryKey: ['hmr', bundleId],
    queryFn: ({ queryKey }) => {
      const [_key, bundle] = queryKey as [string, string | undefined, string];

      if (!bundle) {
        return Promise.resolve(null);
      }

      return fetchApi(`/bundles/${bundle}/hmr`)
        .then(handleApiError)
        .then((response) => response?.json());
    },
  });
}

function createUpdateHandler({
  reloadBundle,
  toast,
}: {
  reloadBundle: ReloadBundle;
  toast: ReturnType<typeof useToast>['toast'];
}) {
  return (update: HmrServerUpdate) => {
    // Only when files are modified, update the bundle data
    if (update.modified.length > 0 && !update.added.length && !update.deleted.length) {
      return reloadBundle().then((errorDescription) => {
        if (errorDescription) {
          toast(toastBundleUpdateFailed(reloadBundle, errorDescription));
        } else {
          toast(toastBundleUpdated());
        }
      });
    }

    // For added or deleted files, notify the user and ask for a manual reload
    toast(toastBundleRequiresUpdate(reloadBundle));
  };
}

function toastBundleUpdated(): ToasterToast {
  return {
    id: 'bundle-hmr',
    title: 'Bundle updated',
    description: 'All modules are updated to reflect the latest changes.',
  };
}

function toastBundleUpdateFailed(reloadBundle: ReloadBundle, description: string): ToasterToast {
  return {
    id: 'bundle-hmr',
    title: 'Bundle update failed',
    description,
    duration: Infinity,
    action: (
      <ToastAction altText="Reload bundle">
        <Button variant="secondary" size="xs" onClick={reloadBundle}>
          Reload bundle
        </Button>
      </ToastAction>
    ),
  };
}

function toastBundleRequiresUpdate(reloadBundle: ReloadBundle): ToasterToast {
  return {
    id: 'bundle-hmr',
    title: 'Bundle outdated',
    description: 'The code was changed since last build.',
    duration: Infinity,
    action: (
      <ToastAction altText="Reload bundle">
        <Button variant="secondary" size="xs" onClick={reloadBundle}>
          Reload bundle
        </Button>
      </ToastAction>
    ),
  };
}
