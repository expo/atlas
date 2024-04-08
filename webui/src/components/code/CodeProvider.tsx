import { type PropsWithChildren, createContext, useState, useEffect, useContext } from 'react';
import { type BundledLanguage, getHighlighter } from 'shiki/bundle/web';

import { expoTheme } from './expoTheme';
import './code.css';

import { StateInfo } from '~/components/StateInfo';
import { Spinner } from '~/ui/Spinner';

export type CodeLanguages = BundledLanguage;
export type CodeThemes = 'one-dark-pro';

const options: Parameters<typeof getHighlighter>[0] = {
  langs: ['jsx', 'tsx', 'javascript', 'typescript', 'json'],
  themes: [expoTheme],
};

type CodeContext = {
  highlighter: null | Awaited<ReturnType<typeof getHighlighter>>;
};

export const codeContext = createContext<CodeContext>({
  highlighter: null,
});

const isClient = !!global.window;

export function CodeProvider(props: PropsWithChildren) {
  const [highlighter, setHighlighter] = useState<CodeContext['highlighter']>(null);

  useEffect(() => {
    if (isClient) {
      getHighlighter(options).then(setHighlighter);
    }
  }, []);

  if (isClient && !highlighter) {
    return (
      <StateInfo>
        <Spinner />
      </StateInfo>
    );
  }

  return <codeContext.Provider value={{ highlighter }}>{props.children}</codeContext.Provider>;
}

export function useCodeHighlighter() {
  return useContext(codeContext).highlighter;
}
