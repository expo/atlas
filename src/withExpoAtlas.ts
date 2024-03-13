import { type MetroConfig } from 'metro-config';

import { convertGraph } from './data/MetroGraphSource';
import { writeStatsEntry } from './data/StatsFileSource';
import { createStatsFile, getStatsPath } from './utils/stats';

export type ExpoAtlasOptions = Partial<{
  /** The output of the stats file, defaults to `.expo/stats.json` */
  statsFile: string;
}>;

/**
 * Enable Expo Atlas to gather statistics from Metro when exporting bundles.
 * This function should be the last mutation of your Metro config.
 *
 * @example ```js
 *   // Learn more https://docs.expo.dev/guides/customizing-metro
 *   const { getDefaultConfig } = require('expo/metro-config');
 *   const { withExpoAtlas } = require('expo-atlas/metro');
 *
 *   const config = getDefaultConfig(__dirname);
 *
 *   // Make more changes
 *
 *   module.exports = withExpoAtlas(config);
 * ```
 */
export function withExpoAtlas(config: MetroConfig, options: ExpoAtlasOptions = {}) {
  const projectRoot = config.projectRoot;
  const originalSerializer = config.serializer?.customSerializer ?? (() => {});

  if (!projectRoot) {
    throw new Error('No "projectRoot" configured in Metro config.');
  }

  const statsFile = options?.statsFile ?? getStatsPath(projectRoot);

  // Note(cedric): we don't have to await this, Metro would never bundle before this is finisheds
  createStatsFile(statsFile);

  // @ts-expect-error
  config.serializer.customSerializer = (entryPoint, preModules, graph, options) => {
    // Note(cedric): we don't have to await this, it has a built-in write queue
    writeStatsEntry(
      statsFile,
      convertGraph({ projectRoot, entryPoint, preModules, graph, options })
    );

    return originalSerializer(entryPoint, preModules, graph, options);
  };

  return config;
}
