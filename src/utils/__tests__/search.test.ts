import { expect } from 'chai';
import { describe, it } from 'node:test';

import { type StatsModule } from '../../data/types';
import { fuzzyFilterModules } from '../search';

const modules = [
  { path: '/user/expo/node_modules/lodash/lodash.js' },
  { path: '/user/expo/node_modules/expo/package.json' },
  { path: '/user/expo/src/index.ts' },
  { path: '/user/expo/src/app/index.ts' },
] as StatsModule[];

describe('fuzzyGlobSearch', () => {
  describe('include', () => {
    it('filters by exact file name', () => {
      expect(fuzzyFilterModules(modules, { include: 'index.ts' })).to.deep.equal([
        { path: '/user/expo/src/index.ts' },
        { path: '/user/expo/src/app/index.ts' },
      ]);
    });

    it('filters by exact directory name', () => {
      expect(fuzzyFilterModules(modules, { include: 'node_modules' })).to.deep.equal([
        { path: '/user/expo/node_modules/lodash/lodash.js' },
        { path: '/user/expo/node_modules/expo/package.json' },
      ]);
    });

    it('filters by multiple exact file or directory names', () => {
      expect(fuzzyFilterModules(modules, { include: 'index.ts, lodash' })).to.deep.equal([
        { path: '/user/expo/src/index.ts' },
        { path: '/user/expo/src/app/index.ts' },
        { path: '/user/expo/node_modules/lodash/lodash.js' },
      ]);
    });

    it('filters using star pattern on directory', () => {
      expect(fuzzyFilterModules(modules, { include: 'src/*' })).to.deep.equal([
        { path: '/user/expo/src/index.ts' },
        { path: '/user/expo/src/app/index.ts' },
      ]);
    });

    it('filters using star pattern on nested directory', () => {
      expect(fuzzyFilterModules(modules, { include: 'expo/src/**' })).to.deep.equal([
        { path: '/user/expo/src/index.ts' },
        { path: '/user/expo/src/app/index.ts' },
      ]);
    });
  });

  describe('exclude', () => {
    it('filters by exact file name', () => {
      expect(fuzzyFilterModules(modules, { exclude: 'index.ts' })).to.deep.equal([
        { path: '/user/expo/node_modules/lodash/lodash.js' },
        { path: '/user/expo/node_modules/expo/package.json' },
      ]);
    });

    it('filters by exact directory name', () => {
      expect(fuzzyFilterModules(modules, { exclude: 'node_modules' })).to.deep.equal([
        { path: '/user/expo/src/index.ts' },
        { path: '/user/expo/src/app/index.ts' },
      ]);
    });

    it('filters by multiple exact file or directory names', () => {
      expect(fuzzyFilterModules(modules, { exclude: 'index.ts, lodash' })).to.deep.equal([
        { path: '/user/expo/node_modules/expo/package.json' },
      ]);
    });

    it('filters using star pattern on directory', () => {
      expect(fuzzyFilterModules(modules, { exclude: 'src/*' })).to.deep.equal([
        { path: '/user/expo/node_modules/lodash/lodash.js' },
        { path: '/user/expo/node_modules/expo/package.json' },
      ]);
    });

    it('filters using star pattern on nested directory', () => {
      expect(fuzzyFilterModules(modules, { exclude: 'expo/src/**' })).to.deep.equal([
        { path: '/user/expo/node_modules/lodash/lodash.js' },
        { path: '/user/expo/node_modules/expo/package.json' },
      ]);
    });
  });
});
