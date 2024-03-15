import { StatsSource } from '../data/types';

declare global {
  /** The globally initialized data source for Atlas */
  var EXPO_ATLAS_SOURCE: StatsSource; // eslint-disable-line no-var
}
