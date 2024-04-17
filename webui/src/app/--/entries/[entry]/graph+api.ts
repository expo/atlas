import { getSource } from '~/utils/atlas';
import { filterModules, moduleFiltersFromParams } from '~/utils/filters';
import { type TreemapNode, createModuleTree, finalizeModuleTree } from '~/utils/treemap';
import type { AtlasEntry } from '~core/data/types';

export type ModuleGraphResponse = {
  data: TreemapNode;
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

  const response: ModuleGraphResponse = {
    data: finalizeModuleTree(createModuleTree(filteredModules)),
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
