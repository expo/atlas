import { describe, expect, it } from 'bun:test';
import fs from 'fs';
import path from 'path';

import { name, version } from '../../../package.json';
import { AtlasValidationError } from '../../utils/errors';
import {
  getAtlasPath,
  getAtlasMetdata,
  createAtlasFile,
  validateAtlasFile,
} from '../AtlasFileSource';

describe('getAtlasPath', () => {
  it('returns default path `<project>/.expo/atlas.jsonl`', () => {
    expect(getAtlasPath('<project>')).toBe('<project>/.expo/atlas.jsonl');
  });
});

describe('getAtlasMetdata', () => {
  it('returns package name and version', () => {
    expect(getAtlasMetdata()).toMatchObject({ name, version });
  });
});

describe('createAtlasFile', () => {
  it('creates a file with the correct metadata', async () => {
    const file = fixture('create-metadata', { temporary: true });
    await createAtlasFile(file);
    await expect(fs.promises.readFile(file, 'utf8')).resolves.toBe(
      JSON.stringify({ name, version }) + '\n'
    );
  });

  it('overwrites invalid file', async () => {
    const file = fixture('create-invalid', { temporary: true });
    await fs.promises.writeFile(file, JSON.stringify({ name, version: '0.0.0' }) + '\n');
    await createAtlasFile(file);
    await expect(fs.promises.readFile(file, 'utf8')).resolves.toBe(
      JSON.stringify({ name, version }) + '\n'
    );
  });

  it('reuses valid file', async () => {
    const file = fixture('create-valid', { temporary: true });
    await fs.promises.writeFile(file, JSON.stringify({ name, version }) + '\n');
    await createAtlasFile(file);
    await expect(fs.promises.readFile(file, 'utf-8')).resolves.toBe(
      JSON.stringify({ name, version }) + '\n'
    );
  });
});

describe('validateAtlasFile', () => {
  it('passes for valid file', async () => {
    const file = fixture('validate-valid', { temporary: true });
    await createAtlasFile(file);
    await expect(validateAtlasFile(file)).resolves.pass();
  });

  it('fails for non-existing file', async () => {
    await expect(validateAtlasFile('./this-file-does-not-exists')).rejects.toThrow(
      AtlasValidationError
    );
  });

  it('fails for invalid file', async () => {
    const file = fixture('validate-invalid', { temporary: true });
    await fs.promises.writeFile(file, JSON.stringify({ name, version: '0.0.0' }) + '\n');
    await expect(validateAtlasFile(file)).rejects.toThrow(AtlasValidationError);
  });

  it('skips validation when EXPO_ATLAS_NO_VALIDATION is true-ish', async () => {
    using _env = env('EXPO_ATLAS_NO_VALIDATION', 'true');
    const file = fixture('validate-skip-invalid', { temporary: true });
    await fs.promises.writeFile(file, JSON.stringify({ name, version: '0.0.0' }) + '\n');
    await expect(validateAtlasFile(file)).resolves.pass();
  });
});

/**
 * Get the file path to a fixture, by name.
 * This automatically adds the required `.jsonl` or `.temp.jsonl` extension.
 * Use `temporary: true` to keep it out of the repository, and reset the content automatically.
 */
function fixture(name: string, { temporary = false }: { temporary?: boolean } = {}) {
  const file = temporary
    ? path.join(__dirname, 'fixtures/atlas', `${name}.temp.jsonl`)
    : path.join(__dirname, 'fixtures/atlas', `${name}.jsonl`);

  fs.mkdirSync(path.dirname(file), { recursive: true });

  if (temporary) {
    fs.writeFileSync(file, '');
  }

  return file;
}

/**
 * Change the environment variable for the duration of a test.
 * This uses explicit resource management to revert the environment variable after the test.
 */
function env(key: string, value?: string): { key: string; value?: string } & Disposable {
  const original = process.env[key];

  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }

  return {
    key,
    value,
    [Symbol.dispose]() {
      if (original === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    },
  };
}
