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

// Enable package export support, for `shiki`
config.resolver.unstable_enablePackageExports = true;

// NOTE(cedric): this is a workaround for various issues with Metro's `unstable_enablePackageExports`
// Unfortunately, Metro seems to be incapable of handling various package exports
config.resolver.resolveRequest = (context, moduleName, platform) => {
  switch (moduleName) {
    case 'tslib':
      // This always forces node resolution, without package exports, required for echarts, shiki
      return { type: 'sourceFile', filePath: require.resolve('tslib') };

    case 'prettier/standalone':
    case 'prettier/plugins/babel':
    case 'prettier/plugins/estree':
      // Prettier only exports code with `.mjs` extensions, which isn't properly resolved by Metro
      return { type: 'sourceFile', filePath: require.resolve(moduleName).replace('.js', '.mjs') };

    default:
      return context.resolveRequest(context, moduleName, platform);
  }
};

// Initialize the Expo Atlas global data source in development
if (process.env.NODE_ENV === 'development') {
  const { AtlasFileSource } = require('../build/src/data/AtlasFileSource');
  const filePath = path.resolve(__dirname, './fixture/expo-51-default.jsonl');

  global.EXPO_ATLAS_SOURCE = new AtlasFileSource(filePath);
}

module.exports = config;
