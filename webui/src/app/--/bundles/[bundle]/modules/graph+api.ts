import { getSource } from '~/utils/atlas';
import { filterModules, moduleFiltersFromParams } from '~/utils/filters';
import { type TreemapNode, createModuleTree, finalizeModuleTree } from '~/utils/treemap';
import type { AtlasBundle } from '~core/data/types';

export type ModuleGraphResponse = {
  data: TreemapNode;
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

  const response: ModuleGraphResponse = {
    data: finalizeModuleTree(createModuleTree(filteredModules)),
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
