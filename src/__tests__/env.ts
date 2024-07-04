/**
 * Change the environment variable for the duration of a test.
 * This uses explicit resource management to revert the environment variable after the test.
 */
export function envVar(key: string, value?: string): { key: string; value?: string } & Disposable {
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
