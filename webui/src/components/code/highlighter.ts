import type { HighlighterCore, ShikiTransformer } from 'shiki';
import { getHighlighterCore } from 'shiki/core';
import js from 'shiki/langs/javascript.mjs';
import json from 'shiki/langs/json.mjs';
import jsx from 'shiki/langs/jsx.mjs';
import tsx from 'shiki/langs/tsx.mjs';
import ts from 'shiki/langs/typescript.mjs';
import getWasm from 'shiki/wasm';

import { expoTheme } from './expoTheme';

export type Highlighter = HighlighterCore;
export type HighlightLanguage = 'javascript' | 'jsx' | 'typescript' | 'tsx' | 'json';
export type HighlightTheme = 'expo-theme';

/**
 * Create a customized shiki instance with only the required languages and theme.
 * This is also a workaround for the web bundle, which seems to reload all React components somehow.
 *
 * @see https://shiki.style/guide/install#fine-grained-bundle
 */
export function getHighlighter(): Promise<Highlighter> {
  return getHighlighterCore({
    themes: [expoTheme],
    langs: [js, jsx, ts, tsx, json],
    loadWasm: getWasm,
  });
}

type HighlightOptions = {
  code: string;
  language: HighlightLanguage;
  slug?: string;
};

/**
 * Parse and render the code to highlight all tokens, and output HTML.
 * This includes a couple of built-in transformations, like adding newlines as separate elements.
 */
export function getHighlightedHtml(highlighter: Highlighter | null, options: HighlightOptions) {
  return highlighter?.codeToHtml(options.code, {
    lang: options.language,
    theme: 'expo-theme',
    transformers: [lineIdentifierTransformer],
    meta: { slug: options.slug },
  });
}

const lineIdentifierTransformer: ShikiTransformer = {
  root(hast) {
    const $pre = hast.children[0] as any;
    const $code = $pre.children[0];
    const slug = this.options.meta?.slug || '';

    $code.children = $code.children
      .map((node: any) => {
        const lineNumber = node.type === 'element' && node.properties['data-line'];
        if (!lineNumber) return node;

        return [
          {
            type: 'element',
            tagName: 'a',
            properties: {
              class: 'line-number opacity-65 hover:text-default transition-colors',
              href: `#${slug}L${lineNumber}`,
              'data-line': lineNumber,
              'data-slug': slug,
            },
            children: [{ type: 'text', value: `${lineNumber}` }],
          },
          node,
        ];
      })
      .flat();
  },

  line(hast, line) {
    hast.properties['data-line'] = line;
    if (this.options.meta?.slug) {
      hast.properties['data-type'] = this.options.meta.slug;
    }
  },
};
