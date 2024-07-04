import { convertPathToPosix } from '../paths';

describe('convertPathToPosix', () => {
  it('returns posix path from posix', async () => {
    expect(convertPathToPosix('/node_modules/test-package/index.js')).toBe(
      '/node_modules/test-package/index.js'
    );
  });

  it('returns posix path from non-posix', async () => {
    expect(convertPathToPosix('C:\\node_modules\\test-package\\index.js')).toBe(
      'C:/node_modules/test-package/index.js'
    );
  });
});
