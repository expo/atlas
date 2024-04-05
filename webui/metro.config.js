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
  const { AtlasFileSource } = require('../build/src/data/AtlasFileSource');
  const filePath = path.resolve(__dirname, './fixture/atlas-tabs-50.jsonl');

  global.EXPO_ATLAS_SOURCE = new AtlasFileSource(filePath);
}

module.exports = config;
