import { getSource } from '~/utils/atlas';

export async function GET(_request: Request, params: Record<'bundle', string>) {
  try {
    return Response.json(await getSource().getBundle(params.bundle));
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }
}
