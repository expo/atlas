import { getSource } from '~/utils/atlas';
import type { AtlasBundleDelta } from '~core/data/types';

export type BundleDeltaResponse = {
  isEnabled: boolean;
  delta: null | AtlasBundleDelta;
};

export async function GET(_request: Request, params: Record<'bundle', string>) {
  try {
    const isEnabled = getSource().bundleDeltaEnabled();
    const response: BundleDeltaResponse = {
      isEnabled,
      delta: !isEnabled ? null : await getSource().getBundleDelta(params.bundle),
    };

    return Response.json(response, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }
}
