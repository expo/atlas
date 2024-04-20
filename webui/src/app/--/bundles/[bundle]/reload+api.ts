import { getSource } from '~/utils/atlas';

export async function GET(_request: Request, params: Record<'bundle', string>) {
  try {
    const bundle = await getSource().getBundle(params.bundle);
    if (!bundle) {
      return Response.json({ error: 'Entry not found' }, { status: 404 });
    }

    if (!bundle.serializeOptions?.sourceUrl) {
      return Response.json({ error: 'Entry has no `serializeOptions.sourceUrl`' }, { status: 406 });
    }

    return Response.redirect(bundle.serializeOptions.sourceUrl, 302);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }
}
