import { getSource } from '~/utils/atlas';

export async function GET(_request: Request, params: Record<'entry', string>) {
  try {
    const entry = await getSource().getEntry(params.entry);
    if (!entry) {
      return Response.json({ error: 'Entry not found' }, { status: 404 });
    }

    if (!entry.serializeOptions?.sourceUrl) {
      return Response.json({ error: 'Entry has no `serializeOptions.sourceUrl`' }, { status: 406 });
    }

    return Response.redirect(entry.serializeOptions.sourceUrl, 302);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }
}
