import { PartialAtlasEntry } from '~core/data/types';

/**
 * Translate an absolute path to a relative path, based on the entry's project root.
 * This is a simple replace operation.
 */
export function relativeBundlePath(
  entry: Pick<PartialAtlasEntry, 'projectRoot' | 'sharedRoot'>,
  path: string
) {
  return path.replace(rootBundlePath(entry) + '/', '');
}

/**
 * Get the "shared root" of all paths within the entry.
 * This is calculated by comparing `projectRoot` and `watchFolders`.
 */
export function rootBundlePath(entry: Pick<PartialAtlasEntry, 'projectRoot' | 'sharedRoot'>) {
  return entry.sharedRoot || entry.projectRoot;
}
