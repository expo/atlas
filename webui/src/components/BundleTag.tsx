import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { Tag } from '~/ui/Tag';
import type { AtlasBundle } from '~core/data/types';

const bundleTagVariants = cva('', {
  variants: {
    platform: {
      android: 'bg-palette-green3 text-palette-green11',
      ios: 'bg-palette-blue3 text-palette-blue11',
      web: 'bg-palette-orange3 text-palette-orange11',
      unknown: '',
    } satisfies typeof platformChildren,
    environment: {
      client: '',
      node: 'bg-palette-orange3 text-palette-orange11',
      'react-server': 'bg-palette-green3 text-palette-green11',
    } satisfies typeof environmentChildren,
  },
  defaultVariants: {
    platform: 'unknown', // Default platform value, see MetroGraphSource
    environment: 'client', // Default environment value, see MetroGraphSource
  },
});

const platformChildren: Record<AtlasBundle['platform'], string> = {
  android: 'Android',
  ios: 'iOS',
  web: 'Web',
  unknown: '???',
};

const environmentChildren: Record<AtlasBundle['environment'], string> = {
  client: 'Client',
  node: 'SSR',
  'react-server': 'RSC',
};

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
      {getBundelTagChildren({ platform, environment })}
    </Tag>
  );
}

function getBundelTagChildren(props: BundelTagProps) {
  const children: string[] = [];

  if (props.platform) {
    children.push(platformChildren[props.platform]);
  }

  // Only add the environment specifier if it's not bundled for the client
  if (props.environment && props.environment !== 'client') {
    children.push(environmentChildren[props.environment]);
  }

  return children.join(' × ');
}
