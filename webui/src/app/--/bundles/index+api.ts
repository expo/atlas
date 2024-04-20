import { getSource } from '~/utils/atlas';
import type { PartialAtlasBundle } from '~core/data/types';

export async function GET() {
  try {
    const bundles = await getSource().listBundles();
    return Response.json(bundles.sort(sortBundlesByPlatform));
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }
}

function sortBundlesByPlatform(a: PartialAtlasBundle, b: PartialAtlasBundle) {
  if (a.platform === 'server') return 1;
  if (b.platform === 'server') return -1;
  return 0;
}
