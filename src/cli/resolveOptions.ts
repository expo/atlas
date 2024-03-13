import path from 'path';

import { type Input } from './bin';
import { getFreePort } from '../utils/port';
import { getStatsPath, validateStatsFile } from '../utils/stats';

export type Options = Awaited<ReturnType<typeof resolveOptions>>;

export async function resolveOptions(input: Input) {
  const [statsFile, port] = await Promise.all([resolveStatsFile(input), resolvePort(input)]);

  return { statsFile, port };
}

async function resolveStatsFile(input: Input) {
  const statsFile = input._[0] ?? getStatsPath(process.cwd());
  await validateStatsFile(statsFile);
  return path.resolve(statsFile);
}

async function resolvePort(input: Pick<Input, '--port'>) {
  return input['--port'] ?? (await getFreePort(3000));
}
