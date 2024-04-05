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
  constructor(public readonly statsPath: string) {
    //
  }

  listEntries() {
    return listAtlasEntries(this.statsPath);
  }

  getEntry(id: string) {
    const numeric = parseInt(id, 10);
    assert(!Number.isNaN(numeric) && numeric > 1, `Invalid entry ID: ${id}`);
    return readAtlasEntry(this.statsPath, Number(id));
  }
}

/**
 * List all stats entries without parsing the data.
 * This only reads the bundle name, and adds a line number as ID.
 */
export async function listAtlasEntries(statsPath: string) {
  const bundlePattern = /^\["([^"]+)","([^"]+)","([^"]+)/;
  const entries: PartialAtlasEntry[] = [];

  await forEachJsonLines(statsPath, (contents, line) => {
    // Skip the stats metadata line
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
 * Get the stats entry by id or line number, and parse the data.
 */
export async function readAtlasEntry(statsPath: string, id: number): Promise<AtlasEntry> {
  const statsEntry = await parseJsonLine<any[]>(statsPath, id);
  return {
    id: String(id),
    platform: statsEntry[0],
    projectRoot: statsEntry[1],
    entryPoint: statsEntry[2],
    runtimeModules: statsEntry[3],
    modules: new Map(statsEntry[4].map((module) => [module.path, module])),
    transformOptions: statsEntry[5],
    serializeOptions: statsEntry[6],
  };
}

/** Simple promise to avoid mixing appended data */
let writeStatsQueue: Promise<any> = Promise.resolve();

/**
 * Add a new stats entry to the stats file.
 * This is appended on a new line, so we can load the stats selectively.
 */
export function writeAtlasEntry(statsPath: string, stats: AtlasEntry) {
  const entry = [
    stats.platform,
    stats.projectRoot,
    stats.entryPoint,
    stats.runtimeModules,
    Array.from(stats.modules.values()),
    stats.transformOptions,
    stats.serializeOptions,
  ];

  return (writeStatsQueue = writeStatsQueue.then(() => appendJsonLine(statsPath, entry)));
}

/** The default location of the metro stats file */
export function getAtlasPath(projectRoot: string) {
  return path.join(projectRoot, '.expo/atlas.jsonl');
}

/** The information to validate if a stats file is compatible with this library version */
export function getAtlasMetdata(): AtlasMetadata {
  return { name, version };
}

/** Validate if the stats file is compatible with this library version */
export async function validateAtlasFile(statsFile: string, metadata = getAtlasMetdata()) {
  if (!fs.existsSync(statsFile)) {
    throw new AtlasValidationError('STATS_FILE_NOT_FOUND', statsFile);
  }

  if (env.EXPO_ATLAS_NO_STATS_VALIDATION) {
    return;
  }

  const data = await parseJsonLine(statsFile, 1);

  if (data.name !== metadata.name || data.version !== metadata.version) {
    throw new AtlasValidationError('STATS_FILE_INCOMPATIBLE', statsFile, data.version);
  }
}

/**
 * Create or overwrite the stats file with basic metadata.
 * This metdata is used by the API to determine version compatibility.
 */
export async function createAtlasFile(filePath: string) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.rm(filePath, { force: true });
  await appendJsonLine(filePath, getAtlasMetdata());
}
