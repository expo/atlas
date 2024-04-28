import assert from 'assert';
import fs from 'fs';
import path from 'path';

import type { PartialAtlasBundle, AtlasBundle, AtlasSource } from './types';
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

  bundleDeltaEnabled() {
    return false; // File source does not implement the delta mechanism
  }

  getBundleDelta() {
    return null; // File source does not implement the delta mechanism
  }
}

/**
 * List all entries without parsing the data.
 * This only reads the bundle name, and adds a line number as ID.
 */
export async function listAtlasEntries(filePath: string) {
  const bundlePattern = /^\["([^"]+)","([^"]+)","([^"]+)","([^"]+)"/;
  const entries: PartialAtlasBundle[] = [];

  await forEachJsonLines(filePath, (contents, line) => {
    // Skip the metadata line
    if (line === 1) return;

    const [_, platform, projectRoot, sharedRoot, entryPoint] = contents.match(bundlePattern) ?? [];
    if (platform && projectRoot && sharedRoot && entryPoint) {
      entries.push({
        id: String(line),
        platform: platform as any,
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
 */
export async function readAtlasEntry(filePath: string, id: number): Promise<AtlasBundle> {
  const atlasEntry = await parseJsonLine<any[]>(filePath, id);
  return {
    id: String(id),
    platform: atlasEntry[0],
    projectRoot: atlasEntry[1],
    sharedRoot: atlasEntry[2],
    entryPoint: atlasEntry[3],
    runtimeModules: atlasEntry[4],
    modules: new Map(atlasEntry[5].map((module) => [module.path, module])),
    transformOptions: atlasEntry[6],
    serializeOptions: atlasEntry[7],
  };
}

/** Simple promise to avoid mixing appended data */
let writeQueue: Promise<any> = Promise.resolve();

/**
 * Add a new entry to the Atlas file.
 * This function also ensures the Atlas file is ready to be written to, due to complications with Expo CLI.
 * Eventually, the entry is appended on a new line, so we can load them selectively.
 */
export function writeAtlasEntry(filePath: string, entry: AtlasBundle) {
  const line = [
    entry.platform,
    entry.projectRoot,
    entry.sharedRoot,
    entry.entryPoint,
    entry.runtimeModules,
    Array.from(entry.modules.values()),
    entry.transformOptions,
    entry.serializeOptions,
  ];

  writeQueue = writeQueue
    .then(() => prepareAtlasFileForBundle(filePath, entry))
    .then(() => appendJsonLine(filePath, line));

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
 * Create the Atlas file, if it does not exist yet.
 */
export async function ensureAtlasFileExist(filePath: string) {
  if (!fs.existsSync(filePath)) {
    await createAtlasFile(filePath);
  }
}

/**
 * This checks if we can reuse the existing Atlas file, or if it needs to be recreated.
 * Expo creates multiple instances of Metro when exporting static bundles, so we need to handle this properly.
 * The logic to recreate or reuse the Atlas file is based on:
 *   - Does an Atlas file currently exist?
 *     > No: (Re)create
 *   - Is the Atlas file compatible with the current library version?
 *     > No: Recreate
 *   - Is this entry a native platform bundle (android|ios), and does the Atlas file contain that platform?
 *     > Yes: Recreate
 *   - Otherwise, reuse the Atlas file.
 */
async function prepareAtlasFileForBundle(filePath: string, entry: AtlasBundle) {
  try {
    // Recreate the file when versions are incompatible
    await validateAtlasFile(filePath);
  } catch (error: any) {
    if (error.code === 'ATLAS_FILE_NOT_FOUND' || error.code === 'ATLAS_FILE_INCOMPATIBLE') {
      await createAtlasFile(filePath);
      return false;
    }

    throw error;
  }

  // Recreate the file if one of the native platforms already exists in the Atlas file
  if (entry.platform === 'android' || entry.platform === 'ios') {
    const entries = await listAtlasEntries(filePath);
    if (entries.some((existing) => existing.platform === entry.platform)) {
      await createAtlasFile(filePath);
      return false;
    }
  }

  // Reuse the file, do not recreate it
  return true;
}
