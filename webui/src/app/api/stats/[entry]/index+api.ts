import { getSource } from '~/utils/atlas';

export async function GET(_request: Request, params: Record<'entry', string>) {
  try {
    return Response.json(await getSource().getEntry(params.entry));
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }
}
