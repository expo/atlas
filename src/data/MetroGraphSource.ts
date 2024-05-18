import type metro from 'metro';
import type DeltaBundler from 'metro/src/DeltaBundler';
import type MetroServer from 'metro/src/Server';
import type { MetroConfig } from 'metro-config';
import path from 'path';

import type { AtlasBundle, AtlasBundleDelta, AtlasModule, AtlasSource } from './types';
import { bufferIsUtf8 } from '../utils/buffer';
import { getPackageNameFromPath } from '../utils/package';
import { convertPathToPosix, findSharedRoot } from '../utils/paths';

type MetroGraph = metro.Graph | metro.ReadOnlyGraph;
type MetroModule = metro.Module;

type ConvertGraphToAtlasOptions = {
  projectRoot: string;
  entryPoint: string;
  preModules: Readonly<MetroModule[]>;
  graph: MetroGraph;
  serializeOptions: Readonly<metro.SerializerOptions>;
  /** Options passed-through from the Metro config */
  metroConfig: {
    watchFolders?: Readonly<string[]>;
    resolver?: {
      sourceExts?: Readonly<string[]>;
      assetExts?: Readonly<string[]>;
    };
  };
};

export class MetroGraphSource implements AtlasSource {
  /** The Metro delta listener, instantiated when the Metro server is registered */
  protected deltaListener: MetroDeltaListener | null = null;
  /** All known entries, and detected changes, stored by ID */
  readonly entries: Map<AtlasBundle['id'], { entry: AtlasBundle; delta?: AtlasBundleDelta }> =
    new Map();

  constructor() {
    this.serializeGraph = this.serializeGraph.bind(this);
  }

  listBundles() {
    return Array.from(this.entries.values()).map((item) => ({
      id: item.entry.id,
      platform: item.entry.platform,
      projectRoot: item.entry.projectRoot,
      sharedRoot: item.entry.sharedRoot,
      entryPoint: item.entry.entryPoint,
    }));
  }

  getBundle(id: string) {
    const item = this.entries.get(id);
    if (!item) throw new Error(`Entry "${id}" not found.`);
    return item.entry;
  }

  getBundleDelta(id: string) {
    return this.entries.get(id)?.delta || null;
  }

  bundleDeltaEnabled() {
    return !!this.deltaListener;
  }

  /**
   * Serializes the Metro graph, converting it to an Atlas entry.
   * This also registers a listener to the Metro server to track changes, when possible.
   * All data is kept in memory, where stale data is overwritten by new data.
   */
  serializeGraph(options: ConvertGraphToAtlasOptions) {
    const entry = convertGraph(options);
    this.entries.set(entry.id, { entry });
    this.deltaListener?.registerGraph(entry.id, options.graph);
    return entry;
  }

  /**
   * Register the Metro server to listen for changes in serialized graphs.
   * Once changes are detected, the delta is generated and stored with the entry.
   * Changes allows the client to know when to refetch data.
   */
  registerMetro(metro: MetroServer) {
    if (!this.deltaListener) {
      this.deltaListener = new MetroDeltaListener(this, metro);
    }
  }
}

class MetroDeltaListener {
  private source: MetroGraphSource;
  private bundler: DeltaBundler<void>;
  private listeners: Map<AtlasBundle['id'], () => any> = new Map();

  constructor(source: MetroGraphSource, metro: MetroServer) {
    this.source = source;
    this.bundler = metro.getBundler().getDeltaBundler();
  }

  registerGraph(entryId: AtlasBundle['id'], graph: MetroGraph) {
    // Unregister the previous listener, to always have the most up-to-date graph
    if (this.listeners.has(entryId)) {
      this.listeners.get(entryId)!();
    }

    // Register the (new) delta listener
    this.listeners.set(
      entryId,
      this.bundler.listen(graph as any, async () => {
        const createdAt = new Date();
        this.bundler
          .getDelta(graph as any, { reset: false, shallow: true })
          .then((delta) => this.onMetroChange(entryId, delta, createdAt));
      })
    );
  }

  /**
   * Event handler invoked when a change is detected by Metro, using the DeltaBundler.
   * The detected change is combined with the Atlas entry ID, and updates the source entry with the delta.
   */
  onMetroChange(entryId: AtlasBundle['id'], delta: metro.DeltaResult<void>, createdAt: Date) {
    const item = this.source.entries.get(entryId);
    const hasChanges = (delta.added.size || delta.modified.size || delta.deleted.size) > 0;

    if (item && hasChanges) {
      item.delta = {
        createdAt,
        modifiedPaths: Array.from(delta.added.keys()).concat(Array.from(delta.modified.keys())),
        deletedPaths: Array.from(delta.deleted),
      };
    }
  }
}

/** Convert options from the Metro config, used during graph conversions to Atlas */
export function convertMetroConfig(config: MetroConfig): ConvertGraphToAtlasOptions['metroConfig'] {
  return {
    watchFolders: config.watchFolders,
    resolver: {
      sourceExts: config.resolver?.sourceExts,
      assetExts: config.resolver?.assetExts,
    },
  };
}

/** Convert a Metro graph instance to a JSON-serializable entry */
export function convertGraph(options: ConvertGraphToAtlasOptions): AtlasBundle {
  const sharedRoot = getSharedRoot(options);
  const serializeOptions = convertSerializeOptions(options);
  const transformOptions = convertTransformOptions(options);
  const platform =
    transformOptions?.customTransformOptions?.environment === 'node'
      ? 'server'
      : transformOptions?.platform ?? 'unknown';

  return {
    id: Buffer.from(`${options.entryPoint}+${platform}`).toString('base64url'), // FIX: only use URL allowed characters
    platform,
    projectRoot: options.projectRoot,
    sharedRoot,
    entryPoint: options.entryPoint,
    runtimeModules: options.preModules.map((module) => convertModule(options, module, sharedRoot)),
    modules: collectEntryPointModules(options, sharedRoot),
    serializeOptions,
    transformOptions,
  };
}

/** Find and collect all dependnecies related to the entrypoint within the graph */
export function collectEntryPointModules(
  options: Pick<
    ConvertGraphToAtlasOptions,
    'graph' | 'entryPoint' | 'serializeOptions' | 'metroConfig'
  >,
  sharedRoot: string
) {
  const modules = new Map<string, AtlasModule>();

  /** Discover and collect all files related to the provided module path */
  function discover(modulePath: string) {
    const module = options.graph.dependencies.get(modulePath);
    if (module && !modules.has(modulePath) && !moduleIsVirtual(module)) {
      modules.set(modulePath, convertModule(options, module, sharedRoot));
      module.dependencies.forEach((modulePath) => discover(modulePath.absolutePath));
    }
  }

  // Find and collect all modules related to the entry point
  discover(options.entryPoint);

  return modules;
}

/** Convert a Metro module to a JSON-serializable Atlas module */
export function convertModule(
  options: Pick<ConvertGraphToAtlasOptions, 'graph' | 'metroConfig' | 'serializeOptions'>,
  module: MetroModule,
  sharedRoot: string
): AtlasModule {
  const { createModuleId } = options.serializeOptions;

  return {
    id: createModuleId(module.path),
    absolutePath: module.path,
    relativePath: convertPathToPosix(path.relative(sharedRoot, module.path)),
    package: getPackageNameFromPath(module.path),
    size: module.output.reduce((bytes, output) => bytes + Buffer.byteLength(output.data.code), 0),
    imports: Array.from(module.dependencies.values()).map((module) => ({
      id: createModuleId(module.absolutePath),
      absolutePath: module.absolutePath,
      relativePath: convertPathToPosix(path.relative(sharedRoot, module.absolutePath)),
      package: getPackageNameFromPath(module.absolutePath),
    })),
    importedBy: Array.from(module.inverseDependencies)
      .filter((path) => options.graph.dependencies.has(path))
      .map((absolutePath) => ({
        id: createModuleId(absolutePath),
        absolutePath,
        relativePath: convertPathToPosix(path.relative(sharedRoot, absolutePath)), // TODO
        package: getPackageNameFromPath(absolutePath),
      })),
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
  options: Pick<ConvertGraphToAtlasOptions, 'metroConfig'>,
  module: MetroModule
) {
  const fileExtension = path.extname(module.path).replace('.', '');

  if (options.metroConfig.resolver?.sourceExts?.includes(fileExtension)) {
    return module.getSource().toString();
  }

  if (options.metroConfig.resolver?.assetExts?.includes(fileExtension)) {
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
  options: Pick<ConvertGraphToAtlasOptions, 'graph'>
): AtlasBundle['transformOptions'] {
  return options.graph.transformOptions ?? {};
}

/** Convert Metro serialize options to a JSON-serializable object */
export function convertSerializeOptions(
  options: Pick<ConvertGraphToAtlasOptions, 'serializeOptions'>
): AtlasBundle['serializeOptions'] {
  const serializeOptions: AtlasBundle['serializeOptions'] = { ...options.serializeOptions };

  // Delete all non-serializable functions
  delete serializeOptions['processModuleFilter'];
  delete serializeOptions['createModuleId'];
  delete serializeOptions['getRunModuleStatement'];
  delete serializeOptions['shouldAddToIgnoreList'];

  return serializeOptions;
}

/** Get the shared root of `projectRoot` and `watchFolders`, used to make all paths within the bundle relative */
function getSharedRoot(options: Pick<ConvertGraphToAtlasOptions, 'projectRoot' | 'metroConfig'>) {
  const { watchFolders } = options.metroConfig;
  return !watchFolders?.length
    ? options.projectRoot
    : findSharedRoot([options.projectRoot, ...watchFolders]) ?? options.projectRoot;
}

/** Determine if the module is a virtual module, like shims or canaries, which should be excluded from results */
function moduleIsVirtual(module: MetroModule) {
  return module.path.startsWith('\0');
}
