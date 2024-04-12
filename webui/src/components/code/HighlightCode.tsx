import { useMemo } from 'react';

import { CodeBlockContent } from './CodeBlock';
import { useHighlighter } from './HighlightProvider';

type CodeHighlightProps = {
  children: string;
  language: string;
};

export function HighlightCode(props: CodeHighlightProps) {
  const highlighter = useHighlighter();
  const html = useMemo(
    () =>
      highlighter?.codeToHtml(props.children, {
        lang: props.language,
        theme: 'expo-theme',
      }),
    [highlighter, props.language, props.children]
  );

  return <CodeBlockContent>{html || ''}</CodeBlockContent>;
}

function languageFromPath(path: string) {
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

export function useLanguageFromPath(filePath: string) {
  return useMemo(() => languageFromPath(filePath), [filePath]);
}
