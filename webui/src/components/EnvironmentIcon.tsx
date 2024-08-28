import type { LucideProps } from 'lucide-react';

import type { AtlasBundle } from '~core/data/types';

type EnvironmentIconProps = Omit<
  LucideProps & {
    environment: AtlasBundle['environment'];
  },
  'children'
>;

const iconsByEnvironment: Record<AtlasBundle['environment'], any> = {
  client: require('lucide-react/dist/esm/icons/tablet-smartphone').default,
  node: require('lucide-react/dist/esm/icons/hexagon').default,
  'react-server': require('lucide-react/dist/esm/icons/server').default,
};

export function EnvironmentIcon({ className, environment, ...props }: EnvironmentIconProps) {
  const Icon = iconsByEnvironment[environment];
  return <Icon {...props} />;
}
