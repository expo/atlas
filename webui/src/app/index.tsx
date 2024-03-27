import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';

import { Page, PageCentered } from '~/components/Page';
import { Button } from '~/ui/Button';
import { Spinner } from '~/ui/Spinner';
import { fetchApi } from '~/utils/api';
import type { PartialStatsEntry } from '~core/data/types';

export default function GraphScreen() {
  const entries = useStatsEntriesData();

  if (entries.isLoading) {
    return (
      <Page variant="viewport">
        <PageCentered>
          <Spinner />
        </PageCentered>
      </Page>
    );
  }

  return (
    <Page variant="viewport">
      <div className="flex flex-1 flex-col items-center justify-center">
        {entries.data?.map((entry) => (
          <Link asChild key={entry.id} href={{ pathname: '/[entry]', params: { entry: entry.id } }}>
            <Button variant="secondary">
              {entry.platform} - {entry.entryPoint}
            </Button>
          </Link>
        ))}

        <ul>
          {entries.data?.map((entry) => (
            <li key={entry.id}>
              [{entry.platform}] - {entry.entryPoint}
            </li>
          ))}
        </ul>
      </div>
    </Page>
  );
}

/** Load all available stats entries from API */
export function useStatsEntriesData() {
  return useQuery<PartialStatsEntry[]>({
    queryKey: ['stats-entries'],
    queryFn: () => fetchApi('/api/stats').then((res) => res.json()),
  });
}
