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

    // Convert the source URL to localhost, avoiding "unauthorized requests" in Metro
    const sourceUrl = new URL(bundle.serializeOptions.sourceUrl);
    sourceUrl.hostname = 'localhost';

    return Response.redirect(sourceUrl, 302);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }
}
