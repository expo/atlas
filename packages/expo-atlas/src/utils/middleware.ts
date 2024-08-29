import connect from 'connect';
import { createRequestHandler } from 'expo-atlas-server/vendor/http';
import morgan from 'morgan';
import path from 'path';
import serveStaticHandler from 'serve-static';

import { env } from './env';
import { type AtlasSource } from '../data/types';

const ATLAS_UI_PATH = path.resolve(__dirname, '../../../build/atlas-ui');

/**
 * Initialize Expo Atlas to gather statistics from Metro during development.
 * This function creates a connect middleware to serve the webui and the Atlas API.
 * It's designed to use any `AtlasSource` implementation and passes it to the webui.
 *
 * @example ```js
 *   import { createAtlasMiddleware, MetroGraphSource } from 'expo-atlas/middleware';
 *
 *   const source = new MetroGraphSource();
 *   const middleware = createAtlasMiddleware(source);
 *
 *   source.onSerializeGraph(...);
 *   app.use('/_expo/atlas', middleware);
 * ```
 */
export function createAtlasMiddleware(source: AtlasSource) {
  global.EXPO_ATLAS_SOURCE = source;

  const middleware = connect();

  if (env.EXPO_DEBUG) {
    middleware.use(morgan('tiny'));
  }

  middleware.use(
    serveStaticHandler(path.join(ATLAS_UI_PATH, 'client'), {
      maxAge: '1h',
      extensions: ['html'],
    })
  );

  middleware.use(
    createRequestHandler({
      build: path.join(ATLAS_UI_PATH, 'server'),
    })
  );

  return middleware;
}
