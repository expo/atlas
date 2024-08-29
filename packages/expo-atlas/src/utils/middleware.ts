import { createRequestHandler } from '@expo/server/build/vendor/http';
import connect from 'connect';
import morgan from 'morgan';
import path from 'path';
import serveStaticHandler from 'serve-static';

import { env } from './env';
import { type AtlasSource } from '../data/types';

const WEBUI_ROOT = path.resolve(__dirname, '../../../webui');

const CLIENT_BUILD_DIR = path.join(WEBUI_ROOT, 'dist/client');
const SERVER_BUILD_DIR = path.join(WEBUI_ROOT, 'dist/server');

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
    serveStaticHandler(CLIENT_BUILD_DIR, {
      maxAge: '1h',
      extensions: ['html'],
    })
  );

  middleware.use(
    createRequestHandler({
      build: SERVER_BUILD_DIR,
    })
  );

  return middleware;
}
