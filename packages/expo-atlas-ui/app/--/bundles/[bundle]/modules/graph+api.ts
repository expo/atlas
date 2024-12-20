import type { AtlasBundle } from 'expo-atlas';

import { getSource } from '~/utils/atlas';
import { filterModules, moduleFiltersFromParams } from '~/utils/filters';
import { type TreemapNode, createModuleTree, finalizeModuleTree } from '~/utils/treemap';

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
    filters: moduleFiltersFromParams(query),
    exactPath: query.get('path') || undefined,
  });

  const response: ModuleGraphResponse = {
    data: finalizeModuleTree(createModuleTree(bundle, filteredModules)),
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
