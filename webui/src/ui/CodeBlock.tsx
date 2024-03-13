import { Highlight, type PrismTheme } from 'prism-react-renderer';
import { type ComponentProps, type PropsWithChildren, useState } from 'react';

import { Button } from '~/ui/Button';
import { formatCode } from '~/utils/prettier';

export function CodeBlock({ children }: PropsWithChildren) {
  return (
    <div className="grid grid-cols-2 auto-rows-fr md:grid-cols-2 md:auto-rows-auto max-h-[820px]">
      {children}
    </div>
  );
}

export function CodeBlockSection({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col border-default bg-subtle border border-l-0 first:border-l first:rounded-l-md last:rounded-r-md overflow-hidden">
      {children}
    </div>
  );
}

export function CodeBlockHeader({ children }: PropsWithChildren) {
  return (
    <div className="flex justify-between items-center bg-default min-h-[40px] pl-4 border-b border-default">
      {typeof children === 'string' ? <CodeBlockTitle>{children}</CodeBlockTitle> : children}
    </div>
  );
}

export function CodeBlockTitle({ children }: { children: string }) {
  return <h3 className="text-md select-none font-medium truncate">{children}</h3>;
}

export function CodeBlockContent({
  children,
  language = 'tsx',
}: {
  children: string;
  language?: string;
}) {
  return (
    <Highlight code={children} language={language} theme={highlightTheme}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre style={style} className="p-4 text-xs overflow-auto">
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              <span className="inline-block text-secondary min-w-8 select-none">{i + 1}</span>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

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
      formatCode(props.children)
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
      <CodeBlockContent {...props} children={prettyCode || props.children} />
    </CodeBlockSection>
  );
}

export function guessLanguageFromPath(path: string) {
  const extension = path.split('.').pop();
  switch (extension) {
    case 'ts':
      return 'ts';
    case 'tsx':
      return 'tsx';
    case 'js':
      return 'js';
    case 'jsx':
      return 'jsx';
    case 'json':
      return 'json';
    default:
      return 'tsx';
  }
}

// see: https://github.com/expo/expo/blob/9f8ddc869cceaed41486692057123b83882cb262/docs/global-styles/prism.ts#L46
const highlightTheme: PrismTheme = {
  plain: {},
  styles: [
    {
      types: ['comment', 'block-comment', 'prolog', 'doctype', 'cdata'],
      style: { color: 'var(--gray10)' },
    },
    {
      types: ['operator', 'punctuation'],
      style: { color: 'var(--gray9)' },
    },
    {
      types: ['attr-name', 'boolean', 'function-name', 'constant', 'symbol', 'deleted'],
      style: { color: 'var(--red11)' },
    },
    {
      types: ['selector', 'char', 'builtin', 'script', 'inserted'],
      style: { color: 'var(--green10)' },
    },
    {
      types: ['entity', 'variable'],
      style: { color: 'var(--green11)' },
    },
    {
      types: ['keyword'],
      style: { color: 'var(--pink10)' },
    },
    {
      types: ['property', 'atrule', 'attr-value', 'function'],
      style: { color: 'var(--purple11)' },
    },
    {
      types: ['class-name', 'regex', 'important', 'tag'],
      style: { color: 'var(--orange11)' },
    },
    {
      types: ['number', 'string'],
      style: { color: 'var(--yellow11)' },
    },
    {
      types: ['url', 'literal-property', 'property-access'],
      style: { color: 'var(--blue11)' },
    },
  ],
};
