import { Redirect } from 'expo-router';

import { useStatsEntry } from '~/providers/stats';

export default function HomeScreen() {
  const { entry } = useStatsEntry();

  return <Redirect href={{ pathname: '/stats/[entry]/', params: { entry: entry.id } }} />;
}
