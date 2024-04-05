#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';
import open from 'open';
import path from 'path';

import { createServer } from './createServer';
import { resolveOptions } from './resolveOptions';

export type Input = typeof args;

const args = arg({
  // Types
  '--help': Boolean,
  '--port': Number,
  '--version': Boolean,
  '--no-open': Boolean,
  // Aliases
  '-h': '--help',
  '-p': '--port',
  '-v': '--version',
});

if (args['--version']) {
  console.log(require('../../package.json').version);
  process.exit(0);
}

if (args['--help']) {
  printLines([
    chalk.bold('Usage'),
    `  ${chalk.dim('$')} expo-atlas ${chalk.dim('[atlas file]')}`,
    '',
    chalk.bold('Options'),
    `  --port${chalk.dim(', -p')}      Port to listen on`,
    `  --no-open       Do not open the browser automatically`,
    `  --help${chalk.dim(', -h')}      Displays this message`,
    `  --version${chalk.dim(', -v')}   Displays the current version`,
  ]);
  process.exit(0);
}

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

async function run() {
  const options = await resolveOptions(args);
  const server = createServer(options);

  server.listen(options.port, () => {
    const href = `http://localhost:${options.port}`;

    printLines([
      `Expo Atlas is ready on: ${chalk.underline(href)}`,
      `  ${chalk.dim(`Using: ${options.atlasFile}`)}`,
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
