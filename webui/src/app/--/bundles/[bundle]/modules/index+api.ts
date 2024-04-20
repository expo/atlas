import { getSource } from '~/utils/atlas';
import { filterModules, moduleFiltersFromParams } from '~/utils/filters';
import type { AtlasBundle, AtlasModule } from '~core/data/types';

/** The partial module data, when listing all available modules from an entry */
export type PartialModule = Omit<AtlasModule, 'source' | 'output'>;

export type ModuleListResponse = {
  data: PartialModule[];
  bundle: {
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
export async function GET(request: Request, params: Record<'bundle', string>) {
  let bundle: AtlasBundle;

  try {
    bundle = await getSource().getBundle(params.bundle);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }

  const query = new URL(request.url).searchParams;
  const allModules = Array.from(bundle.modules.values());
  const filteredModules = filterModules(allModules, {
    projectRoot: bundle.projectRoot,
    filters: moduleFiltersFromParams(query),
    rootPath: query.get('path') || undefined,
  });

  const response: ModuleListResponse = {
    data: filteredModules.map((module) => ({
      ...module,
      source: undefined,
      output: undefined,
    })),
    bundle: {
      platform: bundle.platform as any,
      moduleSize: allModules.reduce((size, module) => size + module.size, 0),
      moduleFiles: bundle.modules.size,
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
export async function POST(request: Request, params: Record<'bundle', string>) {
  const moduleRef: string | undefined = (await request.json()).path;
  if (!moduleRef) {
    return Response.json(
      { error: `Module ID not provided, expected a "path" property.` },
      { status: 406 }
    );
  }

  let bundle: AtlasBundle;

  try {
    bundle = await getSource().getBundle(params.bundle);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }

  const module = bundle.modules.get(moduleRef);
  return module
    ? Response.json(module)
    : Response.json({ error: `Module "${moduleRef}" not found.` }, { status: 404 });
}
