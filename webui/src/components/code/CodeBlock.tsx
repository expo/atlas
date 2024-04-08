import { type PropsWithChildren } from 'react';

import { type CodeLanguages, type CodeThemes, useCodeHighlighter } from './CodeProvider';

export function CodeBlock({ children }: PropsWithChildren) {
  return (
    <div className="grid grid-cols-2 auto-rows-fr md:grid-cols-2 md:auto-rows-auto">{children}</div>
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

type CodeBlockContentProps = {
  code: string;
  language: CodeLanguages;
  theme?: CodeThemes;
};

export function CodeBlockContent(props: CodeBlockContentProps) {
  const highlighter = useCodeHighlighter();
  const html = highlighter?.codeToHtml(props.code, {
    lang: props.language,
    theme: 'expo-theme',
  });

  return (
    <div
      className="overflow-x-auto h-full text-xs leading-6 py-2 text-red"
      dangerouslySetInnerHTML={{ __html: html || '' }}
    />
  );
}

export function guessLanguageFromPath(path: string): CodeLanguages {
  switch (path.split('.').pop()) {
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'tsx';
    case 'js':
      return 'javascript';
    case 'jsx':
      return 'jsx';
    case 'json':
    case 'json5':
    case 'jsonc':
    case 'jsonl':
      return 'json';
    default:
      return 'typescript';
  }
}
