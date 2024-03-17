const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = withNativeWind(getDefaultConfig(__dirname), {
  input: './src/styles.css',
});

// Allow Metro to access the `~plugin/**` files
config.watchFolders = [__dirname, path.resolve(__dirname, '..')];

// Move the Metro cache to `node_modules/.cache`
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// Initialize the Expo Atlas global data source in development
if (process.env.NODE_ENV === 'development') {
  const { StatsFileSource } = require('../build/src/data/StatsFileSource');
  const statsFile = path.resolve(__dirname, './fixture/stats-tabs-50.jsonl');

  global.EXPO_ATLAS_SOURCE = new StatsFileSource(statsFile);
}

module.exports = config;
