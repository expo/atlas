import type metro from 'metro';
import type { MetroConfig } from 'metro-config';
import path from 'path';

import type { AtlasBundle, AtlasModule, AtlasSource } from './types';
import { bufferIsUtf8 } from '../utils/buffer';
import { getUrlFromJscSafeUrl } from '../utils/jsc';
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
  /** All known entries, and detected changes, stored by ID */
  readonly entries: Map<AtlasBundle['id'], AtlasBundle> = new Map();

  constructor() {
    this.serializeGraph = this.serializeGraph.bind(this);
  }

  hasHmrSupport() {
    return true;
  }

  getBundleHmr(id: string) {
    // Get the required data from the bundle
    const bundle = this.getBundle(id);
    const bundleSourceUrl = bundle.serializeOptions?.sourceUrl;
    if (!bundleSourceUrl) {
      return null;
    }

    // Construct the HMR information, based on React Native
    // See: https://github.com/facebook/react-native/blob/2eb7bcb8d9c0f239a13897e3a5d4397d81d3f627/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/devsupport/DevSupportManagerBase.java#L696-L702
    const socketUrl = new URL('/hot', bundleSourceUrl);
    // Fix the entry point URL query parameter to be compatible with the HMR server
    const entryPoint = getUrlFromJscSafeUrl(bundleSourceUrl);

    return {
      bundleId: bundle.id,
      socketUrl,
      entryPoints: [entryPoint],
    };
  }

  listBundles() {
    return Array.from(this.entries.values()).map((bundle) => ({
      id: bundle.id,
      platform: bundle.platform,
      projectRoot: bundle.projectRoot,
      sharedRoot: bundle.sharedRoot,
      entryPoint: bundle.entryPoint,
    }));
  }

  getBundle(id: string) {
    const bundle = this.entries.get(id);
    if (!bundle) throw new Error(`Bundle "${id}" not found.`);
    return bundle;
  }

  /**
   * Serializes the Metro graph, converting it to an Atlas entry.
   * This also registers a listener to the Metro server to track changes, when possible.
   * All data is kept in memory, where stale data is overwritten by new data.
   */
  serializeGraph(options: ConvertGraphToAtlasOptions) {
    const bundle = convertGraph(options);
    this.entries.set(bundle.id, bundle);
    return bundle;
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
    id: Buffer.from(`${path.relative(sharedRoot, options.entryPoint)}+${platform}`).toString(
      'base64url'
    ), // FIX: only use URL allowed characters
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
