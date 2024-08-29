import type { AtlasBundle } from 'expo-atlas';

import { getSource } from '~/utils/atlas';

export async function POST(_request: Request) {
  try {
    const source = getSource();

    // Only reload bundles when HMR is enabled
    if (!source.hasHmrSupport()) {
      return Response.json({ error: 'HMR not supported' });
    }

    // Fetch all known bundles from Metro to trigger a data update through the `customSerializer` hook
    const bundles = await source.listBundles();
    // Trigger a new reload on all bundles
    await Promise.all(
      bundles.map((bundle) => Promise.resolve(source.getBundle(bundle.id)).then(fetchBundle))
    );

    return Response.json({ success: true, bundles });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }
}

function fetchBundle(bundle: AtlasBundle) {
  if (!bundle.serializeOptions?.sourceUrl) {
    return; // Unknown source URL, can't fetch the bundle
  }

  // Convert the source URL to localhost, avoiding "unauthorized requests" in Metro
  const sourceUrl = new URL(bundle.serializeOptions.sourceUrl);
  sourceUrl.hostname = 'localhost';

  return fetch(sourceUrl)
    .then((response) => (response.ok ? response : null))
    .then((response) => response?.text());
}
