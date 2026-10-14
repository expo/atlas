import { Redirect } from 'expo-router';

import { useBundle } from '~/providers/bundle';

export default function HomeScreen() {
  const { bundle } = useBundle();

  return <Redirect href={{ pathname: '/(atlas)/[bundle]', params: { bundle: bundle.id } }} />;
}
