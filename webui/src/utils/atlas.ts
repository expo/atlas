import '~core/utils/global';

/**
 * Get the Expo Atlas data source, from global property.
 * When running in development, the `metro.config.js` initializes a fixture source.
 */
export function getSource() {
  if (!global.EXPO_ATLAS_SOURCE) {
    throw new Error('Expo Atlas data source is not initialized');
  }

  return global.EXPO_ATLAS_SOURCE;
}
