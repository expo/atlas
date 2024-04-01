import { statsModuleFiltersFromUrlParams } from '~/components/forms/StatsModuleFilter';
import { getSource } from '~/utils/atlas';
import { globFilterModules } from '~/utils/search';
import { createModuleTree, finalizeModuleTree } from '~/utils/treemap';
import type { StatsEntry, StatsModule } from '~core/data/types';

export async function GET(request: Request, params: Record<'entry', string>) {
  let entry: StatsEntry;

  try {
    entry = await getSource().getEntry(params.entry);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }

  let tree = createModuleTree(filterModules(request, entry));

  const url = new URL(request.url);
  const filterPath = url.searchParams.get('path');

  if (filterPath) {
    for (const segment of filterPath.split('/')) {
      const child = tree.children?.find((child) => child.name === segment);

      if (!child) {
        return Response.json({ error: `Path not found: ${filterPath}` }, { status: 404 });
      }

      tree = child;
    }
  }

  return Response.json(finalizeModuleTree(tree));
}

/**
 * Filter the node modules based on query parameters.
 *   - `modules=project,node_modules` to show only project code and/or node_modules
 *   - `include=<glob>` to only include specific glob patterns
 *   - `exclude=<glob>` to only exclude specific glob patterns
 */
function filterModules(request: Request, stats: StatsEntry): StatsModule[] {
  const filters = statsModuleFiltersFromUrlParams(new URL(request.url).searchParams);
  let modules = Array.from(stats.modules.values());

  if (!filters.modules.includes('node_modules')) {
    modules = modules.filter((module) => !module.package);
  }

  return globFilterModules(modules, stats.projectRoot, filters);
}
