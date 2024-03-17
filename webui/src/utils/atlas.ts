import '~core/utils/global';

/**
 * Get the Expo Atlas data source, from global property.
 * If we are in development mode, initialize a stats fixture from native component list.
 */
export function getSource() {
  if (!global.EXPO_ATLAS_SOURCE) {
    throw new Error('Expo Atlas data source is not initialized');
  }

  return global.EXPO_ATLAS_SOURCE;
}
