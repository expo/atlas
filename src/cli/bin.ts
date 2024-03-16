#!/usr/bin/env node
import arg from 'arg';
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
  console.log(`
    Usage
      $ expo-atlas [statsFile]

    Options
      --port, -p      Port to listen on
      --no-open       Do not open the browser automatically
      --help, -h      Displays this message
      --version, -v   Displays the current version
  `);
  process.exit(0);
}

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

async function run() {
  const options = await resolveOptions(args);
  const server = createServer(options);

  server.listen(options.port, () => {
    const href = `http://localhost:${options.port}/_expo/atlas`;

    console.log(`Metro bundle inspector is ready on ${href}`);
    console.log('Loaded stats file:');
    console.log(`  ${options.statsFile}`);

    if (options.browserOpen) {
      open(href).catch((error) => {
        console.error('Could not automatically open browser:', error.message);
      });
    }
  });
}

run().catch((error) => {
  if (error.type !== 'AtlasError') {
    throw error;
  }

  if (error.code === 'STATS_FILE_INCOMPATIBLE') {
    const statsFile = path.relative(process.cwd(), error.statsFile);
    console.error('Stats file is incompatible with this version, use this instead:');
    console.error(`  npx expo-atlas@${error.incompatibleVersion} ${statsFile}`);
  } else {
    console.error(`${error.message} (${error.code})`);
  }

  process.exit(1);
});
