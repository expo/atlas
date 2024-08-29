import { getSource } from '~/utils/atlas';

export async function GET(_request: Request, params: Record<'bundle', string>) {
  try {
    const source = getSource();
    if (!source.hasHmrSupport()) {
      return Response.json({ error: 'HMR not supported' }, { status: 406 });
    }

    return Response.json(source.getBundleHmr(params.bundle));
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }
}
