import { PartialAtlasEntry } from '~core/data/types';

/**
 * Translate an absolute path to a relative path, based on the entry's project root.
 * This is a simple replace operation.
 */
export function relativeBundlePath(
  entry: Pick<PartialAtlasEntry, 'projectRoot' | 'serverRoot'>,
  path: string
) {
  return path.replace((entry.serverRoot || entry.projectRoot) + '/', '');
}
