/**
 * Keep this path in sync with `app.json`'s `baseUrl`.
 *
 * @see https://docs.expo.dev/versions/latest/config/app/#baseurl
 */
const baseUrl = '/_expo/atlas';

/**
 * Fetch data from the API routes, adding the `baseUrl` to all requests.
 */
export function fetchApi(path: string, options?: RequestInit) {
  if (path.startsWith(baseUrl)) {
    return fetch(path, options);
  }

  return fetch(path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`, options);
}
