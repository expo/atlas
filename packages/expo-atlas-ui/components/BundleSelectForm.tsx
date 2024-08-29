import type { PartialAtlasBundle } from 'expo-atlas';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { EnvironmentIcon } from '~/components/EnvironmentIcon';
import { PlatformName } from '~/components/PlatformName';
import { useBundle } from '~/providers/bundle';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/ui/Select';
import { relativeBundlePath } from '~/utils/bundle';

export function BundleSelectForm() {
  const router = useRouter();
  const { bundle, bundles } = useBundle();
  const bundlesByPlatform = useMemo(() => groupBundlesByPlatform(bundles), [bundles]);

  return (
    <Select open value={bundle.id} onValueChange={(bundle) => router.setParams({ bundle })}>
      <SelectTrigger className="!w-auto">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent side="bottom" collisionPadding={{ left: 16, right: 16 }}>
        {bundlesByPlatform.map(([platform, bundles]) => {
          // Hide empty `unknown` platforms. If there are unknown platforms, render them.
          if (platform === 'unknown' && bundles.length === 0) {
            return null;
          }

          return (
            <SelectGroup key={platform} className="my-1">
              <SelectLabel className="mx-1 capitalize">
                <PlatformName platform={platform} />
              </SelectLabel>
              {bundles.length === 0 ? (
                <SelectItem disabled value="none" className="italic" style={{ paddingTop: 0 }}>
                  No bundle available for this platform
                </SelectItem>
              ) : (
                bundles.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <span className="inline-flex items-center select-none mb-0.5">
                      <PlatformName platform={item.platform}>
                        <EnvironmentIcon environment={item.environment} size={16} />
                      </PlatformName>
                      <span className="ml-2 mr-1">{relativeBundlePath(item, item.entryPoint)}</span>
                    </span>
                  </SelectItem>
                ))
              )}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function groupBundlesByPlatform(bundles: PartialAtlasBundle[]) {
  const groups: Record<PartialAtlasBundle['platform'], PartialAtlasBundle[]> = {
    android: [],
    ios: [],
    web: [],
    unknown: [],
  };

  for (const bundle of bundles) {
    if (groups[bundle.platform]) {
      groups[bundle.platform]!.push(bundle);
    }
  }

  return Object.entries(groups).map(
    ([platform, bundles]) =>
      [platform as PartialAtlasBundle['platform'], bundles.sort(sortBundlesByEnvironment)] as const
  );
}

/** Sort all bundles by environment, in alphabetical order "client -> node -> react-server" */
function sortBundlesByEnvironment(a: PartialAtlasBundle, b: PartialAtlasBundle) {
  return a.environment.localeCompare(b.environment);
}
