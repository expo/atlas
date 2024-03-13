import assert from 'assert';

import type { PartialStatsEntry, StatsEntry, StatsSource } from './types';
import { appendNDJsonToFile, mapNDJson, parseNDJsonAtLine } from '../utils/ndjson';

export class StatsFileSource implements StatsSource {
  constructor(public readonly statsPath: string) {
    //
  }

  listEntries() {
    return listStatsEntries(this.statsPath);
  }

  getEntry(id: string) {
    const numeric = parseInt(id, 10);
    assert(!Number.isNaN(numeric) && numeric > 1, `Invalid stats entry ID: ${id}`);
    return readStatsEntry(this.statsPath, Number(id));
  }
}

/**
 * List all stats entries without parsing the data.
 * This only reads the bundle name, and adds a line number as ID.
 */
export async function listStatsEntries(statsPath: string) {
  const bundlePattern = /^\["([^"]+)","([^"]+)","([^"]+)/;
  const entries: PartialStatsEntry[] = [];

  await mapNDJson(statsPath, (index, line) => {
    // Skip the stats metadata line
    if (index === 1) return;

    const [_, platform, projectRoot, entryPoint] = line.match(bundlePattern) ?? [];
    if (platform && projectRoot && entryPoint) {
      entries.push({
        id: String(index),
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
export async function readStatsEntry(statsPath: string, id: number): Promise<StatsEntry> {
  const statsEntry = await parseNDJsonAtLine<any[]>(statsPath, id);
  return {
    id: String(id),
    platform: statsEntry[0],
    projectRoot: statsEntry[1],
    entryPoint: statsEntry[2],
    runtimeModules: statsEntry[3],
    modules: new Map(statsEntry[4]),
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
export function writeStatsEntry(statsPath: string, stats: StatsEntry) {
  const entry = [
    stats.platform,
    stats.projectRoot,
    stats.entryPoint,
    stats.runtimeModules,
    stats.modules,
    stats.transformOptions,
    stats.serializeOptions,
  ];

  return (writeStatsQueue = writeStatsQueue.then(() => appendNDJsonToFile(statsPath, entry)));
}
