const jestPreset = require('expo-module-scripts/jest-preset-cli');

// Modify the `babel-jest` entry to include babel plugins
for (const [, value] of Object.entries(jestPreset.transform)) {
  if (Array.isArray(value) && value[0] === 'babel-jest') {
    value[1].plugins = value[1].plugins || [];
    value[1].plugins.push('@babel/plugin-proposal-explicit-resource-management');
  }
}

/** @type {import('jest').Config} */
module.exports = {
  ...jestPreset,
  clearMocks: true,
  rootDir: __dirname,
  roots: ['src'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};
