import { getSource } from '~/utils/atlas';
import type { PartialAtlasBundle } from '~core/data/types';

export async function GET() {
  try {
    const bundles = (await getSource().listBundles()).sort(sortBundlesByPlatform);
    const bundlesWithRelativeEntry = bundles.map((bundle) => ({
      ...bundle,
      // TODO(cedric): this is a temporary workaround to make entry points look better on Windows
      // Need to figure out something better, without breaking the streaming-lookup of exported Atlas files.
      entryPoint: bundle.entryPoint
        .replace(bundle.sharedRoot, '') // Make the entry point relative to the shared root
        .replace(/\\+/g, '/') // Normalize Windows paths to POSIX paths
        .replace(/^\//, ''), // Remove any leading slashes
    }));

    return Response.json(bundlesWithRelativeEntry);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }
}

function sortBundlesByPlatform(a: PartialAtlasBundle, b: PartialAtlasBundle) {
  if (a.platform === 'server') return 1;
  if (b.platform === 'server') return -1;
  return 0;
}
