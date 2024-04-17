import babel from 'prettier/plugins/babel';
import estree from 'prettier/plugins/estree';
import prettier from 'prettier/standalone';

export function formatCode(code: string) {
  return prettier.format(code, { parser: 'babel', plugins: [babel, estree] });
}
