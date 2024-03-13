import { type StatsSource } from '~plugin';

declare global {
  var EXPO_ATLAS_SOURCE: StatsSource; // eslint-disable-line no-var
}

export function getSource() {
  if (!global['EXPO_ATLAS_SOURCE']) {
    throw new Error('Expo Atlas data source is not initialized');
  }

  return global['EXPO_ATLAS_SOURCE'];
}
