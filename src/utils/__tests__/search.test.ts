import { describe, expect, it } from 'bun:test';

import { type StatsModule } from '../../data/types';
import { fuzzyFilterModules } from '../search';

const modules = [
  asModule({ path: '/user/expo/node_modules/lodash/lodash.js' }),
  asModule({ path: '/user/expo/node_modules/expo/package.json' }),
  asModule({ path: '/user/expo/src/index.ts' }),
  asModule({ path: '/user/expo/src/app/index.ts' }),
];

function asModule(module: Pick<StatsModule, 'path'>) {
  return module as StatsModule;
}

describe.skip('fuzzyGlobSearch', () => {
  describe('include', () => {
    it('filters by exact file name', () => {
      expect(fuzzyFilterModules(modules, { include: 'index.ts' })).toEqual([
        asModule({ path: '/user/expo/src/index.ts' }),
        asModule({ path: '/user/expo/src/app/index.ts' }),
      ]);
    });

    it('filters by exact directory name', () => {
      expect(fuzzyFilterModules(modules, { include: 'node_modules' })).toEqual([
        asModule({ path: '/user/expo/node_modules/lodash/lodash.js' }),
        asModule({ path: '/user/expo/node_modules/expo/package.json' }),
      ]);
    });

    it('filters by multiple exact file or directory names', () => {
      expect(fuzzyFilterModules(modules, { include: 'index.ts, lodash' })).toEqual([
        asModule({ path: '/user/expo/src/index.ts' }),
        asModule({ path: '/user/expo/src/app/index.ts' }),
        asModule({ path: '/user/expo/node_modules/lodash/lodash.js' }),
      ]);
    });

    it('filters using star pattern on directory', () => {
      expect(fuzzyFilterModules(modules, { include: 'src/*' })).toEqual([
        asModule({ path: '/user/expo/src/index.ts' }),
        asModule({ path: '/user/expo/src/app/index.ts' }),
      ]);
    });

    it('filters using star pattern on nested directory', () => {
      expect(fuzzyFilterModules(modules, { include: 'expo/src/**' })).toEqual([
        asModule({ path: '/user/expo/src/index.ts' }),
        asModule({ path: '/user/expo/src/app/index.ts' }),
      ]);
    });
  });

  describe('exclude', () => {
    it('filters by exact file name', () => {
      expect(fuzzyFilterModules(modules, { exclude: 'index.ts' })).toEqual([
        asModule({ path: '/user/expo/node_modules/lodash/lodash.js' }),
        asModule({ path: '/user/expo/node_modules/expo/package.json' }),
      ]);
    });

    it('filters by exact directory name', () => {
      expect(fuzzyFilterModules(modules, { exclude: 'node_modules' })).toEqual([
        asModule({ path: '/user/expo/src/index.ts' }),
        asModule({ path: '/user/expo/src/app/index.ts' }),
      ]);
    });

    it('filters by multiple exact file or directory names', () => {
      expect(fuzzyFilterModules(modules, { exclude: 'index.ts, lodash' })).toEqual([
        asModule({ path: '/user/expo/node_modules/expo/package.json' }),
      ]);
    });

    it('filters using star pattern on directory', () => {
      expect(fuzzyFilterModules(modules, { exclude: 'src/*' })).toEqual([
        asModule({ path: '/user/expo/node_modules/lodash/lodash.js' }),
        asModule({ path: '/user/expo/node_modules/expo/package.json' }),
      ]);
    });

    it('filters using star pattern on nested directory', () => {
      expect(fuzzyFilterModules(modules, { exclude: 'expo/src/**' })).toEqual([
        asModule({ path: '/user/expo/node_modules/lodash/lodash.js' }),
        asModule({ path: '/user/expo/node_modules/expo/package.json' }),
      ]);
    });
  });
});
