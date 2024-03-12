const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = withNativeWind(getDefaultConfig(__dirname), {
  input: './src/styles.css',
});

config.watchFolders = [__dirname, path.resolve(__dirname, '..')];

module.exports = config;
