import type { ConfigT as MetroConfig } from 'metro-config';

import { MetroGraphSource } from './data/MetroGraphSource';
import { createAtlasMiddleware } from './utils/middleware';

/**
 * Iniitalize Expo Atlas to gather statistics from Metro when exporting bundles.
 * This function adds the required Metro config, and should be used inside the Expo CLI.
 *
 * @example ```js
 *   const atlasFromProject = requireFrom(projectRoot, 'expo-atlas/cli');
 *   const atlas = atlasFromProject?.createExpoAtlasMiddleware(config);
 *
 *   if (atlas) {
 *     // Register the Atlas middleware, to serve the UI and API.
 *     middleware.use('/_expo/atlas', atlasFromProject.middleware);
 *
 *     // Register Metro to listen to changes
 *     atlas.registerMetro(metro);
 *   }
 * ```
 */
export function createExpoAtlasMiddleware(config: MetroConfig) {
  const projectRoot = config.projectRoot;

  const source = new MetroGraphSource();
  const middleware = createAtlasMiddleware(source);
  const registerMetro = source.registerMetro.bind(source);

  const metroCustomSerializer = config.serializer?.customSerializer ?? (() => {});
  const metroExtensions = {
    source: config.resolver?.sourceExts,
    asset: config.resolver?.assetExts,
  };

  // @ts-expect-error Should still be writable at this stage
  config.serializer.customSerializer = (entryPoint, preModules, graph, options) => {
    source.serializeGraph({
      projectRoot,
      entryPoint,
      preModules,
      graph,
      options,
      extensions: metroExtensions,
      watchFolders: config.watchFolders,
    });

    return metroCustomSerializer(entryPoint, preModules, graph, options);
  };

  return { source, middleware, registerMetro };
}
