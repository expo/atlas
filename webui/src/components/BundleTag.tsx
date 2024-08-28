import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { EnvironmentIcon } from '~/components/EnvironmentIcon';
import { EnvironmentName } from '~/components/EnvironmentName';
import { PlatformName } from '~/components/PlatformName';
import { Tag } from '~/ui/Tag';
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
  );
}
