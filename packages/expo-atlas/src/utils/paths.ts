import path from 'path';

/** Format the path in posix format. */
export function convertPathToPosix(path: string) {
  return path.includes('\\') ? path.replace(/\\/g, '/') : path;
}

/**
 * Find the shared root of all provided paths.
 * This will split all paths by segments and find the longest common prefix.
 * Note, this works for both posix and non-posix paths.
 */
export function findSharedRoot(paths: string[]) {
  if (!paths.length) {
    return null;
  }

  let sharedRoot: string[] = [];

  for (const item of paths) {
    const segments = item.split(path.sep);

    if (!sharedRoot.length) {
      sharedRoot = segments;
      continue;
    }

    for (let i = 0; i < sharedRoot.length; i++) {
      if (sharedRoot[i] !== segments[i]) {
        sharedRoot = sharedRoot.slice(0, i);
        break;
      }
    }
  }

  return sharedRoot.join(path.sep);
}
