import { getSource } from '~/utils/atlas';
import { PartialAtlasEntry } from '~core/data/types';

export async function GET() {
  try {
    const entries = await getSource().listEntries();
    return Response.json(entries.sort(sortEntriesByPlatform));
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }
}

function sortEntriesByPlatform(a: PartialAtlasEntry, b: PartialAtlasEntry) {
  if (a.platform === 'server') return 1;
  if (b.platform === 'server') return -1;
  return 0;
}
