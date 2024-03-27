/**
 * Keep this path in sync with `app.json`'s `baseUrl`.
 * This is disabled when running in development mode, as the `baseUrl` is ignored.
 *
 * @see https://docs.expo.dev/versions/latest/config/app/#baseurl
 */
const baseUrl = __DEV__ ? '' : '/_expo/atlas';

/**
 * Fetch data from the API routes, adding the `baseUrl` to all requests.
 */
export function fetchApi(path: string, options?: RequestInit) {
  if (path.startsWith(baseUrl)) {
    return fetch(path, options);
  }

  return fetch(path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`, options);
}
