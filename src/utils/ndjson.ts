import events from 'events';
import fs from 'fs';
import readline from 'readline';

// @ts-expect-error
Symbol.dispose ??= Symbol('Symbol.dispose');
// @ts-expect-error
Symbol.asyncDispose ??= Symbol('Symbol.asyncDispose');

/** Create a self-disposing stream using explicit resource management */
function disposableStream<T extends fs.ReadStream | fs.WriteStream>(stream: T): T & Disposable {
  const disposableStream = stream as T & Disposable;
  disposableStream[Symbol.dispose] = () => {
    if (!stream.closed) stream.close();
  };
  return disposableStream;
}

/**
 * Efficiently map through all lines within the Newline-Delimited JSON (ndjson) file, using streams.
 * This won't parse the actual JSON but returns the partial string instead.
 * Note, line numbers starts at `1`.
 */
export async function mapNDJson(
  filePath: string,
  callback: (line: number, contents: string) => any
) {
  using stream = disposableStream(fs.createReadStream(filePath));
  const reader = readline.createInterface({ input: stream });
  let lineNumber = 1;

  reader.on('error', (error) => {
    throw error;
  });

  reader.on('line', (contents) => {
    callback(lineNumber++, contents);
  });

  await events.once(reader, 'close');
}

/**
 * Efficiently parse a single line from a Newline-Delimited JSON (ndjson) file, using streams.
 * Note, line numbers starts at `1`.
 */
export async function parseNDJsonAtLine<T = any>(filePath: string, line: number): Promise<T> {
  // Note(cedric): keep this dependency inlined to avoid loading it in the WebUI
  const bfj = require('bfj');
  let lineCursor = 0;

  using stream = disposableStream(fs.createReadStream(filePath));
  const reader = readline.createInterface({ input: stream });

  await new Promise((resolve, reject) => {
    stream.once('error', reject);
    reader.once('error', reject);

    reader.on('line', () => {
      if (++lineCursor === line) {
        reader.close();
        resolve(undefined);
      }
    });

    reader.once('close', () => {
      if (lineCursor !== line) {
        reject(new Error(`Line "${line}" not found in file "${filePath}"`));
      }
    });
  });

  return await bfj.parse(stream, { ndjson: true });
}

/** Efficiently append a new line to a Newline-Delimited JSON (ndjson) file, using streams. */
export async function appendNDJsonToFile(filePath: string, data: unknown): Promise<void> {
  // Note(cedric): keep this dependency inlined to avoid loading it in the WebUI
  const bfj = require('bfj');
  await bfj.write(filePath, data, {
    // Force stream to append to file
    flags: 'a',
    // Ignore all complex data types, which shouldn't exist in the data
    buffers: 'ignore',
    circular: 'ignore',
    iterables: 'ignore',
    promises: 'ignore',
    // Only enable maps, as the graph dependencies are stored as a map
    maps: 'object',
  });

  await fs.promises.appendFile(filePath, '\n', 'utf-8');
}
