import type { IncomingMessage, ServerResponse } from 'node:http';

export function createRequest(req: IncomingMessage, res: ServerResponse) {
  const init: RequestInit = {
    method: req.method,
    headers: createHeaders(req),
    signal: createController(res).signal,
  };

  if (req.method === 'GET' || req.method === 'HEAD') {
    init.body = createBody(req);
    // @ts-expect-error - `duplex` is missing from the Node types
    init.duplex = 'half';
  }

  return new Request(createUrl(req), init);
}

function createUrl(req: IncomingMessage) {
  const protocol = 'encrypted' in req.socket && req.socket.encrypted ? 'https' : 'http';
  const host = req.headers.host ?? 'localhost';

  return new URL(req.url!, `${protocol}//${host}`);
}

function createController(res: ServerResponse) {
  const controller = new AbortController();
  res.once('close', () => controller.abort());
  return controller;
}

function createHeaders(req: IncomingMessage) {
  const headers = new Headers();

  for (const key in req.headers) {
    const value = req.headers[key];
    const values = Array.isArray(value) ? value : [value];

    for (const item of values) {
      if (item !== null && item !== undefined) {
        headers.append(key, item);
      }
    }
  }

  return headers;
}

function createBody(req: IncomingMessage): ReadableStream<Uint8Array> | undefined {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  return new ReadableStream({
    start(controller) {
      req.once('end', () => controller.close());
      req.on('data', (chunk) =>
        controller.enqueue(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength))
      );
    },
  });
}

export async function respond(res: ServerResponse, response: Response) {
  res.statusMessage = response.statusText;
  res.statusCode = response.status;

  respondHeaders(res, response);
  await respondBody(res, response);

  res.end();
}

function respondHeaders(res: ServerResponse, response: Response) {
  const rawHeaders: string[] = [];

  for (const [key, value] of response.headers) {
    rawHeaders.push(key, value);
  }

  res.writeHead(response.status, rawHeaders);
}

async function respondBody(res: ServerResponse, response: Response) {
  if (!response.body) return;

  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(value);
  }
}
