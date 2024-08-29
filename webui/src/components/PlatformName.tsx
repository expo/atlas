import { cva } from 'class-variance-authority';
import type { PropsWithChildren } from 'react';

import type { AtlasBundle } from '~core/data/types';

type PlatformNameProps = PropsWithChildren<{
  platform: AtlasBundle['platform'];
  className?: string;
}>;

export const platformVariants = cva('', {
  variants: {
    platform: {
      android: 'text-palette-green11',
      ios: 'text-palette-blue11',
      web: 'text-palette-orange11',
      unknown: 'text-secondary',
    } satisfies Record<AtlasBundle['platform'], string>,
  },
  defaultVariants: {
    platform: 'unknown',
  },
});

export const platformNames: Record<AtlasBundle['platform'], string> = {
  android: 'Android',
  ios: 'iOS',
  web: 'Web',
  unknown: 'Unknown',
};

export function PlatformName({ children, className, platform }: PlatformNameProps) {
  return (
    <span className={platformVariants({ className, platform })}>
      {children || platformNames[platform]}
    </span>
  );
}
