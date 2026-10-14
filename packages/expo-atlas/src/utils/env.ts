export const env = {
  get EXPO_DEBUG() {
    return boolish('EXPO_DEBUG');
  },
  get EXPO_ATLAS_NO_VALIDATION() {
    return boolish('EXPO_ATLAS_NO_VALIDATION');
  },
};

function boolish(value: string | undefined) {
  return value === '1' || value?.toLowerCase() === 'true';
}
