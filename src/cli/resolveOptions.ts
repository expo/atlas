import freeport from 'freeport-async';
import path from 'path';

import { type Input } from './bin';
import { getStatsPath, validateStatsFile } from '../utils/stats';

export type Options = Awaited<ReturnType<typeof resolveOptions>>;

export async function resolveOptions(input: Input) {
  const statsFile = await resolveStatsFile(input);
  const port = await resolvePort(input);
  return { statsFile, port, browserOpen: input['--no-open'] !== true };
}

async function resolveStatsFile(input: Input) {
  const statsFile = input._[0] ?? getStatsPath(process.cwd());
  await validateStatsFile(statsFile);
  return path.resolve(statsFile);
}

async function resolvePort(input: Pick<Input, '--port'>) {
  if (input['--port']) return input['--port'];

  const port = await freeport(3000, { hostnames: [null, 'localhost'] });
  if (port) return port;

  throw new Error(`Could not find a free port starting from 3000`);
}
