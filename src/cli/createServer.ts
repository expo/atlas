import compression from 'compression';
import express from 'express';

import { type Options } from './resolveOptions';
import { StatsFileSource } from '../data/StatsFileSource';
import { createAtlasMiddleware } from '../utils/middleware';

export function createServer(options: Options) {
  process.env.NODE_ENV = 'production';

  const source = new StatsFileSource(options.statsFile);
  const middleware = createAtlasMiddleware(source);
  const baseUrl = '/_expo/atlas'; // Keep in sync with webui `app.json` `baseUrl`

  const app = express();

  app.disable('x-powered-by'); // http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
  app.use(compression());
  app.use(baseUrl, middleware);

  // Add catch-all to redirect to the webui
  app.use((req, res, next) => (!req.url.startsWith(baseUrl) ? res.redirect(baseUrl) : next()));

  return app;
}
