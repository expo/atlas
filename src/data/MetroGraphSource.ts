import type metro from 'metro';
import path from 'path';

import type { StatsEntry, StatsModule, StatsSource } from './types';
import { bufferIsUtf8 } from '../utils/buffer';
import { getPackageNameFromPath } from '../utils/package';

type MetroGraph = metro.Graph | metro.ReadOnlyGraph;
type MetroModule = metro.Module;

type ConvertGraphToStatsOptions = {
  projectRoot: string;
  entryPoint: string;
  preModules: Readonly<MetroModule[]>;
  graph: MetroGraph;
  options: Readonly<metro.SerializerOptions>;
  extensions?: {
    source?: Readonly<string[]>;
    asset?: Readonly<string[]>;
  };
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
  const serializeOptions = convertSerializeOptions(options);
  const transformOptions = convertTransformOptions(options);
  const platform =
    transformOptions?.customTransformOptions?.environment === 'node'
      ? 'server'
      : transformOptions?.platform ?? 'unknown';

  return {
    id: Buffer.from(`${options.entryPoint}+${platform}`).toString('base64'), // FIX: only use URL allowed characters
    platform,
    projectRoot: options.projectRoot,
    entryPoint: options.entryPoint,
    runtimeModules: options.preModules.map((module) => convertModule(options, module)),
    modules: collectEntryPointModules(options),
    serializeOptions,
    transformOptions,
  };
}

/** Find and collect all dependnecies related to the entrypoint within the graph */
export function collectEntryPointModules(
  options: Pick<ConvertGraphToStatsOptions, 'graph' | 'entryPoint' | 'extensions'>
) {
  const modules = new Map<string, StatsModule>();

  function discover(modulePath: string) {
    const module = options.graph.dependencies.get(modulePath);

    if (module && !modules.has(modulePath)) {
      modules.set(modulePath, convertModule(options, module));
      module.dependencies.forEach((modulePath) => discover(modulePath.absolutePath));
    }
  }

  discover(options.entryPoint);
  return modules;
}

/** Convert a Metro module to a JSON-serializable stats module */
export function convertModule(
  options: Pick<ConvertGraphToStatsOptions, 'graph' | 'extensions'>,
  module: MetroModule
): StatsModule {
  return {
    path: module.path,
    package: getPackageNameFromPath(module.path),
    size: module.output.reduce((bytes, output) => bytes + Buffer.byteLength(output.data.code), 0),
    imports: Array.from(module.dependencies.values()).map((module) => module.absolutePath),
    importedBy: Array.from(module.inverseDependencies).filter((dependecy) =>
      options.graph.dependencies.has(dependecy)
    ),
    source: getModuleSourceContent(options, module),
    output: module.output.map((output) => ({
      type: output.type,
      data: { code: output.data.code },
    })),
  };
}

/**
 * Attempt to load the source file content from module.
 * If a file is an asset, it returns `[binary file]` instead.
 */
function getModuleSourceContent(
  options: Pick<ConvertGraphToStatsOptions, 'extensions'>,
  module: MetroModule
) {
  const fileExtension = path.extname(module.path).replace('.', '');

  if (options.extensions?.source?.includes(fileExtension)) {
    return module.getSource().toString();
  }

  if (options.extensions?.asset?.includes(fileExtension)) {
    return '[binary file]';
  }

  if (module.path.includes('?ctx=')) {
    return module.getSource().toString();
  }

  if (bufferIsUtf8(module.getSource())) {
    return module.getSource().toString();
  }

  return '[binary file]';
}

/** Convert Metro transform options to a JSON-serializable object */
export function convertTransformOptions(
  options: Pick<ConvertGraphToStatsOptions, 'graph'>
): StatsEntry['transformOptions'] {
  return options.graph.transformOptions ?? {};
}

/** Convert Metro serialize options to a JSON-serializable object */
export function convertSerializeOptions(
  options: Pick<ConvertGraphToStatsOptions, 'options'>
): StatsEntry['serializeOptions'] {
  const serializeOptions: StatsEntry['serializeOptions'] = { ...options.options };

  // Delete all filters
  delete serializeOptions['processModuleFilter'];
  delete serializeOptions['createModuleId'];
  delete serializeOptions['getRunModuleStatement'];
  delete serializeOptions['shouldAddToIgnoreList'];

  return serializeOptions;
}
