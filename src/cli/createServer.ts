import { createRequestHandler } from '@expo/server/adapter/express';
import compression from 'compression';
import express from 'express';
import morgan from 'morgan';

import { type Options } from './resolveOptions';
import { StatsFileSource } from '../data/StatsFileSource';
import { env } from '../utils/env';
import { CLIENT_BUILD_DIR, SERVER_BUILD_DIR } from '../utils/middleware';

export function createServer(options: Options) {
  global.EXPO_ATLAS_SOURCE = new StatsFileSource(options.statsFile);
  process.env.NODE_ENV = 'production';

  const app = express();

  // http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
  app.disable('x-powered-by');

  app.use(compression());

  if (env.EXPO_ATLAS_DEBUG) {
    app.use(morgan('tiny'));
  }

  // TODO(cedric): replace with middleware once we can
  app.use(
    express.static(CLIENT_BUILD_DIR, {
      maxAge: '1h',
      extensions: ['html'],
    })
  );

  // TODO(cedric): replace with middleware once we can
  app.all('*', createRequestHandler({ build: SERVER_BUILD_DIR }));

  return app;
}
