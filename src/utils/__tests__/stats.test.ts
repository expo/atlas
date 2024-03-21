import { describe, expect, it } from 'bun:test';
import fs from 'fs';
import path from 'path';

import { name, version } from '../../../package.json';
import { AtlasValidationError } from '../errors';
import { getStatsPath, getStatsMetdata, createStatsFile, validateStatsFile } from '../stats';

describe('getStatsPath', () => {
  it('returns default path `<project>/.expo/atlas.jsonl`', () => {
    expect(getStatsPath('<project>')).toBe('<project>/.expo/atlas.jsonl');
  });
});

describe('getStatsMetadata', () => {
  it('returns package name and version', () => {
    expect(getStatsMetdata()).toMatchObject({ name, version });
  });
});

describe('createStatsFile', () => {
  it('creates a stats file with the correct metadata', async () => {
    const file = fixture('create-metadata', { temporary: true });
    await createStatsFile(file);
    await expect(fs.promises.readFile(file, 'utf8')).resolves.toBe(
      JSON.stringify({ name, version }) + '\n'
    );
  });

  it('overwrites invalid stats file', async () => {
    const file = fixture('create-invalid', { temporary: true });
    await fs.promises.writeFile(file, JSON.stringify({ name, version: '0.0.0' }) + '\n');
    await createStatsFile(file);
    await expect(fs.promises.readFile(file, 'utf8')).resolves.toBe(
      JSON.stringify({ name, version }) + '\n'
    );
  });

  it('reuses valid stats file', async () => {
    const file = fixture('create-valid', { temporary: true });
    await fs.promises.writeFile(file, JSON.stringify({ name, version }) + '\n');
    await createStatsFile(file);
    await expect(fs.promises.readFile(file, 'utf-8')).resolves.toBe(
      JSON.stringify({ name, version }) + '\n'
    );
  });
});

describe('validateStatsFile', () => {
  it('passes for valid stats file', async () => {
    const file = fixture('validate-valid', { temporary: true });
    await createStatsFile(file);
    await expect(validateStatsFile(file)).resolves.pass();
  });

  it('fails for non-existing stats file', async () => {
    await expect(validateStatsFile('./this-file-does-not-exists')).rejects.toThrow(
      AtlasValidationError
    );
  });

  it('fails for invalid stats file', async () => {
    const file = fixture('validate-invalid', { temporary: true });
    await fs.promises.writeFile(file, JSON.stringify({ name, version: '0.0.0' }) + '\n');
    await expect(validateStatsFile(file)).rejects.toThrow(AtlasValidationError);
  });

  it('skips validation when EXPO_ATLAS_NO_STATS_VALIDATION is true-ish', async () => {
    using _env = env('EXPO_ATLAS_NO_STATS_VALIDATION', 'true');
    const file = fixture('validate-skip-invalid', { temporary: true });
    await fs.promises.writeFile(file, JSON.stringify({ name, version: '0.0.0' }) + '\n');
    await expect(validateStatsFile(file)).resolves.pass();
  });
});

/**
 * Get the file path to a fixture, by name.
 * This automatically adds the required `.jsonl` or `.temp.jsonl` extension.
 * Use `temporary: true` to keep it out of the repository, and reset the content automatically.
 */
function fixture(name: string, { temporary = false }: { temporary?: boolean } = {}) {
  const file = temporary
    ? path.join(__dirname, 'fixtures/stats', `${name}.temp.jsonl`)
    : path.join(__dirname, 'fixtures/stats', `${name}.jsonl`);

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
