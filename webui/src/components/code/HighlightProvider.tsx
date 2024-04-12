import { type PropsWithChildren, createContext, useState, useEffect, useContext } from 'react';
import { type BundledLanguage, getHighlighter, type Highlighter } from 'shiki/bundle/web';

import { expoTheme } from './expoTheme';
import './shiki.css';

export type HighlightLanguages = BundledLanguage;
export type HighlightThemes = 'expo-theme';

const options: Parameters<typeof getHighlighter>[0] = {
  langs: ['jsx', 'tsx', 'javascript', 'typescript', 'json'],
  themes: [expoTheme],
};

type HighlightContext = {
  highlighter: null | Highlighter;
};

export const highlightContext = createContext<HighlightContext>({
  highlighter: null,
});

export function HighlightProvider(props: PropsWithChildren) {
  const [highlighter, setHighlighter] = useState<HighlightContext['highlighter'] | undefined>();

  useEffect(() => {
    if (highlighter === undefined) {
      setHighlighter(null); // Mark as loading
      getHighlighter(options).then(setHighlighter);
    }
  }, [highlighter]);

  return (
    <highlightContext.Provider value={{ highlighter: highlighter || null }}>
      {props.children}
    </highlightContext.Provider>
  );
}

export function useHighlighter() {
  return useContext(highlightContext).highlighter;
}
