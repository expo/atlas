/**
 * Keep this path in sync with `app.json`'s `baseUrl`.
 * The base url is disabled when running webui in development, as `baseUrl` is for export only.
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
