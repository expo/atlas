import { getSource } from '~/utils/atlas';
import {
  getHighlighter,
  getHighlightedHtml,
  getLanguageFromPath,
  type HighlightOptions,
} from '~/utils/highlighter';
import { formatCode } from '~/utils/prettier';

export async function GET(request: Request, params: Record<'entry' | 'module', string>) {
  try {
    const entry = await getSource().getEntry(params.entry);
    const module = entry && entry.modules.get(decodeURIComponent(params.module));

    if (!entry || !module) {
      return Response.json(
        !entry
          ? { error: `Entry not found: ${params.entry}` }
          : { error: `Module not found: ${params.module}` },
        { status: 404 }
      );
    }

    const query = new URL(request.url).searchParams;
    switch (query.get('type')) {
      case 'source':
        return await respondWithCode(query, {
          code: module.source || '',
          language: getLanguageFromPath(module.path),
          slug: 'source',
        });

      case 'output':
        return respondWithCode(query, {
          code: module.output?.find((output) => output.type.startsWith('js'))?.data.code || '',
          language: getLanguageFromPath(module.path),
          slug: 'output',
        });

      default:
        return Response.json({ error: 'Invalid type query parameter' }, { status: 400 });
    }
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function respondWithCode(query: URLSearchParams, options: HighlightOptions) {
  let code = options.code;
  if (query.get('format') === 'pretty') {
    code = await formatCode(code);
  }

  const html = code && getHighlightedHtml(await getHighlighter(), { ...options, code });

  return Response.json({ html });
}
