import { getPackageNameFromPath } from '../package';

describe('getPackageNameFromPath', () => {
  it('returns package name from non-nested paths', async () => {
    expect(getPackageNameFromPath('/node_modules/test-package/index.js')).toBe('test-package');
  });

  it('returns package name from nested paths', async () => {
    expect(
      getPackageNameFromPath('/node_modules/test-package/node_modules/other-package/index.js')
    ).toBe('other-package');
  });

  it('returns package name from non-nested and non-posix paths', async () => {
    expect(getPackageNameFromPath('C:\\node_modules\\test-package\\index.js')).toBe('test-package');
  });

  it('returns package name from nested and non-posix paths', async () => {
    expect(
      getPackageNameFromPath(
        'C:\\node_modules\\test-package\\node_modules\\other-package\\index.js'
      )
    ).toBe('other-package');
  });
});
