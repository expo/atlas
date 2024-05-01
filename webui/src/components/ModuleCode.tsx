import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { CodeAction, CodeContent, CodeHeader, CodeTitle } from '~/ui/Code';
import { Panel, PanelGroup } from '~/ui/Panel';
import { Skeleton } from '~/ui/Skeleton';
import { prettifyCode } from '~/utils/prettier';
import { getHighlightedHtml, getLanguageFromPath, useHighlighter } from '~/utils/shiki';
import { type AtlasModule } from '~core/data/types';

type ModuleCodeProps = {
  module: AtlasModule;
};

export function ModuleCode({ module }: ModuleCodeProps) {
  const { '#': hash } = useLocalSearchParams(); // NOTE(cedric): this always returns `undefined`, even when a hash is defined

  const output = module.output?.find((output) => output.type.startsWith('js'));
  const outputCode = output?.data.code || '[not available]';
  const outputFormat = useFormattedCode(outputCode);

  const sourceHighlight = useHighlightedCode(
    'source',
    module.path,
    module.source || '[not available]'
  );
  const outputHighlight = useHighlightedCode(
    'output',
    module.path,
    outputFormat.formatted || outputCode || '[not available]'
  );

  useEffect(() => {
    if (sourceHighlight.html && outputHighlight.html && typeof hash === 'string') {
      document.getElementById(hash)?.scrollIntoView();
    }
  }, [hash, sourceHighlight.html, outputHighlight.html]);

  return (
    <PanelGroup>
      <Panel>
        <CodeHeader>
          <CodeTitle>Source</CodeTitle>
        </CodeHeader>
        {sourceHighlight.state === 'loading' ? (
          <Skeleton className="min-h-96" />
        ) : (
          <CodeContent>{sourceHighlight.html}</CodeContent>
        )}
      </Panel>
      <Panel>
        <CodeHeader>
          <CodeTitle>Output</CodeTitle>
          <CodeAction onClick={outputFormat.toggle} disabled={outputFormat.state === 'pending'}>
            {outputFormat.formatted ? 'Original' : 'Format'}
          </CodeAction>
        </CodeHeader>
        {outputHighlight.state === 'loading' ? (
          <Skeleton className="min-h-96" />
        ) : (
          <CodeContent>{outputHighlight.html}</CodeContent>
        )}
      </Panel>
    </PanelGroup>
  );
}

function useHighlightedCode(slug: string, path: string, code = '[not available]') {
  const { highlighter } = useHighlighter();

  return {
    state: !highlighter ? 'loading' : 'idle',
    html: useMemo(
      () => getHighlightedHtml(highlighter, { slug, code, language: getLanguageFromPath(path) }),
      [highlighter, slug, path, code]
    ),
  };
}

function useFormattedCode(code = '') {
  const [state, setState] = useState<'idle' | 'pending'>('idle');
  const [formatted, setFormatted] = useState<string | null>(null);

  const format = useCallback(() => {
    if (state !== 'pending') {
      setState('pending');
      prettifyCode(code)
        .then(setFormatted)
        .finally(() => setState('idle'));
    }
  }, [state, code]);

  const reset = useCallback(() => {
    setState('idle');
    setFormatted(null);
  }, []);

  const toggle = useCallback(() => {
    if (formatted) {
      reset();
    } else {
      format();
    }
  }, [formatted, format, reset]);

  // Reset the formatted code, when code changes
  useEffect(() => {
    return () => reset();
  }, [code]);

  return {
    state,
    formatted,
    toggle,
  };
}
