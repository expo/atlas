import { convertPathToPosix } from './paths';

/** Pattern to match the last `node_modules/@<org>/<name>` or `node_modules/<name>` occurrence in a string */
const NODE_MODULES_NAME_PATTERN = /(?:.*\/)?node_modules\/((?:@[^/]+\/[^/]+)|[^/]+)/i;
/** A simple map to return previously resolved package names from paths */
const packageNameCache = new Map<string, string>();

/** Get the package name from absolute path, if the file belongs to a package. */
export function getPackageNameFromPath(path: string) {
  const posixPath = convertPathToPosix(path);
  const packageName = packageNameCache.get(posixPath);
  if (packageName) return packageName;

  const [_match, name] = posixPath.match(NODE_MODULES_NAME_PATTERN) ?? [];
  if (name) {
    packageNameCache.set(posixPath, name);
    return name;
  }

  return undefined;
}
