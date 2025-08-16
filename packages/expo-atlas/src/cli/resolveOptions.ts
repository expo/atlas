// @ts-expect-error - Freeport async types missing
import freeport from 'freeport-async';
import path from 'path';

import { type Input } from './bin';
import { getAtlasPath, validateAtlasFile } from '../data/AtlasFileSource';

export type Options = Awaited<ReturnType<typeof resolveOptions>>;

export async function resolveOptions(input: Input) {
  const atlasFile = await resolveAtlasFile(input);
  const port = await resolvePort(input);
  return { atlasFile, port, browserOpen: input['--no-open'] !== true };
}

async function resolveAtlasFile(input: Input) {
  const atlasFile = input._[0] ?? getAtlasPath(process.cwd());
  await validateAtlasFile(atlasFile);
  return path.resolve(atlasFile);
}

async function resolvePort(input: Pick<Input, '--port'>) {
  if (input['--port']) return input['--port'];

  const port = await freeport(3000, { hostnames: [null, 'localhost'] });
  if (port) return port;

  throw new Error(`Could not find a free port starting from 3000`);
}
