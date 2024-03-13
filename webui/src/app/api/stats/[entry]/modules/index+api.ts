import picomatch from 'picomatch';

import { filtersFromUrlParams } from '~/providers/modules';
import { getSource } from '~/utils/atlas';
import { type StatsEntry, type StatsModule } from '~plugin';

/** The partial module data, when listing all available modules from a stats entry */
export type ModuleMetadata = Omit<StatsModule, 'source' | 'output'> & {
  source: undefined;
  output: undefined;
};

export type EntryGraphData = {
  metadata: {
    platform: 'android' | 'ios' | 'web';
    size: number;
    modulesCount: number;
  };
  data: {
    size: number;
    modulesCount: number;
    modules: ModuleMetadata[];
  };
};

export async function GET(request: Request, params: Record<'entry', string>) {
  let entry: StatsEntry;

  try {
    entry = await getSource().getEntry(params.entry);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }

  const filteredModules = filterModules(request, entry);
  const data: EntryGraphData = {
    metadata: {
      platform: entry.platform as any,
      size: Array.from(entry.modules.values()).reduce((size, module) => size + module.size, 0),
      modulesCount: entry.modules.size,
    },
    data: {
      size: filteredModules.reduce((size, module) => size + module.size, 0),
      modulesCount: filteredModules.length,
      modules: filteredModules,
    },
  };

  return Response.json(data);
}

/**
 * Filter the node modules based on query parameters.
 *   - `modules=project,node_modules` to show only project code and/or node_modules
 *   - `include=<glob>` to only include specific glob patterns
 *   - `exclude=<glob>` to only exclude specific glob patterns
 */
function filterModules(request: Request, stats: StatsEntry): ModuleMetadata[] {
  const filters = filtersFromUrlParams(new URL(request.url).searchParams);
  let filteredModules = Array.from(stats.modules.values()) ?? [];

  if (!filters.types.includes('node_modules')) {
    filteredModules = filteredModules.filter((module) => module.package === undefined);
  }

  if (filters.include || filters.exclude) {
    const matcher = picomatch(prefixPattern(filters.include || null) ?? '**', {
      cwd: stats.projectRoot,
      nocase: true,
      ignore: prefixPattern(filters.exclude || null),
    });

    filteredModules = filteredModules.filter((module) => matcher(module.path));
  }

  return filteredModules.map((module) => ({
    ...module,
    source: undefined,
    output: undefined,
  }));
}

/** Prefix the patterns with `**\/` to make the globs search on the ending patterns */
function prefixPattern(pattern: string | null) {
  if (pattern === null) return undefined;
  if (['!', '*', '/'].includes(pattern[0])) return pattern;
  return `**/${pattern}`;
}

/**
 * Get the full module information through a post request.
 */
export async function POST(request: Request, params: Record<'entry', string>) {
  const moduleRef: string | undefined = (await request.json()).path;
  if (!moduleRef) {
    return Response.json(
      { error: `Module ID not provided, expected a "path" property.` },
      { status: 406 }
    );
  }

  let entry: StatsEntry;

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
