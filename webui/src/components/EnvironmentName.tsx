import type { PropsWithChildren } from 'react';

import type { AtlasBundle } from '~core/data/types';

type EnvironmentNameProps = PropsWithChildren<{
  environment: AtlasBundle['environment'];
  className?: string;
}>;

export const environmentNames: Record<AtlasBundle['environment'], string> = {
  client: 'Client',
  node: 'SSR',
  'react-server': 'RSC',
};

export function EnvironmentName({ children, environment, ...props }: EnvironmentNameProps) {
  return <span {...props}>{children || environmentNames[environment]}</span>;
}
