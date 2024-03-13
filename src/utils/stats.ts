import fs from 'fs';
import path from 'path';

import { name, version } from '../../package.json';
import { env } from '../utils/env';
import { AtlasValidationError } from '../utils/errors';
import { parseNDJsonAtLine } from '../utils/ndjson';

export type StatsMetadata = { name: string; version: string };

/** The default location of the metro stats file */
export function getStatsPath(projectRoot: string) {
  return path.join(projectRoot, '.expo/stats.json');
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

  if (env.EXPO_NO_STATS_VALIDATION) {
    return;
  }

  const data = await parseNDJsonAtLine(statsFile, 1);

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
      await validateStatsFile(filePath);
    } catch {
      await fs.promises.writeFile(filePath, JSON.stringify(getStatsMetdata()) + '\n');
    }

    return;
  }

  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(getStatsMetdata()) + '\n');
}
