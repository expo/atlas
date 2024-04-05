import { Redirect } from 'expo-router';

import { useEntry } from '~/providers/entries';

export default function HomeScreen() {
  const { entry } = useEntry();

  return <Redirect href={{ pathname: '/(atlas)/[entry]/', params: { entry: entry.id } }} />;
}
