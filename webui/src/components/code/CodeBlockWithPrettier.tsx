import { type ComponentProps, useState } from 'react';

import { CodeBlockContent, CodeBlockHeader, CodeBlockSection, CodeBlockTitle } from './CodeBlock';

import { Button } from '~/ui/Button';
import { formatCode } from '~/utils/prettier';

export function CodeBlockSectionWithPrettier({
  title,
  ...props
}: ComponentProps<typeof CodeBlockContent> & { title: string }) {
  const [isLoading, setLoading] = useState(false);
  const [prettyCode, setPrettyCode] = useState<string | null>(null);

  function onTogglePrettCode() {
    if (prettyCode) {
      setPrettyCode(null);
      setLoading(false);
    }

    if (!prettyCode && !isLoading) {
      setLoading(true);
      formatCode(props.code)
        .then(setPrettyCode)
        .finally(() => setLoading(false));
    }
  }

  return (
    <CodeBlockSection>
      <CodeBlockHeader>
        <CodeBlockTitle>{title}</CodeBlockTitle>
        <Button
          variant="quaternary"
          className="m-0"
          onClick={onTogglePrettCode}
          disabled={isLoading}
        >
          {prettyCode ? 'Revert Prettify' : 'Prettify'}
        </Button>
      </CodeBlockHeader>
      <CodeBlockContent {...props} code={prettyCode || props.code} />
    </CodeBlockSection>
  );
}
