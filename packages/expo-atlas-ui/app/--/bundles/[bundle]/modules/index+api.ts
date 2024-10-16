import type { AtlasBundle, AtlasModule } from 'expo-atlas';

import { getSource } from '~/utils/atlas';
import { filterModules, moduleFiltersFromParams } from '~/utils/filters';

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
    filters: moduleFiltersFromParams(query),
    searchPath: query.get('path') || undefined,
  });

  const response: ModuleListResponse = {
    data: filteredModules.map((module) => ({
      ...module,
      source: undefined,
      output: undefined,
    })),
    bundle: {
      platform: bundle.platform as any,
      moduleFiles: bundle.modules.size + bundle.runtimeModules.length,
      moduleSize: allModules
        .concat(bundle.runtimeModules)
        .reduce((size, module) => size + module.size, 0),
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

  const module = getModuleByAbsoluteOrRelativePath(bundle, moduleRef);
  return module
    ? Response.json(module)
    : Response.json({ error: `Module "${moduleRef}" not found.` }, { status: 404 });
}

// TODO(cedric): simplify this
function getModuleByAbsoluteOrRelativePath(bundle: AtlasBundle, moduleRef: string) {
  const moduleByRef = bundle.modules.get(moduleRef);
  if (moduleByRef) return moduleByRef;

  const moduleRefWithSharedRoot = `${bundle.sharedRoot}/${moduleRef}`;
  const moduleBySharedRoot = bundle.modules.get(moduleRefWithSharedRoot);
  if (moduleBySharedRoot) return moduleBySharedRoot;

  const moduleBySharedRootNonPosix = moduleRefWithSharedRoot.replace(/\//g, '\\');
  const moduleBySharedRootNonPosixPath = bundle.modules.get(moduleBySharedRootNonPosix);
  if (moduleBySharedRootNonPosixPath) return moduleBySharedRootNonPosixPath;
}
