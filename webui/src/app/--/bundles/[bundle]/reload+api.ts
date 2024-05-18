import { getSource } from '~/utils/atlas';

export async function GET(_request: Request, params: Record<'bundle', string>) {
  try {
    const bundle = await getSource().getBundle(params.bundle);
    if (!bundle) {
      return Response.json({ error: 'Bundle not found' }, { status: 404 });
    }

    if (!bundle.serializeOptions?.sourceUrl) {
      return Response.json(
        { error: 'Bundle has no `serializeOptions.sourceUrl`' },
        { status: 406 }
      );
    }

    // Convert the source URL to localhost, and call it from within the API.
    // This is necessary to avoid "unauthorized requests" in Metro.
    const sourceUrl = new URL(bundle.serializeOptions.sourceUrl);
    sourceUrl.hostname = 'localhost';
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Metro responded with an error: ${response.statusText}`);
    }

    // We still need to await the response body, to ensure the data is fully passed through Atlas.
    await response.text();

    return Response.json({ success: response.ok }, { status: response.status })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }
}
