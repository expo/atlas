import http from 'node:http';
import { Writable } from 'node:stream';

/**
 * Create a readable stream from an incoming http request.
 * It's repurposed from `@whatwg-node/server`, and just type cast the request to a readable stream.
 *
 * @see https://github.com/ardatan/whatwg-node/blob/fae078caeff9ec65cdcb54826adb5bf0ff636065/packages/server/src/utils.ts#L263
 */
export function createReadableStreamFromReadable(req: http.IncomingMessage): RequestInit['body'] {
  return req as unknown as ReadableStream;
}

/**
 * Pipe the readable (web) stream to the outgoing http response.
 * This uses both `readable.pipeTo` and `Writable.toWeb` to convert and pipe the stream.
 *
 * @see https://github.com/ardatan/whatwg-node/blob/fae078caeff9ec65cdcb54826adb5bf0ff636065/packages/server/src/utils.ts#L239-L254
 */
export function writeReadableStreamToWritable(readable: ReadableStream, req: http.ServerResponse) {
  return readable.pipeTo(Writable.toWeb(req));
}
