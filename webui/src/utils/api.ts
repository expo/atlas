/**
 * Keep this path in sync with `app.json`'s `baseUrl`.
 * The base url is disabled when running webui in development, as `baseUrl` is for export only.
 *
 * @see https://docs.expo.dev/versions/latest/config/app/#baseurl
 */
const baseUrl = __DEV__ ? '/--' : '/_expo/atlas/--';

/**
 * Fetch data from the API routes, adding the `baseUrl` to all requests.
 */
export function fetchApi(path: string, options?: RequestInit) {
  if (path.startsWith(baseUrl)) {
    return fetch(path, options);
  }

  return fetch(path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`, options);
}

/**
 * Attempt to handle possible API errors, by returning:
 *   - the response for ok status codes
 *   - null for `404` status codes
 *   - throws response on other status codes
 */
export function handleApiError(response: Response) {
  if (response.ok) return response;
  if (response.status === 404) return null;
  throw response;
}
