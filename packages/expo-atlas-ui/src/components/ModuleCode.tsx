import type { AtlasModule } from 'expo-atlas';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { CodeAction, CodeContent, CodeHeader, CodeTitle } from '~/ui/Code';
import { Panel, PanelGroup } from '~/ui/Panel';
import { Skeleton } from '~/ui/Skeleton';
import { prettifyCode } from '~/utils/prettier';
import { getHighlightedHtml, getLanguageFromPath, useHighlighter } from '~/utils/shiki';

type ModuleCodeProps = {
  module: AtlasModule;
};

export function ModuleCode({ module }: ModuleCodeProps) {
  const output = module.output?.find((output) => output.type.startsWith('js'));
  const outputCode = output?.data.code || '[not available]';
  const outputFormat = useFormattedCode(outputCode);

  const sourceHighlight = useHighlightedCode(
    module.absolutePath,
    module.source || '[not available]'
  );
  const outputHighlight = useHighlightedCode(
    module.absolutePath,
    outputFormat.formatted || outputCode || '[not available]'
  );

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

function useHighlightedCode(path: string, code: string) {
  const { highlighter } = useHighlighter();

  return {
    state: !highlighter ? 'loading' : 'idle',
    html: useMemo(
      () => getHighlightedHtml(highlighter, { code, language: getLanguageFromPath(path) }),
      [highlighter, path, code]
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
