import path from 'path';

import { type Input } from './bin';
import { getAtlasPath, validateAtlasFile } from '../data/AtlasFileSource';
import { findFreePort } from '../utils/ports';

export type Options = Awaited<ReturnType<typeof resolveOptions>>;

export async function resolveOptions(input: Input) {
  const atlasFile = await resolveAtlasFile(input);
  const port = await resolvePort(input);
  return { atlasFile, port, browserOpen: input.values['no-open'] !== true };
}

async function resolveAtlasFile(input: Input) {
  const atlasFile = input.positionals[0] ?? getAtlasPath(process.cwd());
  await validateAtlasFile(atlasFile);
  return path.resolve(atlasFile);
}

async function resolvePort(input: Input) {
  if (input.values.port) return input.values.port;

  const port = await findFreePort(3000, [null, 'localhost']);
  if (port) return port;

  throw new Error(`Could not find a free port starting from 3000`);
}
