import { type SerializerConfigT } from 'metro-config';
import path from 'path';
import { getNonBinaryContents } from '../utils/buffer';

type CustomSerializerParameters = Parameters<NonNullable<SerializerConfigT['customSerializer']>>;
type ConvertOptions = {
  projectRoot: string;
  entryPoint: CustomSerializerParameters[0];
  preModules: CustomSerializerParameters[1];
  graph: CustomSerializerParameters[2];
  options: CustomSerializerParameters[3];
};

export type MetroStatsEntry = ReturnType<typeof convertGraphToStats>;
export type MetroStatsModule = ReturnType<typeof convertModule>;

export function convertGraphToStats({
  projectRoot,
  entryPoint,
  preModules,
  graph,
  options,
}: ConvertOptions) {
  return {
    projectRoot,
    entryPoint,
    platform: graph.transformOptions.platform ?? 'unknown',
    preModules: preModules.map((module) => convertModule(projectRoot, graph, module)),
    graph: convertGraph(projectRoot, entryPoint, graph),
    options: convertOptions(options),
  };
}

function convertOptions(options: ConvertOptions['options']) {
  return {
    ...options,
    processModuleFilter: undefined,
    createModuleId: undefined,
    getRunModuleStatement: undefined,
    shouldAddToIgnoreList: undefined,
  };
}

function convertGraph(projectRoot: string, entryPoint: string, graph: ConvertOptions['graph']) {
  const dependencies = new Map<string, MetroStatsModule>();

  function walk(modulePath: string) {
    const module = graph.dependencies.get(modulePath);
    if (module && !dependencies.has(modulePath)) {
      dependencies.set(modulePath, convertModule(projectRoot, graph, module));
      module.dependencies.forEach((modulePath) => walk(modulePath.absolutePath));
    }
  }

  walk(entryPoint);

  return {
    ...graph,
    entryPoints: Array.from(graph.entryPoints.values()),
    dependencies: Array.from(dependencies.values()),
  };
}

function convertModule(
  projectRoot: string,
  graph: ConvertOptions['graph'],
  module: ConvertOptions['preModules'][0]
) {
  const nodeModuleName = getNodeModuleNameFromPath(module.path);

  return {
    nodeModuleName: nodeModuleName || '[unknown]',
    isNodeModule: !!nodeModuleName,
    relativePath: path.relative(projectRoot, module.path),
    absolutePath: module.path,
    size: getModuleOutputInBytes(module),
    dependencies: Array.from(module.dependencies.values()).map((dependency) =>
      path.relative(projectRoot, dependency.absolutePath)
    ),
    inverseDependencies: Array.from(module.inverseDependencies)
      .filter((dependencyPath) => graph.dependencies.has(dependencyPath))
      .map((dependencyPath) => ({
        relativePath: path.relative(projectRoot, dependencyPath),
        absolutePath: dependencyPath,
      })),

    source: getNonBinaryContents(module.getSource()) ?? '[binary file]',
    output: module.output.map((output) => ({
      type: output.type,
      data: { code: output.data.code }, // Avoid adding source maps, this is too big for json
    })),
  };
}

function getModuleOutputInBytes(module: ConvertOptions['preModules'][0]) {
  return module.output.reduce(
    (bytes, module) => bytes + Buffer.byteLength(module.data.code, 'utf-8'),
    0
  );
}

const nodeModuleNameCache = new Map<string, string>();
function getNodeModuleNameFromPath(path: string) {
  if (nodeModuleNameCache.has(path)) {
    return nodeModuleNameCache.get(path) ?? null;
  }

  const segments = path.split('/');

  for (let i = segments.length - 1; i >= 0; i--) {
    if (segments[i] === 'node_modules') {
      let name = segments[i + 1];

      if (name.startsWith('@') && i + 2 < segments.length) {
        name += '/' + segments[i + 2];
      }

      nodeModuleNameCache.set(path, name);
      return name;
    }
  }

  return null;
}
