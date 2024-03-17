import fs from 'fs';
import path from 'path';

import { appendJsonLine, parseJsonLine } from './jsonl';
import { name, version } from '../../package.json';
import { env } from '../utils/env';
import { AtlasValidationError } from '../utils/errors';

export type StatsMetadata = { name: string; version: string };

/** The default location of the metro stats file */
export function getStatsPath(projectRoot: string) {
  return path.join(projectRoot, '.expo/stats.jsonl');
}

/** The information to validate if a stats file is compatible with this library version */
export function getStatsMetdata(): StatsMetadata {
  return { name, version };
}

/** Validate if the stats file is compatible with this library version */
export async function validateStatsFile(statsFile: string, metadata = getStatsMetdata()) {
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
export async function createStatsFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    try {
      return await validateStatsFile(filePath);
    } catch {
      await fs.promises.writeFile(filePath, '');
    }
  }

  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await appendJsonLine(filePath, getStatsMetdata());
}
