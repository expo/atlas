import { getSource } from '~/utils/atlas';
import { AtlasEntryDelta } from '~core/data/types';

export type EntryDeltaResponse = {
  isEnabled: boolean;
  delta: null | AtlasEntryDelta;
};

export async function GET(_request: Request, params: Record<'entry', string>) {
  try {
    const isEnabled = getSource().entryDeltaEnabled();
    const response: EntryDeltaResponse = {
      isEnabled,
      delta: !isEnabled ? null : await getSource().getEntryDelta(params.entry),
    };

    return Response.json(response, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }
}
