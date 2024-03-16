import events from 'events';
import fs from 'fs';
import readline from 'readline';

/**
 * Efficiently map through all lines within the Newline-Delimited JSON (ndjson) file, using streams.
 * This won't parse the actual JSON but returns the partial string instead.
 * Note, line numbers starts at `1`.
 */
export async function mapJsonLines(
  filePath: string,
  callback: (contents: string, line: number) => any
) {
  const stream = fs.createReadStream(filePath);
  const reader = readline.createInterface({ input: stream });
  let lineNumber = 1;

  reader.on('error', (error) => {
    throw error;
  });

  reader.on('line', (contents) => {
    callback(contents, lineNumber++);
  });

  await events.once(reader, 'close');
  stream.close();
}

/**
 * Efficiently parse a single line from a Newline-Delimited JSON (ndjson) file, using streams.
 * Note, line numbers starts at `1`.
 */
export async function parseJsonLine<T = any>(filePath: string, line: number): Promise<T> {
  const stream = fs.createReadStream(filePath);
  const reader = readline.createInterface({ input: stream });

  let lineContents;
  let lineNumber = 1;

  reader.on('error', (error) => {
    throw error;
  });

  reader.on('line', (contents) => {
    if (lineNumber++ === line) {
      lineContents = contents;
      reader.close();
    }
  });

  await events.once(reader, 'close');
  stream.close();

  if (!lineContents) {
    throw new Error(`Line ${line} not found in file: ${filePath}`);
  }

  return JSON.parse(lineContents);
}

/** Efficiently append a new line to a Newline-Delimited JSON (ndjson) file, using streams. */
export async function appendJsonLine(filePath: string, data: unknown): Promise<void> {
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
