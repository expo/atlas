import babel from 'prettier/plugins/babel';
import estree from 'prettier/plugins/estree';
import prettier from 'prettier/standalone';
import { useCallback, useEffect, useState } from 'react';

export function formatCode(code: string) {
  return prettier.format(code, { parser: 'babel', plugins: [babel, estree] });
}

export function useFormatCode(code: string) {
  const [isFormatting, setFormatting] = useState(false);
  const [formattedCode, setFormattedCode] = useState<string | null>(null);

  const toggleFormatCode = useCallback(() => {
    if (formattedCode) {
      setFormattedCode(null);
      setFormatting(false);
    }

    if (!formattedCode && !isFormatting) {
      setFormatting(true);
      formatCode(code)
        .then(setFormattedCode)
        .finally(() => setFormatting(false));
    }
  }, [code, isFormatting, formattedCode]);

  const resetFormatCode = useCallback(() => {
    setFormatting(false);
    setFormattedCode(null);
  }, []);

  useEffect(() => {
    resetFormatCode();
  }, [code, resetFormatCode]);

  return {
    code: formattedCode || code,
    toggleFormatCode,
    isFormatting,
    isFormatted: !!formattedCode,
  };
}
