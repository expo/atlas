import { useMemo } from 'react';

import { CodeBlockContent } from './CodeBlock';
import { useHighlighter } from './HighlightProvider';
import { getHighlightedHtml, type HighlightLanguage } from './highlighter';

type CodeHighlightProps = {
  children: string;
  language: HighlightLanguage;
  slug?: string;
};

export function HighlightCode(props: CodeHighlightProps) {
  const highlighter = useHighlighter();
  const html = useMemo(
    () =>
      getHighlightedHtml(highlighter, {
        code: props.children,
        language: props.language,
        slug: props.slug,
      }),
    [highlighter, props.slug, props.language, props.children]
  );

  return <CodeBlockContent>{html || ''}</CodeBlockContent>;
}

function languageFromPath(path: string): HighlightLanguage {
  switch (path.split('.').pop()) {
    case 'js':
      return 'javascript';
    case 'jsx':
      return 'jsx';
    case 'tsx':
      return 'tsx';
    case 'json':
    case 'json5':
    case 'jsonc':
    case 'jsonl':
      return 'json';
    case 'ts':
    default:
      return 'typescript';
  }
}

export function useLanguageFromPath(filePath: string) {
  return useMemo(() => languageFromPath(filePath), [filePath]);
}
