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

module.exports = config;
