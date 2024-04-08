import assert from 'assert';
import fs from 'fs';
import path from 'path';

import type { PartialAtlasEntry, AtlasEntry, AtlasSource } from './types';
import { name, version } from '../../package.json';
import { env } from '../utils/env';
import { AtlasValidationError } from '../utils/errors';
import { appendJsonLine, forEachJsonLines, parseJsonLine } from '../utils/jsonl';

export type AtlasMetadata = { name: string; version: string };

export class AtlasFileSource implements AtlasSource {
  constructor(public readonly filePath: string) {
    //
  }

  listEntries() {
    return listAtlasEntries(this.filePath);
  }

  getEntry(id: string) {
    const numeric = parseInt(id, 10);
    assert(!Number.isNaN(numeric) && numeric > 1, `Invalid entry ID: ${id}`);
    return readAtlasEntry(this.filePath, Number(id));
  }

  entryDeltaEnabled() {
    return false; // File source does not implement the delta mechanism
  }

  getEntryDelta() {
    return null; // File source does not implement the delta mechanism
  }
}

/**
 * List all entries without parsing the data.
 * This only reads the bundle name, and adds a line number as ID.
 */
export async function listAtlasEntries(filePath: string) {
  const bundlePattern = /^\["([^"]+)","([^"]+)","([^"]+)/;
  const entries: PartialAtlasEntry[] = [];

  await forEachJsonLines(filePath, (contents, line) => {
    // Skip the metadata line
    if (line === 1) return;

    const [_, platform, projectRoot, entryPoint] = contents.match(bundlePattern) ?? [];
    if (platform && projectRoot && entryPoint) {
      entries.push({
        id: String(line),
        platform: platform as any,
        projectRoot,
        entryPoint,
      });
    }
  });

  return entries;
}

/**
 * Get the entry by id or line number, and parse the data.
 */
export async function readAtlasEntry(filePath: string, id: number): Promise<AtlasEntry> {
  const atlasEntry = await parseJsonLine<any[]>(filePath, id);
  return {
    id: String(id),
    platform: atlasEntry[0],
    projectRoot: atlasEntry[1],
    entryPoint: atlasEntry[2],
    runtimeModules: atlasEntry[3],
    modules: new Map(atlasEntry[4].map((module) => [module.path, module])),
    transformOptions: atlasEntry[5],
    serializeOptions: atlasEntry[6],
  };
}

/** Simple promise to avoid mixing appended data */
let writeQueue: Promise<any> = Promise.resolve();

/**
 * Add a new entry to the file.
 * This is appended on a new line, so we can load the selectively.
 */
export function writeAtlasEntry(filePath: string, entry: AtlasEntry) {
  const line = [
    entry.platform,
    entry.projectRoot,
    entry.entryPoint,
    entry.runtimeModules,
    Array.from(entry.modules.values()),
    entry.transformOptions,
    entry.serializeOptions,
  ];

  return (writeQueue = writeQueue.then(() => appendJsonLine(filePath, line)));
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
