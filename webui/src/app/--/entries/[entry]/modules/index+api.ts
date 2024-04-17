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
