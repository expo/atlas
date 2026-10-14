import connect from 'connect';
import http from 'node:http';

import type { Options } from './resolveOptions';
import { AtlasFileSource } from '../data/AtlasFileSource';
import { createAtlasMiddleware } from '../utils/middleware';

export function createServer(options: Options) {
  process.env.NODE_ENV = 'production';

  const source = new AtlasFileSource(options.atlasFile);
  const middleware = createAtlasMiddleware(source);
  const baseUrl = '/_expo/atlas'; // Keep in sync with webui `app.json` `baseUrl`

  const app = connect();

  app.use(baseUrl, middleware);
  app.use((req, res, next) => {
    if (req.url?.startsWith(baseUrl)) {
      return next();
    }

    res.writeHead(302, { Location: baseUrl });
    res.end();
  });

  return http.createServer(app);
}
