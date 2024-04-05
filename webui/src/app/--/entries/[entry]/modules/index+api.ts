import { getSource } from '~/utils/atlas';
import { filterModules, moduleFiltersFromParams } from '~/utils/filters';
import { type AtlasEntry, type AtlasModule } from '~core/data/types';

/** The partial module data, when listing all available modules from an entry */
export type PartialModule = Omit<AtlasModule, 'source' | 'output'>;

export type ModuleListResponse = {
  data: PartialModule[];
  entry: {
    platform: 'android' | 'ios' | 'web';
    moduleSize: number;
    moduleFiles: number;
  };
  filtered: {
    moduleSize: number;
    moduleFiles: number;
  };
};

/** Get all modules as simple list */
export async function GET(request: Request, params: Record<'entry', string>) {
  let entry: AtlasEntry;

  try {
    entry = await getSource().getEntry(params.entry);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }

  const query = new URL(request.url).searchParams;
  const allModules = Array.from(entry.modules.values());
  const filteredModules = filterModules(allModules, {
    projectRoot: entry.projectRoot,
    filters: moduleFiltersFromParams(query),
    rootPath: query.get('path') || undefined,
  });

  const response: ModuleListResponse = {
    data: filteredModules.map((module) => ({
      ...module,
      source: undefined,
      output: undefined,
    })),
    entry: {
      platform: entry.platform as any,
      moduleSize: allModules.reduce((size, module) => size + module.size, 0),
      moduleFiles: entry.modules.size,
    },
    filtered: {
      moduleSize: filteredModules.reduce((size, module) => size + module.size, 0),
      moduleFiles: filteredModules.length,
    },
  };

  return Response.json(response);
}

/**
 * Get the full module information through a post request.
 * This requires a `path` property in the request body.
 */
export async function POST(request: Request, params: Record<'entry', string>) {
  const moduleRef: string | undefined = (await request.json()).path;
  if (!moduleRef) {
    return Response.json(
      { error: `Module ID not provided, expected a "path" property.` },
      { status: 406 }
    );
  }

  let entry: AtlasEntry;

  try {
    entry = await getSource().getEntry(params.entry);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }

  const module = entry.modules.get(moduleRef);
  return module
    ? Response.json(module)
    : Response.json({ error: `Module "${moduleRef}" not found.` }, { status: 404 });
}
