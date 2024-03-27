import type { ConfigT as MetroConfig } from 'metro-config';

import { MetroGraphSource } from './data/MetroGraphSource';
import { createAtlasMiddleware } from './utils/middleware';

/**
 * Iniitalize Expo Atlas to gather statistics from Metro when exporting bundles.
 * This function adds the required Metro config, and should be used inside the Expo CLI.
 *
 * @example ```js
 *   const atlasFromProject = requireFrom(projectRoot, 'expo-atlas/cli');
 *
 *   if (atlasFromProject) {
 *     middleware.use('/_expo/atlas', atlasFromProject.middleware);
 *   }
 * ```
 */
export function createExpoAtlasMiddleware(config: MetroConfig) {
  const projectRoot = config.projectRoot;

  const source = new MetroGraphSource();
  const middleware = createAtlasMiddleware(source);

  const metroCustomSerializer = config.serializer?.customSerializer ?? (() => {});
  const metroExtensions = {
    source: config.resolver?.sourceExts,
    asset: config.resolver?.assetExts,
  };

  // @ts-expect-error Should still be writable at this stage
  config.serializer.customSerializer = (entryPoint, preModules, graph, options) => {
    source.onSerializeGraph({
      projectRoot,
      entryPoint,
      preModules,
      graph,
      options,
      extensions: metroExtensions,
    });

    return metroCustomSerializer(entryPoint, preModules, graph, options);
  };

  return { source, middleware };
}
