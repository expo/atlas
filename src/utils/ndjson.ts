import events from 'events';
import fs from 'fs';
import readline from 'readline';
import stream from 'stream';
import { stringer } from 'stream-json/Stringer';
import { disassembler } from 'stream-json/Disassembler';

/**
 * Iterate through lines of a ndjson/jsonl file using streams.
 * This won't parse the actual JSON but invokes the callback for each line.
 *
 * @note Line numbers starts at `1`
 */
export async function forEachJsonLines(
  filePath: string,
  callback: (lineContent: string, lineNumber: number, reader: readline.Interface) => any
) {
  const input = fs.createReadStream(filePath);
  const reader = readline.createInterface({ input });
  let lineNumber = 1;

  reader.on('error', (error) => {
    throw error;
  });

  reader.on('line', (contents) => {
    callback(contents, lineNumber++, reader);
  });

  await events.once(reader, 'close');
}

/**
 * Parse a single line of a jsonl/ndjson file using streams.
 * Once the line is found, iteration is stopped and the parsed JSON is returned.
 *
 * @note Line numbers starts at `1`
 */
export async function parseJsonLine<T = any>(filePath: string, lineNumber: number): Promise<T> {
  let lineContent = '';

  await forEachJsonLines(filePath, (content, line, reader) => {
    if (line === lineNumber) {
      lineContent = content;
      reader.close();
    }
  });

  if (!lineContent) {
    throw new Error(`Line ${lineNumber} not found in file: ${filePath}`);
  }

  return JSON.parse(lineContent);
}

/** Append a single line of json data to a jsonl/ndjson file using streams. */
export async function appendJsonLine(filePath: string, data: unknown): Promise<void> {
  const input = stream.Readable.from([data] as any, { objectMode: true });
  const output = fs.createWriteStream(filePath, { flags: 'a' });

  input.pipe(disassembler()).pipe(stringer()).pipe(output);

  await events.once(output, 'finish');
  await fs.promises.appendFile(filePath, '\n', 'utf-8');
}
