import { describe, expect, it, mock } from 'bun:test';
import fs from 'fs';
import path from 'path';

import { appendJsonLine, forEachJsonLines, parseJsonLine } from '../jsonl';

describe('forEachJsonLines', () => {
  it('iterates each line of file', async () => {
    const lines: string[] = [];
    await forEachJsonLines(fixture('specification'), (content) => {
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
    await forEachJsonLines(fixture('specification'), onReadLine);

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
    expect(await parseJsonLine(fixture('specification'), 1)).toMatchObject({ name: 'Gilbert' });
    expect(await parseJsonLine(fixture('specification'), 2)).toMatchObject({ name: 'Alexa' });
    expect(await parseJsonLine(fixture('specification'), 3)).toMatchObject({ name: 'May' });
    expect(await parseJsonLine(fixture('specification'), 4)).toMatchObject({ name: 'Deloise' });
  });

  it('throws if single line is not found', async () => {
    await expect(parseJsonLine(fixture('specification'), 99999)).rejects.toThrow(
      'Line 99999 not found in file'
    );
  });
});

describe('appendJsonLine', () => {
  it('appends a single line to file', async () => {
    const file = fixture('append-single', { temporary: true });
    await appendJsonLine(file, { name: 'Gilbert' });
    await expect(fs.promises.readFile(file, 'utf-8')).resolves.toBe('{"name":"Gilbert"}\n');
  });

  it('appends multiple lines to file', async () => {
    const file = fixture('append-multiple', { temporary: true });
    const data = [
      { name: 'Gilbert', list: ['some-list'] },
      { name: 'Alexa', nested: { nested: true, list: ['other', 'items'] } },
      { name: 'May', names: 1 },
      { name: 'Deloise', simple: true },
    ];

    for (const item of data) {
      await appendJsonLine(file, item);
    }

    await expect(fs.promises.readFile(file, 'utf-8')).resolves.toBe(
      data.map((item) => JSON.stringify(item) + '\n').join('')
    );
  });
});

/**
 * Get the file path to a fixture, by name.
 * This automatically adds the required `.jsonl` or `.temp.jsonl` extension.
 * Use `temporary: true` to keep it out of the repository, and reset the content automatically.
 */
function fixture(name: string, { temporary = false }: { temporary?: boolean } = {}) {
  const file = temporary
    ? path.join(__dirname, 'fixtures', `${name}.temp.jsonl`)
    : path.join(__dirname, 'fixtures', `${name}.jsonl`);

  if (temporary) {
    fs.writeFileSync(file, '');
  }

  return file;
}
