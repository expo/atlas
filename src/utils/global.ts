import { StatsSource } from '../data/types';

declare global {
  /**
   * The globally initialized data source for Atlas.
   * This is set in a global to access the data from the bundled webui API routes.
   */
  var EXPO_ATLAS_SOURCE: StatsSource; // eslint-disable-line no-var
}
