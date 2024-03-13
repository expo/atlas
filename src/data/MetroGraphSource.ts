import type metro from 'metro';

import type { StatsEntry, StatsModule, StatsSource } from './types';
import { getNonBinaryContents } from '../utils/buffer';
import { getPackageNameFromPath } from '../utils/package';

type MetroGraph = metro.Graph | metro.ReadOnlyGraph;
type MetroModule = metro.Module;

type ConvertGraphToStatsOptions = {
  projectRoot: string;
  entryPoint: string;
  preModules: Readonly<MetroModule[]>;
  graph: MetroGraph;
  options: Readonly<metro.SerializerOptions>;
};

export class MetroGraphSource implements StatsSource {
  /** All known stats entries, stored by ID */
  protected entries: Map<StatsEntry['id'], StatsEntry> = new Map();

  listEntries() {
    return Array.from(this.entries.values()).map((entry) => ({
      id: entry.id,
      platform: entry.platform,
      projectRoot: entry.projectRoot,
      entryPoint: entry.entryPoint,
    }));
  }

  getEntry(id: string) {
    const entry = this.entries.get(id);
    if (!entry) {
      throw new Error(`Stats entry "${id}" not found.`);
    }
    return entry;
  }

  /**
   * Event handler when a new graph instance is ready to serialize.
   * This converts all relevant data stored in the graph to stats objects.
   */
  onSerializeGraph(options: ConvertGraphToStatsOptions) {
    const entry = convertGraph(options);
    this.entries.set(entry.id, entry);
    return entry;
  }
}

/** Convert a Metro graph instance to a JSON-serializable stats entry */
export function convertGraph(options: ConvertGraphToStatsOptions): StatsEntry {
  const serializeOptions = convertSerializeOptions(options.options);
  const transformOptions = convertTransformOptions(options.graph.transformOptions);
  const platform =
    transformOptions?.customTransformOptions?.environment === 'node'
      ? 'server'
      : transformOptions?.platform ?? 'unknown';

  return {
    id: `${options.entryPoint}+${platform}`,
    platform,
    projectRoot: options.projectRoot,
    entryPoint: options.entryPoint,
    runtimeModules: options.preModules.map((module) => convertModule(options.graph, module)),
    modules: collectEntryPointModules(options.graph, options.entryPoint),
    serializeOptions,
    transformOptions,
  };
}

/** Find and collect all dependnecies related to the entrypoint within the graph */
export function collectEntryPointModules(graph: MetroGraph, entryPoint: string) {
  const modules = new Map<string, StatsModule>();

  function discover(modulePath: string) {
    const module = graph.dependencies.get(modulePath);

    if (module && !modules.has(modulePath)) {
      modules.set(modulePath, convertModule(graph, module));
      module.dependencies.forEach((modulePath) => discover(modulePath.absolutePath));
    }
  }

  discover(entryPoint);
  return modules;
}

/** Convert a Metro module to a JSON-serializable stats module */
export function convertModule(graph: MetroGraph, module: MetroModule): StatsModule {
  return {
    path: module.path,
    package: getPackageNameFromPath(module.path),
    size: module.output.reduce((bytes, output) => bytes + Buffer.byteLength(output.data.code), 0),
    imports: Array.from(module.dependencies.values()).map((module) => module.absolutePath),
    importedBy: Array.from(module.inverseDependencies).filter((dependecy) =>
      graph.dependencies.has(dependecy)
    ),
    source: getNonBinaryContents(module.getSource()) ?? '[binary file]',
    output: module.output.map((output) => ({
      type: output.type,
      data: { code: output.data.code },
    })),
  };
}

/** Convert Metro transform options to a JSON-serializable object */
export function convertTransformOptions(
  transformer: metro.TransformInputOptions
): StatsEntry['transformOptions'] {
  return transformer;
}

/** Convert Metro serialize options to a JSON-serializable object */
export function convertSerializeOptions(
  serializer: metro.SerializerOptions
): StatsEntry['serializeOptions'] {
  const options: StatsEntry['serializeOptions'] = { ...serializer };

  // Delete all filters
  delete options['processModuleFilter'];
  delete options['createModuleId'];
  delete options['getRunModuleStatement'];
  delete options['shouldAddToIgnoreList'];

  return options;
}
