import compression from 'compression';
import express from 'express';

import { type Options } from './resolveOptions';
import { StatsFileSource } from '../data/StatsFileSource';
import { createAtlasMiddleware } from '../utils/middleware';

export function createServer(options: Options) {
  process.env.NODE_ENV = 'production';

  const app = express();
  const source = new StatsFileSource(options.statsFile);
  const middleware = createAtlasMiddleware(source);

  // http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
  app.disable('x-powered-by');

  app.use(compression());
  app.use('/_expo/atlas', middleware);

  return app;
}
