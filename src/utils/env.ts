import { boolish } from 'getenv';

export const env = {
  get EXPO_ATLAS_DEBUG() {
    return boolish('EXPO_ATLAS_DEBUG', false);
  },
  get EXPO_ATLAS_NO_STATS_VALIDATION() {
    return boolish('EXPO_ATLAS_NO_STATS_VALIDATION', false);
  },
};
