import { useEffect, useState } from 'react';
import type { HighlighterCore, ShikiTransformer } from 'shiki';
import { getHighlighterCore } from 'shiki/core';
import js from 'shiki/langs/javascript.mjs';
import json from 'shiki/langs/json.mjs';
import jsx from 'shiki/langs/jsx.mjs';
import tsx from 'shiki/langs/tsx.mjs';
import ts from 'shiki/langs/typescript.mjs';
import getWasm from 'shiki/wasm';

import { expoTheme } from './shiki-theme';

export type Highlighter = HighlighterCore;
export type HighlightLanguage = 'javascript' | 'jsx' | 'typescript' | 'tsx' | 'json';
export type HighlightTheme = typeof expoTheme.name;

let highlighter: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Create a customized shiki instance with only the required languages and theme.
 * This is also a workaround for the web bundle, which seems to reload all React components somehow.
 *
 * @see https://shiki.style/guide/install#fine-grained-bundle
 */
export async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) return highlighter;

  if (!highlighterPromise) {
    highlighterPromise = getHighlighterCore({
      themes: [expoTheme],
      langs: [js, jsx, ts, tsx, json],
      loadWasm: getWasm,
    }).then((instance) => {
      highlighter = instance;
      highlighterPromise = null;
      return instance;
    });
  }

  return highlighterPromise;
}

/**
 * Get the Shiki code highlighter instance.
 * This might return `null` if the highlighter is not yet loaded.
 */
export function useHighlighter() {
  const [instance, setInstance] = useState<Highlighter | null>(highlighter);

  useEffect(() => {
    if (!instance) getHighlighter().then(setInstance);
  }, [instance]);

  return { highlighter: instance };
}

export function getLanguageFromPath(path: string): HighlightLanguage {
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

export type HighlightOptions = {
  code: string;
  language: HighlightLanguage;
  lineNumberStart?: number;
  slug: string;
};

/**
 * Parse and render the code to highlight all tokens, and output HTML.
 * This includes a couple of built-in transformations, like adding newlines as separate elements.
 */
export function getHighlightedHtml(highlighter: Highlighter | null, options: HighlightOptions) {
  return highlighter?.codeToHtml(options.code, {
    lang: options.language,
    theme: 'expo-theme',
    transformers: [AtlasTransformer],
    meta: {
      slug: options.slug,
      lineNumberStart: options.lineNumberStart || 0,
    },
  });
}

/**
 * This transformer does a couple of mutations.
 *   - Adds line number elements to each line
 *   - Adds `.highlighter` class to root `pre` element
 */
const AtlasTransformer: ShikiTransformer = {
  root() {
    const slug = this.options.meta?.slug;
    this.addClassToHast(this.pre, 'highlighter');
    this.code.children = this.code.children.flatMap((node) => {
      const lineNumber = node.type === 'element' && node.properties['data-atlas-line'];

      if (lineNumber) {
        return [
          {
            type: 'element',
            tagName: 'a',
            properties: {
              id: `${slug}L${lineNumber}`,
              href: `#${slug}L${lineNumber}`,
              class: 'line-number',
              'data-atlas-line': lineNumber,
            },
            children: [{ type: 'text', value: `${lineNumber}` }],
          },
          node,
        ];
      }

      return node;
    });
  },

  line(hast, line) {
    hast.properties['data-atlas-line'] = line + (this.options.meta?.lineNumberStart || 0);
  },
};
