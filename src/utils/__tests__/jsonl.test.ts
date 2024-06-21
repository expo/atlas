import memfs from 'memfs';

import { appendJsonLine, forEachJsonLines, parseJsonLine } from '../jsonl';

jest.mock('fs');
jest.mock('fs/promises');

describe('forEachJsonLines', () => {
  // TODO(cedric): figure out why memfs throws "EBADF: bad file descriptor"
  // afterEach(() => {
  //   memfs.vol.reset();
  // });

  it('iterates each line of file', async () => {
    memfs.vol.fromJSON({ '/test/iterate/lines.jsonl': createJsonlExample() });

    const lines: string[] = [];
    await forEachJsonLines('/test/iterate/lines.jsonl', (content) => {
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
    memfs.vol.fromJSON({ '/test/iterate/linenumbers.jsonl': createJsonlExample() });

    const onReadLine = jest.fn();
    await forEachJsonLines('/test/iterate/linenumbers.jsonl', onReadLine);

    // Callback is invoked with (content, line, reader) => ...
    expect(onReadLine).not.toHaveBeenCalledWith(expect.any(String), 0, expect.any(Object));
    expect(onReadLine).toHaveBeenCalledWith(expect.any(String), 1, expect.any(Object));
    expect(onReadLine).toHaveBeenCalledWith(expect.any(String), 2, expect.any(Object));
    expect(onReadLine).toHaveBeenCalledWith(expect.any(String), 3, expect.any(Object));
    expect(onReadLine).toHaveBeenCalledWith(expect.any(String), 4, expect.any(Object));
  });
});

describe('parseJsonLine', () => {
  // TODO(cedric): figure out why memfs throws "EBADF: bad file descriptor"
  // afterEach(() => {
  //   memfs.vol.reset();
  // });

  it('parses a single line from file', async () => {
    memfs.vol.fromJSON({ '/test/parse/line.jsonl': createJsonlExample() });

    expect(await parseJsonLine('/test/parse/line.jsonl', 1)).toMatchObject({ name: 'Gilbert' });
    expect(await parseJsonLine('/test/parse/line.jsonl', 2)).toMatchObject({ name: 'Alexa' });
    expect(await parseJsonLine('/test/parse/line.jsonl', 3)).toMatchObject({ name: 'May' });
    expect(await parseJsonLine('/test/parse/line.jsonl', 4)).toMatchObject({ name: 'Deloise' });
  });

  it('throws if single line is not found', async () => {
    memfs.vol.fromJSON({ '/test/parse/outofbounds.jsonl': createJsonlExample() });
    await expect(parseJsonLine('/test/parse/outofbounds.jsonl', 99999)).rejects.toThrow(
      'Line 99999 not found in file'
    );
  });
});

describe('appendJsonLine', () => {
  // TODO(cedric): figure out why memfs throws "EBADF: bad file descriptor"
  // afterEach(() => {
  //   memfs.vol.reset();
  // });

  it('appends a single line to file', async () => {
    memfs.vol.fromJSON({ '/test/append/line.jsonl': '' });
    await appendJsonLine('/test/append/line.jsonl', { name: 'Gilbert' });
    expect(memfs.vol.toJSON()).toMatchObject({
      '/test/append/line.jsonl': '{"name":"Gilbert"}\n',
    });
  });

  it('appends multiple lines to file', async () => {
    memfs.vol.fromJSON({ '/test/append/lines.jsonl': '' });
    const data = [
      { name: 'Gilbert', list: ['some-list'] },
      { name: 'Alexa', nested: { nested: true, list: ['other', 'items'] } },
      { name: 'May', names: 1 },
      { name: 'Deloise', simple: true },
    ];

    for (const item of data) {
      await appendJsonLine('/test/append/lines.jsonl', item);
    }

    expect(memfs.vol.toJSON()).toMatchObject({
      '/test/append/lines.jsonl': data.map((item) => JSON.stringify(item) + '\n').join(''),
    });
  });
});

/** See: https://jsonlines.org/examples/ */
function createJsonlExample() {
  return `{"name": "Gilbert", "wins": [["straight", "7♣"], ["one pair", "10♥"]]}
{"name": "Alexa", "wins": [["two pair", "4♠"], ["two pair", "9♠"]]}
{"name": "May", "wins": []}
{"name": "Deloise", "wins": [["three of a kind", "5♣"]]}
`;
}
