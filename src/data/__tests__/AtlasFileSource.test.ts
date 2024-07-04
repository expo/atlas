import memfs from 'memfs';

import { name, version } from '../../../package.json';
import { envVar } from '../../__tests__/env';
import { AtlasValidationError } from '../../utils/errors';
import {
  createAtlasFile,
  ensureAtlasFileExist,
  getAtlasMetdata,
  getAtlasPath,
  validateAtlasFile,
} from '../AtlasFileSource';

jest.mock('fs');
jest.mock('fs/promises');

describe(getAtlasPath, () => {
  it('returns default path `<project>/.expo/atlas.jsonl`', () => {
    expect(getAtlasPath('<project>')).toBe('<project>/.expo/atlas.jsonl');
  });
});

describe(getAtlasMetdata, () => {
  it('returns package name and version', () => {
    expect(getAtlasMetdata()).toMatchObject({ name, version });
  });
});

describe(createAtlasFile, () => {
  afterEach(() => {
    memfs.vol.reset();
  });

  it('creates a file with the correct metadata', async () => {
    await createAtlasFile('/test/create/metadata.jsonl');
    expect(memfs.vol.toJSON()).toMatchObject({
      '/test/create/metadata.jsonl': JSON.stringify({ name, version }) + '\n',
    });
  });

  it('overwrites existing file', async () => {
    memfs.vol.fromJSON({ '/test/create/invalid.jsonl': 'invalid\n' });
    await createAtlasFile('/test/create/invalid.jsonl');
    expect(memfs.vol.toJSON()).toMatchObject({
      '/test/create/invalid.jsonl': JSON.stringify({ name, version }) + '\n',
    });
  });
});

describe(validateAtlasFile, () => {
  // TODO(cedric): figure out why memfs throws "EBADF: bad file descriptor"
  // afterEach(() => {
  //   memfs.vol.reset();
  // });

  it('passes for valid file', async () => {
    await createAtlasFile('/test/validate/atlas.jsonl');
    await expect(validateAtlasFile('/test/validate/atlas.jsonl')).resolves.toBeUndefined();
  });

  it('fails for non-existing file', async () => {
    await expect(validateAtlasFile('/this/file/does-not-exists')).rejects.toThrow(
      AtlasValidationError
    );
  });

  it('fails for invalid file', async () => {
    memfs.vol.fromJSON({ '/test/validate/invalid-file.jsonl': 'invalid\n' });
    await expect(validateAtlasFile('/test/validate/invalid-file.jsonl')).rejects.toThrow(
      AtlasValidationError
    );
  });

  it('fails for invalid version', async () => {
    memfs.vol.fromJSON({
      '/test/validate/invalid-version.jsonl': JSON.stringify({ name, version: '0.0.0' }) + '\n',
    });
    await expect(validateAtlasFile('/test/validate/invalid-version.jsonl')).rejects.toThrow(
      AtlasValidationError
    );
  });

  it('skips validation when EXPO_ATLAS_NO_VALIDATION is true', async () => {
    memfs.vol.fromJSON({
      '/test/validate/disabled.jsonl': JSON.stringify({ name, version: '0.0.0' }) + '\n',
    });

    using _ = envVar('EXPO_ATLAS_NO_VALIDATION', 'true');
    await expect(validateAtlasFile('/test/validate/disabled.jsonl')).resolves.toBeUndefined();
  });
});

describe(ensureAtlasFileExist, () => {
  // TODO(cedric): figure out why memfs throws "EBADF: bad file descriptor"
  // afterEach(() => {
  //   memfs.vol.reset();
  // });

  it('returns true for valid file', async () => {
    memfs.vol.fromJSON({ '/test/ensure/valid.jsonl': JSON.stringify({ name, version }) + '\n' });
    await expect(ensureAtlasFileExist('/test/ensure/valid.jsonl')).resolves.toBe(true);
  });

  it('returns true when EXPO_ATLAS_NO_VALIDATION is true', async () => {
    memfs.vol.fromJSON({
      '/test/ensure/skip-validation.jsonl': JSON.stringify({ name, version: '0.0.0' }) + '\n',
    });

    using _ = envVar('EXPO_ATLAS_NO_VALIDATION', 'true');
    await expect(ensureAtlasFileExist('/test/ensure/skip-validation.jsonl')).resolves.toBe(true);
  });

  it('returns false for non-existing file', async () => {
    memfs.vol.fromJSON({});
    await expect(ensureAtlasFileExist('/test/ensure/non-existing.jsonl')).resolves.toBe(false);
    await expect(ensureAtlasFileExist('/test/ensure/non-existing.jsonl')).resolves.toBe(true);
  });

  it('returns false for invalid file', async () => {
    memfs.vol.fromJSON({ '/test/ensure/invalid-file.jsonl': 'invalid\n' });
    await expect(ensureAtlasFileExist('/test/ensure/invalid-file.jsonl')).resolves.toBe(false);
    await expect(ensureAtlasFileExist('/test/ensure/invalid-file.jsonl')).resolves.toBe(true);
  });

  it('returns false for invalid version', async () => {
    memfs.vol.fromJSON({
      '/test/ensure/invalid-version.jsonl': JSON.stringify({ name, version: '0.0.0' }) + '\n',
    });
    await expect(ensureAtlasFileExist('/test/ensure/invalid-version.jsonl')).resolves.toBe(false);
    await expect(ensureAtlasFileExist('/test/ensure/invalid-version.jsonl')).resolves.toBe(true);
  });
});
