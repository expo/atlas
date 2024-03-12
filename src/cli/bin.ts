#!/usr/bin/env node
import arg from 'arg';
import open from 'open';
import path from 'path';

import { resolveOptions } from './resolveOptions';
import { createServer } from './server';

export type Input = typeof args;

const args = arg({
  // Types
  '--help': Boolean,
  '--port': Number,
  '--version': Boolean,
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
    const href = `http://localhost:${options.port}`;

    console.log(`Metro bundle inspector is ready on ${href}`);
    console.log('Loaded stats file:');
    console.log(`  ${options.statsFile}`);
    open(href);
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
