import { type MetroConfig } from 'metro-config';

import { convertGraph } from './data/MetroGraphSource';
import { writeStatsEntry } from './data/StatsFileSource';
import { createStatsFile, getStatsPath } from './utils/stats';

type ExpoAtlasOptions = Partial<{
  /** The output of the stats file, defaults to `.expo/stats.json` */
  statsFile: string;
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

  const statsFile = options?.statsFile ?? getStatsPath(projectRoot);
  const extensions = {
    source: config.resolver?.sourceExts,
    asset: config.resolver?.assetExts,
  };

  // Note(cedric): we don't have to await this, Metro would never bundle before this is finisheds
  createStatsFile(statsFile);

  // @ts-expect-error
  config.serializer.customSerializer = (entryPoint, preModules, graph, options) => {
    // Note(cedric): we don't have to await this, it has a built-in write queue
    writeStatsEntry(
      statsFile,
      convertGraph({ projectRoot, entryPoint, preModules, graph, options, extensions })
    );

    return originalSerializer(entryPoint, preModules, graph, options);
  };

  return config;
}
