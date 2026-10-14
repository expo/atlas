#!/usr/bin/env node
import open from 'open';
import path from 'node:path';
import { parseArgs, styleText } from 'node:util';

import { createServer } from './createServer';
import { resolveOptions } from './resolveOptions';

export type Input = typeof input;

const input = parseArgs({
  allowPositionals: true,
  options: {
    port: { type: 'string', short: 'p' },
    'no-open': { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
  },
});

if (input.values.version) {
  console.log(require('../../package.json').version);
  process.exit(0);
}

if (input.values.help) {
  printLines([
    styleText('bold', 'Usage'),
    `  ${styleText('dim', '$')} expo-atlas ${styleText('dim', '[atlas file]')}`,
    '',
    styleText('bold', 'Options'),
    `  --port${styleText('dim', ', -p')}      Port to listen on`,
    `  --no-open       Do not open the browser automatically`,
    `  --help${styleText('dim', ', -h')}      Displays this message`,
    `  --version${styleText('dim', ', -v')}   Displays the current version`,
  ]);
  process.exit(0);
}

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

async function run() {
  const options = await resolveOptions(input);
  const server = createServer(options);

  server.listen(options.port, () => {
    const href = `http://localhost:${options.port}`;

    printLines([
      `Expo Atlas is ready on: ${styleText('underline', href)}`,
      `  ${styleText('dim', `Using: ${options.atlasFile}`)}`,
    ]);

    if (options.browserOpen) {
      open(href).catch((error) => {
        console.error('Could not automatically open browser:', error.message);
      });
    }
  });
}

function printLines(lines: string[]) {
  console.log(`  ${lines.join('\n  ')}`);
}

run().catch((error) => {
  if (error.type !== 'AtlasError') {
    throw error;
  }

  if (error.code === 'ATLAS_FILE_INCOMPATIBLE') {
    const atlasFile = path.relative(process.cwd(), error.filePath);
    console.error('Atlas file is incompatible with this version, use this instead:');
    console.error(`  npx expo-atlas@${error.incompatibleVersion} ${atlasFile}`);
  } else {
    console.error(`${error.message} (${error.code})`);
  }

  process.exit(1);
});
