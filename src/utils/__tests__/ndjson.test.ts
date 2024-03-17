import { describe, expect, it, mock } from 'bun:test';
import path from 'path';

import { forEachJsonLines, parseJsonLine } from '../ndjson';

function fixture(...filePath: string[]) {
  return path.join(__dirname, 'fixtures', ...filePath);
}

describe('forEachJsonLines', () => {
  it('iterates each line of file', async () => {
    const lines: string[] = [];
    await forEachJsonLines(fixture('ndjson.json'), (content) => {
      lines.push(content);
    });

    expect(lines).toEqual([
      expect.stringContaining('Gilbert'),
      expect.stringContaining('Alexa'),
      expect.stringContaining('May'),
      expect.stringContaining('Deloise'),
    ]);
  });

  it('iterates each line with line numbers starting from 1', async () => {
    const onReadLine = mock();
    await forEachJsonLines(fixture('ndjson.json'), onReadLine);

    // Callback is invoked with (content, line, reader) => ...
    expect(onReadLine).not.toHaveBeenCalledWith(expect.any(String), 0, expect.any(Object));
    expect(onReadLine).toHaveBeenCalledWith(expect.any(String), 1, expect.any(Object));
    expect(onReadLine).toHaveBeenCalledWith(expect.any(String), 2, expect.any(Object));
    expect(onReadLine).toHaveBeenCalledWith(expect.any(String), 3, expect.any(Object));
    expect(onReadLine).toHaveBeenCalledWith(expect.any(String), 4, expect.any(Object));
  });
});

describe('parseJsonLine', () => {
  it('parses a single line from file', async () => {
    expect(await parseJsonLine(fixture('ndjson.json'), 1)).toMatchObject({ name: 'Gilbert' });
    expect(await parseJsonLine(fixture('ndjson.json'), 2)).toMatchObject({ name: 'Alexa' });
    expect(await parseJsonLine(fixture('ndjson.json'), 3)).toMatchObject({ name: 'May' });
    expect(await parseJsonLine(fixture('ndjson.json'), 4)).toMatchObject({ name: 'Deloise' });
  });

  it('throws if single line is not found', async () => {
    await expect(parseJsonLine(fixture('ndjson.json'), 99999)).rejects.toThrow(
      'Line 99999 not found in file'
    );
  });

  it('parses a single line from file', async () => {
    expect(await parseJsonLine(fixture('stats-brent.json'), 1)).toBeObject();
  });

  it('parses a single line from file, with large data', async () => {
    expect(await parseJsonLine(fixture('stats-brent.json'), 2)).toBeArray();
  });
});
