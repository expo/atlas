import { PartialModule } from '../index+api';

import { getSource } from '~/utils/atlas';

/**
 * Get the full module information through a post request.
 * This requires a `path` property in the request body.
 * Note, this is a workaround due to routing issues when having both `/modules/graph` and `/modules/:module/index` routes.
 */
export async function GET(_request: Request, params: Record<'entry' | 'module', string>) {
  try {
    const entry = await getSource().getEntry(params.entry);
    const module = entry && entry.modules.get(decodeURIComponent(params.module));

    if (!entry || !module) {
      return Response.json(
        !entry
          ? { error: `Entry not found: ${params.entry}` }
          : { error: `Module not found: ${params.module}` },
        { status: 404 }
      );
    }

    return Response.json({ ...module, source: undefined, output: undefined } as PartialModule);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
