import assert from 'assert';
import fs from 'fs';
import path from 'path';

import type { PartialAtlasBundle, AtlasBundle, AtlasSource, AtlasModule } from './types';
import { name, version } from '../../package.json';
import { env } from '../utils/env';
import { AtlasValidationError } from '../utils/errors';
import { appendJsonLine, forEachJsonLines, parseJsonLine } from '../utils/jsonl';

export type AtlasMetadata = { name: string; version: string };

export class AtlasFileSource implements AtlasSource {
  constructor(public readonly filePath: string) {
    //
  }

  listBundles() {
    return listAtlasEntries(this.filePath);
  }

  getBundle(id: string) {
    const numeric = parseInt(id, 10);
    assert(!Number.isNaN(numeric) && numeric > 1, `Invalid entry ID: ${id}`);
    return readAtlasEntry(this.filePath, Number(id));
  }

  hasHmrSupport() {
    return false;
  }

  getBundleHmr() {
    return null;
  }
}

/**
 * List all entries without parsing the data.
 * This only reads the bundle name, and adds a line number as ID.
 *
 * @note Ensure the (de)serialization is in sync with both {@link readAtlasEntry} and {@link writeAtlasEntry}.
 */
export async function listAtlasEntries(filePath: string) {
  const bundlePattern = /^\["([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"/;
  const entries: PartialAtlasBundle[] = [];

  await forEachJsonLines(filePath, (contents, line) => {
    // Skip the metadata line
    if (line === 1) return;

    const [_, platform, projectRoot, sharedRoot, entryPoint, environment] =
      contents.match(bundlePattern) ?? [];
    if (platform && projectRoot && sharedRoot && entryPoint && environment) {
      entries.push({
        id: String(line),
        platform: platform as any,
        environment: environment as any,
        projectRoot,
        sharedRoot,
        entryPoint,
      });
    }
  });

  return entries;
}

/**
 * Get the entry by id or line number, and parse the data.
 *
 * @note Ensure the (de)serialization is in sync with both {@link listAtlasEntries} and {@link writeAtlasEntry}.
 */
export async function readAtlasEntry(filePath: string, id: number): Promise<AtlasBundle> {
  const atlasEntry = await parseJsonLine<any[]>(filePath, id);
  return {
    id: String(id),
    // These values are all strings
    platform: atlasEntry[0],
    projectRoot: atlasEntry[1],
    sharedRoot: atlasEntry[2],
    entryPoint: atlasEntry[3],
    environment: atlasEntry[4],
    // These values are more complex
    runtimeModules: atlasEntry[5],
    modules: new Map(atlasEntry[6].map((module: AtlasModule) => [module.absolutePath, module])),
    transformOptions: atlasEntry[7],
    serializeOptions: atlasEntry[8],
  };
}

/** Simple promise to avoid mixing appended data */
let writeQueue: Promise<any> = Promise.resolve();

/**
 * Wait until the Atlas file has all data written.
 * Note, this is a workaround whenever `process.exit` is required, avoid if possible.
 * @internal
 */
export function waitUntilAtlasFileReady() {
  return writeQueue;
}

/**
 * Add a new entry to the Atlas file.
 * This function also ensures the Atlas file is ready to be written to, due to complications with Expo CLI.
 * Eventually, the entry is appended on a new line, so we can load them selectively.
 *
 * @note Ensure the (de)serialization is in sync with both {@link listAtlasEntries} and {@link readAtlasEntry}.
 */
export function writeAtlasEntry(filePath: string, entry: AtlasBundle) {
  const line = [
    // These values must all be strings, and are available in PartialAtlasBundle type when listing bundles
    entry.platform,
    entry.projectRoot,
    entry.sharedRoot,
    entry.entryPoint,
    entry.environment,
    // These values can be more complex, but are not available in PartialAtlasBundle type when listing bundles
    entry.runtimeModules,
    Array.from(entry.modules.values()),
    entry.transformOptions,
    entry.serializeOptions,
  ];

  writeQueue = writeQueue.then(() => appendJsonLine(filePath, line));

  return writeQueue;
}

/** The default location of the metro file */
export function getAtlasPath(projectRoot: string) {
  return path.join(projectRoot, '.expo/atlas.jsonl');
}

/** The information to validate if a file is compatible with this library version */
export function getAtlasMetdata(): AtlasMetadata {
  return { name, version };
}

/** Validate if the file is compatible with this library version */
export async function validateAtlasFile(filePath: string, metadata = getAtlasMetdata()) {
  if (!fs.existsSync(filePath)) {
    throw new AtlasValidationError('ATLAS_FILE_NOT_FOUND', filePath);
  }

  if (env.EXPO_ATLAS_NO_VALIDATION) {
    return;
  }

  const data = await parseJsonLine(filePath, 1);

  if (data.name !== metadata.name || data.version !== metadata.version) {
    throw new AtlasValidationError('ATLAS_FILE_INCOMPATIBLE', filePath, data.version);
  }
}

/**
 * Create or overwrite the file with basic metadata.
 * This metdata is used by the API to determine version compatibility.
 */
export async function createAtlasFile(filePath: string) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.rm(filePath, { force: true });
  await appendJsonLine(filePath, getAtlasMetdata());
}

/**
 * Create the Atlas file if it doesn't exist, or recreate it if it's incompatible.
 */
export async function ensureAtlasFileExist(filePath: string) {
  try {
    await validateAtlasFile(filePath);
  } catch (error: any) {
    if (error.code === 'ATLAS_FILE_NOT_FOUND' || error.code === 'ATLAS_FILE_INCOMPATIBLE') {
      await createAtlasFile(filePath);
      return false;
    }

    throw error;
  }

  return true;
}
