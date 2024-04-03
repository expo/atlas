// Note(cedric): this file was copied from core, and isn't currently used as test.
import { describe, expect, it } from 'bun:test';

import { globFilterModules } from '../search';

import { type StatsModule } from '~core/data/types';

const projectRoot = '/user/expo';
const modules = [
  asModule({ path: '/user/expo/node_modules/lodash/lodash.js' }),
  asModule({ path: '/user/expo/node_modules/expo/package.json' }),
  asModule({ path: '/user/expo/src/index.ts' }),
  asModule({ path: '/user/expo/src/app/index.ts' }),
];

function asModule(module: Pick<StatsModule, 'path'>) {
  return module as StatsModule;
}

describe.skip('globFilterModules', () => {
  describe('include', () => {
    it('filters by exact file name', () => {
      expect(globFilterModules(modules, projectRoot, { include: 'index.ts' })).toEqual([
        asModule({ path: '/user/expo/src/index.ts' }),
        asModule({ path: '/user/expo/src/app/index.ts' }),
      ]);
    });

    it('filters by exact directory name', () => {
      expect(globFilterModules(modules, projectRoot, { include: 'node_modules' })).toEqual([
        asModule({ path: '/user/expo/node_modules/lodash/lodash.js' }),
        asModule({ path: '/user/expo/node_modules/expo/package.json' }),
      ]);
    });

    it('filters by multiple exact file or directory names', () => {
      expect(globFilterModules(modules, projectRoot, { include: 'index.ts, lodash' })).toEqual([
        asModule({ path: '/user/expo/src/index.ts' }),
        asModule({ path: '/user/expo/src/app/index.ts' }),
        asModule({ path: '/user/expo/node_modules/lodash/lodash.js' }),
      ]);
    });

    it('filters using star pattern on directory', () => {
      expect(globFilterModules(modules, projectRoot, { include: 'src/*' })).toEqual([
        asModule({ path: '/user/expo/src/index.ts' }),
        asModule({ path: '/user/expo/src/app/index.ts' }),
      ]);
    });

    it('filters using star pattern on nested directory', () => {
      expect(globFilterModules(modules, projectRoot, { include: 'expo/src/**' })).toEqual([
        asModule({ path: '/user/expo/src/index.ts' }),
        asModule({ path: '/user/expo/src/app/index.ts' }),
      ]);
    });
  });

  describe('exclude', () => {
    it('filters by exact file name', () => {
      expect(globFilterModules(modules, projectRoot, { exclude: 'index.ts' })).toEqual([
        asModule({ path: '/user/expo/node_modules/lodash/lodash.js' }),
        asModule({ path: '/user/expo/node_modules/expo/package.json' }),
      ]);
    });

    it('filters by exact directory name', () => {
      expect(globFilterModules(modules, projectRoot, { exclude: 'node_modules' })).toEqual([
        asModule({ path: '/user/expo/src/index.ts' }),
        asModule({ path: '/user/expo/src/app/index.ts' }),
      ]);
    });

    it('filters by multiple exact file or directory names', () => {
      expect(globFilterModules(modules, projectRoot, { exclude: 'index.ts, lodash' })).toEqual([
        asModule({ path: '/user/expo/node_modules/expo/package.json' }),
      ]);
    });

    it('filters using star pattern on directory', () => {
      expect(globFilterModules(modules, projectRoot, { exclude: 'src/*' })).toEqual([
        asModule({ path: '/user/expo/node_modules/lodash/lodash.js' }),
        asModule({ path: '/user/expo/node_modules/expo/package.json' }),
      ]);
    });

    it('filters using star pattern on nested directory', () => {
      expect(globFilterModules(modules, projectRoot, { exclude: 'expo/src/**' })).toEqual([
        asModule({ path: '/user/expo/node_modules/lodash/lodash.js' }),
        asModule({ path: '/user/expo/node_modules/expo/package.json' }),
      ]);
    });
  });
});
