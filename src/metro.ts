import { type MetroConfig } from 'metro-config';

import {
  createAtlasFile,
  ensureAtlasFileExist,
  getAtlasPath,
  writeAtlasEntry,
} from './data/AtlasFileSource';
import { convertGraph, convertMetroConfig } from './data/MetroGraphSource';

type ExpoAtlasOptions = Partial<{
  /** The output of the atlas file, defaults to `.expo/atlas.json` */
  atlasFile: string;
}>;

/**
 * Initialize Expo Atlas to gather statistics from Metro when exporting bundles.
 * This function adds the required Metro config, and should be the last config mutation.
 *
 * @example ```js
 *   // Learn more https://docs.expo.dev/guides/customizing-metro
 *   const { getDefaultConfig } = require('expo/metro-config')
 *   const { withExpoAtlas } = require('expo-atlas/metro')
 *
 *   const config = getDefaultConfig(__dirname)
 *
 *   // Make more changes
 *
 *   module.exports = withExpoAtlas(config)
 * ```
 */
export function withExpoAtlas(config: MetroConfig, options: ExpoAtlasOptions = {}) {
  const projectRoot = config.projectRoot;
  const originalSerializer = config.serializer?.customSerializer ?? (() => {});

  if (!projectRoot) {
    throw new Error('No "projectRoot" configured in Metro config.');
  }

  const atlasFile = options?.atlasFile ?? getAtlasPath(projectRoot);
  const metroConfig = convertMetroConfig(config);

  // Note(cedric): we don't have to await this, Metro would never bundle before this is finishes
  ensureAtlasFileExist(atlasFile);

  // @ts-expect-error
  config.serializer.customSerializer = (entryPoint, preModules, graph, serializeOptions) => {
    // Note(cedric): we don't have to await this, it has a built-in write queue
    writeAtlasEntry(
      atlasFile,
      convertGraph({ projectRoot, entryPoint, preModules, graph, serializeOptions, metroConfig })
    );

    return originalSerializer(entryPoint, preModules, graph, serializeOptions);
  };

  return config;
}

export async function resetExpoAtlasFile(projectRoot: string) {
  const filePath = getAtlasPath(projectRoot);
  await createAtlasFile(filePath);
  return filePath;
}
