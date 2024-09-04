import type { AtlasBundle } from 'expo-atlas';
import type { LucideProps } from 'lucide-react';

type EnvironmentIconProps = Omit<
  LucideProps & {
    environment: AtlasBundle['environment'];
  },
  'children'
>;

const iconsByEnvironment: Record<AtlasBundle['environment'], any> = {
  client: require('lucide-react/dist/esm/icons/tablet-smartphone').default,
  dom: require('lucide-react/dist/esm/icons/globe').default,
  node: require('lucide-react/dist/esm/icons/hexagon').default,
  'react-server': require('lucide-react/dist/esm/icons/server').default,
};

export function EnvironmentIcon({ className, environment, ...props }: EnvironmentIconProps) {
  const Icon = iconsByEnvironment[environment];
  return <Icon {...props} />;
}
