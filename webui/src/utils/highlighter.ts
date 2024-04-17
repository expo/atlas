import type { HighlighterCore, ShikiTransformer } from 'shiki';
import { getHighlighterCore } from 'shiki/core';
import js from 'shiki/langs/javascript.mjs';
import json from 'shiki/langs/json.mjs';
import jsx from 'shiki/langs/jsx.mjs';
import tsx from 'shiki/langs/tsx.mjs';
import ts from 'shiki/langs/typescript.mjs';
import getWasm from 'shiki/wasm';

import { expoTheme } from './highlighter-expo-theme';

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
    transformers: [AtlasTransformer],
    meta: { slug: options.slug },
  });
}

/**
 * This transformer does a couple of mutations.
 *   - Adds line number anchor elements to each line
 *   - Adds `.highlighter` class to root `pre` element
 *   - Adds `data-atlas-line` to both `.line-number` and `.line` elements
 *   - Adds `data-atlas-slug`, based on `meta.slug` option, to both `.line-number` and `.line` elements
 */
const AtlasTransformer: ShikiTransformer = {
  root(hast) {
    const $pre = hast.children[0] as any;
    const $code = $pre.children[0];
    const slug = this.options.meta?.slug || '';

    this.addClassToHast($pre, 'highlighter');

    $code.children = $code.children
      .map((node: any) => {
        const lineNumber = node.type === 'element' && node.properties['data-atlas-line'];
        if (!lineNumber) return node;

        return [
          {
            type: 'element',
            tagName: 'a',
            properties: {
              class: 'line-number opacity-65 hover:text-default transition-colors',
              href: `#${slug}L${lineNumber}`,
              'data-atlas-line': lineNumber,
              'data-atlas-type': slug,
            },
            children: [{ type: 'text', value: `${lineNumber}` }],
          },
          node,
        ];
      })
      .flat();
  },

  line(hast, line) {
    hast.properties['data-atlas-line'] = line;
    if (this.options.meta?.slug) {
      hast.properties['data-atlas-type'] = this.options.meta.slug;
    }
  },
};

export function applyHighlightOpacityFromHash(hash?: string) {
  window.document.querySelectorAll('.focused').forEach(($el) => {
    $el.classList.remove('focused');
  });

  const [_all, type, lineNumber] = hash?.match(/(.*)L([0-9]+)/) || [];
  if (!type || !lineNumber) return;

  window.document.querySelectorAll(`.highlighter`).forEach(($el) => $el.classList.add('focused'));
  window.document
    .querySelectorAll(`[data-atlas-type="${type}"][data-atlas-line="${lineNumber}"]`)
    .forEach(($el) => $el.classList.add('focused'));
}
