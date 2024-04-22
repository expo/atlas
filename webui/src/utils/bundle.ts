import { PartialAtlasBundle } from '~core/data/types';

/**
 * Translate an absolute path to a relative path, based on the bundle's project root.
 * This is a simple replace operation.
 */
export function relativeBundlePath(
  bundle: Pick<PartialAtlasBundle, 'projectRoot' | 'sharedRoot'>,
  path: string
) {
  return path.replace(rootBundlePath(bundle) + '/', '');
}

/**
 * Get the "shared root" of all paths within the bundle.
 * This is calculated by comparing `projectRoot` and `watchFolders`.
 */
export function rootBundlePath(bundle: Pick<PartialAtlasBundle, 'projectRoot' | 'sharedRoot'>) {
  return bundle.sharedRoot || bundle.projectRoot;
}
