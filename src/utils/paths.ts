/**
 * Find the shared root of all paths.
 * This will split all paths by segments and find the longest common prefix.
 */
export function findSharedRoot(paths: string[]) {
  if (!paths.length) {
    return null;
  }

  let sharedRoot: string[] = [];

  for (const item of paths) {
    const segments = item.split('/');

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

  return sharedRoot.join('/');
}
