import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { EnvironmentIcon } from '~/components/EnvironmentIcon';
import { EnvironmentName } from '~/components/EnvironmentName';
import { PlatformName } from '~/components/PlatformName';
import { Tag } from '~/ui/Tag';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/ui/Tooltip';
import type { AtlasBundle } from '~core/data/types';

const bundleTagVariants = cva('', {
  variants: {
    platform: {
      android: 'bg-palette-green3',
      ios: 'bg-palette-blue3',
      web: 'bg-palette-orange3',
      unknown: '',
    } satisfies Record<AtlasBundle['platform'], string>,
    environment: {
      client: '',
      node: 'bg-palette-orange3',
      'react-server': 'bg-palette-orange3',
    } satisfies Record<AtlasBundle['environment'], string>,
  },
  defaultVariants: {
    platform: 'unknown', // Default platform value, see MetroGraphSource
    environment: 'client', // Default environment value, see MetroGraphSource
  },
});

type BundelTagProps = Omit<
  ComponentProps<typeof Tag> & VariantProps<typeof bundleTagVariants>,
  'children'
>;

export function BundleTag({ className, platform, environment, ...props }: BundelTagProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Tag
          className={bundleTagVariants({ platform, environment, className })}
          variant="none"
          {...props}
        >
          <PlatformName platform={platform!} className="inline-flex items-center gap-1.5">
            <PlatformName platform={platform!} />
            <span>×</span>
            <EnvironmentName environment={environment!} />
            <EnvironmentIcon environment={environment!} size={14} />
          </PlatformName>
        </Tag>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          Expo creates bundles for every platform containing only{' '}
          <a
            className="text-link hover:underline"
            href="https://reactnative.dev/docs/platform-specific-code"
            target="_blank"
          >
            platform-specific code
          </a>
          , like Android, iOS, and Web. Some platforms can also run in multiple environments.
        </p>
        <p className="my-2">
          Atlas marks every bundle with both the platform and target environment for which the
          bundle is built.
        </p>
        <p className="mt-2">
          <ul className="list-disc">
            <li className="inline-flex items-center gap-1">
              <EnvironmentIcon environment="client" size={14} /> Client — Bundles that run on
              device.
            </li>
            <li className="inline-flex items-center gap-1">
              <EnvironmentIcon environment="node" size={14} /> SSR — Bundles that only run on
              server.
            </li>
            <li className="inline-flex items-center gap-1">
              <EnvironmentIcon environment="react-server" size={14} /> RSC — React server component
              bundles.
            </li>
          </ul>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
