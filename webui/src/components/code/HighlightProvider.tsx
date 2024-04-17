import { type PropsWithChildren, createContext, useContext, useState, useEffect } from 'react';

import './shiki.css';
import { type Highlighter, getHighlighter } from './highlighter';

type HighlightContext = {
  highlighter: null | Highlighter;
};

export const highlightContext = createContext<HighlightContext>({
  highlighter: null,
});

export function HighlightProvider(props: PropsWithChildren) {
  const [highlighter, setHighlighter] = useState<null | Highlighter>(null);

  useEffect(() => {
    if (!highlighter) {
      getHighlighter().then(setHighlighter);
    }
  }, [highlighter]);

  return (
    <highlightContext.Provider value={{ highlighter }}>{props.children}</highlightContext.Provider>
  );
}

export function useHighlighter() {
  return useContext(highlightContext).highlighter;
}
