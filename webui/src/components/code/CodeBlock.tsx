import cn from 'classnames';
import { ComponentProps, type PropsWithChildren } from 'react';
import { ShikiTransformer } from 'shiki/bundle/web';
import { MappingItem, SourceMapConsumer } from 'source-map';

import { type CodeLanguages, type CodeThemes, useCodeHighlighter } from './CodeProvider';

export function CodeBlock({ className, ...props }: PropsWithChildren<ComponentProps<'div'>>) {
  return (
    <div
      className={cn('grid grid-cols-2 auto-rows-fr md:grid-cols-2 md:auto-rows-auto', className)}
      {...props}
    />
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
  sourcemap?: SourceMapConsumer;
  sourceType?: 'code' | 'output';
};

function createSourcemapTransformer(props: CodeBlockContentProps): ShikiTransformer {
  const mappings = new Map<number, MappingItem>();
  const sourcemap = props.sourcemap;
  const sourceType = props.sourceType || 'code';

  sourcemap?.eachMapping((mapping) => {
    console.log(
      mapping,
      sourcemap.originalPositionFor({
        line: mapping.generatedLine,
        column: mapping.generatedColumn,
      })
    );

    if (mapping.generatedLine == null) return;
    if (mappings.has(mapping.generatedLine)) return;

    mappings.set(mapping.generatedLine, mapping);
  });

  return {
    line(node, line) {
      if (sourcemap) {
        const mapping = mappings.get(line);
        if (mapping && sourceType === 'output') {
          node.properties['data-map-code'] = mapping.originalLine;
        } else if (mapping && sourceType === 'code') {
          node.properties['data-map-output'] = mapping.generatedLine;
        }
      }

      node.properties[`data-line-${sourceType}`] = line;
    },
  };
}

export function CodeBlockContent(props: CodeBlockContentProps) {
  const highlighter = useCodeHighlighter();
  const html = highlighter?.codeToHtml(props.code, {
    lang: props.language,
    theme: 'expo-theme',
    transformers: [createSourcemapTransformer(props)],
  });

  return (
    <div
      className="overflow-x-auto h-full text-xs py-2 text-red"
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
