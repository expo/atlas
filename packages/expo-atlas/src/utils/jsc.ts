/**
 * Return correctly formatted URLs from JSC safe URLs.
 *  - input http://127.0.0.1:8081/index.bundle//&platform=ios&dev=true&minify=false
 *  - output: http://127.0.0.1:8081/index.bundle?platform=ios&dev=true&minify=false
 */
export function getUrlFromJscSafeUrl(jscSafeUrl: string) {
  return jscSafeUrl.replace('//&', '?');
}
